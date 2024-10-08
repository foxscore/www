import {rm, cp, rmdir, readFile, mkdir, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";

import { execSync } from 'child_process';
import { fileURLToPath } from "url";

import Handlebars from "handlebars";

import { debug, info, warning, error, setFailed } from "@actions/core"
import {dirname, join, relative} from "node:path";
import {sync as globSync} from "glob";
import * as fs from "node:fs";

const config = {
    excludePatterns: [
        '**/*.hbs',
    ]
}

async function build() {
    info('Getting ready...');
    if (existsSync('dist')) {
        await rm('dist', { recursive: true, force: true });
    }
    const packagesOverview = JSON.parse(await readFile('vpm/meta.packages-overview.json', { encoding: 'utf-8' }));

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
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
        // noinspection EqualityComparisonWithCoercionJS
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('ifEmpty', function(arg1, options) {
        return arg1.length === 0 ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('encodeURIComponent', function(value) {
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
