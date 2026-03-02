const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const postcss = require("rollup-plugin-postcss");

module.exports = {
  input: "./src/ReactFilterBox.tsx",
  external: ["react", "react-dom"],
  output: {
    file: "lib/react-filter-box.js",
    format: "umd",
    name: "react-filter-box",
    exports: "named",
    sourcemap: true,
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
  },
  plugins: [
    resolve({
      extensions: [".mjs", ".js", ".json", ".node", ".ts", ".tsx"],
    }),
    commonjs(),
    postcss({ inject: true, minimize: true }),
    typescript({
      tsconfig: "./tsconfig.json",
      include: ["src/**/*"],
      exclude: ["test/**/*", "src/example/**/*"],
      declaration: false,
      compilerOptions: {
        module: "esnext",
      },
      sourceMap: true,
    }),
  ],
};
