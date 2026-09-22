import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
    },
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    oxc: {
        jsx: {
            runtime: 'automatic',
            importSource: 'react',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
