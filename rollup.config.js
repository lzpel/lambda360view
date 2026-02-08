import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom', 'react/jsx-runtime'];

export default [
    // Main build (CJS + ESM)
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: 'dist/index.esm.js',
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
            }),
        ],
        external,
    },
    // Type declarations
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'esm',
        },
        plugins: [dts()],
        external,
    },
];
