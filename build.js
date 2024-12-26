import { rm, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync, createWriteStream } from "node:fs";

import { execSync } from 'child_process';
import { fileURLToPath } from "url";

import Handlebars from "handlebars";

import { debug, info, warning, error, setFailed } from "@actions/core"
import { dirname, join, relative } from "node:path";
import { sync as globSync } from "glob";
import * as fs from "node:fs";
import { gt, prerelease } from "semver";
import { get } from "node:https";
import { createHash } from "node:crypto";

if (!existsSync('cache')) fs.mkdirSync('cache');
if (!existsSync('vpm')) fs.mkdirSync('vpm');

function readJsonFile(path) {
    return JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));
}

const config = {
    excludePatterns: [
        '**/*.hbs',
    ],
    sources: readJsonFile('./sources.json'),
}

Array.prototype.first = function (condition) {
    if (this.length === 0) return undefined;
    if (condition === undefined || condition === null) return this[0];

    for (let i = 0; i < this.length; i++) {
        if (condition(this[i])) {
            return this[i];
        }
    }

    return undefined;
}

async function updateIndex() {

    fs.mkdirSync('cache', { recursive: true });

    let options = { headers: {} };
    if (process.env.GITHUB_TOKEN !== undefined) {
        options.headers.Authorization = `Bearer: ${process.env.GITHUB_TOKEN}`;
    } else if (process.env.GITHUB_ACTIONS !== undefined) {
        warning('Not authenticated! This will most likely result in a 403 from GitHub API calls.')
    } else {
        info('GitHub API calls will be made without authentication. You may experience 403 errors.')
    }

    function isCacheFileOutdated(path) {
        if (!fs.existsSync(path)) return true;

        const stats = fs.statSync(path);
        const now = new Date();
        const fileTime = new Date(stats.mtime);
        const differenceInMinutes = (now.getTime() - fileTime.getTime()) / (1000 * 60);
        return differenceInMinutes > 30;
    }

    info('Updating releases...')
    let repository = {
        "name": "Vulpine Vault",
        "id": "dev.foxscore",
        "url": "https://foxscore.dev/vpm/index.json",
        "author": "felixkaiser2000@protonmail.com",
        "packages": {}
    };
    for (const repo of config.sources.githubReleases) {
        function getHashOfPackage(version) {
            return createHash('md5').update(`${repo}@${version}`).digest('hex');
        }

        let releases = [];
        const repoCachePath = 'cache/' + createHash('md5').update(repo).digest('hex');
        if (isCacheFileOutdated(repoCachePath)) {
            let page = 1;
            while (true) {
                const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, options);
                if (!response.ok) {
                    throw new Error(`GitHub API returned status ${response.status}: ${await response.text()}`);
                }
                const json = await response.json();
                releases = releases.concat(json);
                if (json.length != 100) break;
                page = page + 1;
            }
            fs.writeFileSync(repoCachePath, JSON.stringify(releases))
        } else {
            releases = readJsonFile(repoCachePath)
        }

        if (releases.length === 0) {
            setFailed(`The ${repo} repository doesn't have any releases`);
            exit(1);
        }

        for (let release of releases) {
            let jsonUrl = release.assets.first(a => a.name === 'package.json')?.browser_download_url;
            let zipUrl = release.assets.first(a => a.name.endsWith('.zip'))?.browser_download_url;
            let unityPackageUrl = release.assets.first(a => a.name.endsWith('.unitypackage'))?.browser_download_url;

            if (jsonUrl === undefined) {
                setFailed(`Release ${release.tag_name} of ${repo} does not contain a package.json file`);
                exit(1);
            }
            if (zipUrl === undefined) {
                setFailed(`Release ${release.tag_name} of ${repo} does not contain a zip file`);
                exit(1);
            }

            let jsonPath = 'cache/' + getHashOfPackage(release.tag_name);
            if (!existsSync(jsonPath))
                execSync(`wget -O ${jsonPath} "${jsonUrl}"`);
            let pkg = readJsonFile(jsonPath);
            pkg.url = zipUrl;
            if (unityPackageUrl !== undefined)
                pkg.unityPackage = unityPackageUrl;

            if (repository.packages[pkg.name] === undefined)
                repository.packages[pkg.name] = { versions: {} }
            repository.packages[pkg.name].versions[pkg.version] = pkg;
        }
    }
    await writeFile('vpm/index.json', JSON.stringify(repository));
}

