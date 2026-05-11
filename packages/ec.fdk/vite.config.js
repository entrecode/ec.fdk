import { defineConfig } from "vite";
import pkg from "./package.json";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src", "index.ts"),
        testing: resolve(__dirname, "src", "testing.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (ext, name) => ({ es: `${name}.mjs`, cjs: `${name}.cjs` }[ext]),
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies || {})],
    },
    //target: "esnext",
    target: "es2015",
  },
});
