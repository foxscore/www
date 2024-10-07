import {rm, cp, rmdir} from "node:fs/promises";
import {existsSync} from "node:fs";

import { execSync } from 'child_process';
import { fileURLToPath } from "url";

import { debug, info, warning, error, setFailed } from "@actions/core"

async function build() {
    info('Preparing build...');
    if (existsSync('dist')) {
        await rm('dist', { recursive: true, force: true });
    }
    await cp('wwwroot', 'dist', { recursive: true, force: true });

    info('Building TypeScript...');
    try {
        execSync('tsc -p tsconfig.json', { stdio: 'inherit' });
    } catch {
        setFailed('Failed to build TypeScript.');
        return;
    }

    info('Done')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await build();
}
