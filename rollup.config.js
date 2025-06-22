import { readdirSync } from "fs";
import path from "path";
import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "@rollup/plugin-terser";
import css from "rollup-plugin-css-only";

const production = !process.env.ROLLUP_WATCH;

const pagesDir = path.join(__dirname, "webviews", "pages");

export default readdirSync(pagesDir)
  .filter((file) => file.endsWith(".ts")) // only process TypeScript entry files
  .map((file) => {
    const name = file.split(".")[0];
    return {
      input: `webviews/pages/${file}`,
      output: {
        sourcemap: true,
        format: "iife",
        name: "app",
        file: `out/compiled/${name}.js`,
      },
      plugins: [
        svelte({
          compilerOptions: {
            dev: !production,
          },
          preprocess: sveltePreprocess(),
        }),
        css({ output: `${name}.css` }),

        resolve({
          browser: true,
          dedupe: ["svelte"],
        }),
        commonjs(),

        typescript({
          tsconfig: "webviews/tsconfig.json",
          sourceMap: !production,
          inlineSources: !production,
        }),

        production && terser(),
      ],
      watch: {
        clearScreen: false,
      },
    };
  });