async function build() {
    info('Getting ready...');
    if (existsSync('dist')) {
        await rm('dist', { recursive: true, force: true });
    }

    await updateIndex();

    info("Parsing index...");
    let packagesOverview = [];
    const index = readJsonFile('vpm/index.json');
    for (let id in index.packages) {
        let latest = null;
        let latestPre = null;
        for (let version in index.packages[id].versions) {
            if (prerelease(version)) {
                if (latestPre === null || gt(version, latestPre)) {
                    latestPre = version;
                }
            } else {
                if (latest === null || gt(version, latest)) {
                    latest = version;
                }
            }
        }
        if (latest === null) latest = latestPre;
        let pkg = index.packages[id].versions[latest];
        if (pkg.dependencies !== undefined && pkg.dependencies !== null && Object.keys(pkg.dependencies).length > 0) {
            let newDependencies = [];
            for (let key in pkg.dependencies) {
                newDependencies.push({
                    name: key,
                    range: pkg.dependencies[key]
                });
            }
            pkg.dependencies = newDependencies;
        } else {
            pkg.dependencies = undefined;
        }
        if (pkg.vpmDependencies !== undefined && pkg.vpmDependencies !== null && Object.keys(pkg.vpmDependencies).length > 0) {
            let newVpmDependencies = [];
            for (let key in pkg.vpmDependencies) {
                newVpmDependencies.push({
                    name: key,
                    range: pkg.vpmDependencies[key]
                });
            }
            pkg.vpmDependencies = newVpmDependencies;
        } else {
            pkg.vpmDependencies = undefined;
        }
        packagesOverview.push(pkg);
    }
    packagesOverview = packagesOverview.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' }));

    info("Copying assets...")
    function syncFiles(from, to, patterns, patternMustNotMatch) {
        const files = globSync(`${from}/**/*`, { nodir: true })
            .filter(
                (file) =>
                    patterns.some((pattern) => {
                        const regex = new RegExp(pattern.replace(/\*\*/g, ".*"));
                        return regex.test(file);
                    }) !== patternMustNotMatch,
            );
        files.forEach((file) => {
            const relativePath = relative(from, file);
            const outputPath = join(to, relativePath);
            fs.mkdirSync(dirname(outputPath), { recursive: true });
            fs.copyFileSync(file, outputPath);
            debug(`...Copied ${file} to ${outputPath}`);
        })
    }
    syncFiles(
        'wwwroot',
        'dist',
        ['**/*.hbs'],
        true
    );
    syncFiles(
        'vpm',
        'dist/vpm',
        ['**/*.json'],
        false
    )

    info('Building TypeScript...');
    try {
        execSync('tsc -p tsconfig.json', { stdio: 'inherit' });
    } catch {
        setFailed('Failed to build TypeScript.');
        return;
    }

    info('Building Handlebars...')
    Handlebars.registerPartial(
        'layout',
        await readFile('layout.hbs', { encoding: 'utf-8' }),
    )
    // noinspection HtmlUnknownTarget,HtmlUnknownAttribute
    Handlebars.registerPartial('linkButton', '<a href="{{href}}"><button {{style}}>{{> @partial-block }}</button></a>')
    Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
        // noinspection EqualityComparisonWithCoercionJS
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('ifEmpty', function (arg1, options) {
        return arg1.length === 0 ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('encodeURIComponent', function (value) {
        return encodeURIComponent(value);
    });
    const pages = globSync('wwwroot/**/*.hbs', { nodir: true });
    for (const page of pages) {
        const compiler = Handlebars.compile(
            fs.readFileSync(page, "utf8"),
        );
        const pageRelative = relative('wwwroot', page.substring(0, page.length - ".hbs".length));

        let resources = {
            tab:
                pageRelative === 'index' ? 'home' :
                    pageRelative === 'projects/index' ? 'projects' :
                        pageRelative === 'vpm/index' ? 'vpm' :
                            'unknown',
            packages: packagesOverview
        };
        const htmlContent = compiler(resources);

        const outPath = join('dist', pageRelative + ".html");
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, htmlContent);
        debug(`...Built ${pageRelative}`)
    }

    info('Done')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await build();
}
