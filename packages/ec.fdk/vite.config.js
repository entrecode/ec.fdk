import { defineConfig } from "vite";
import pkg from "./package.json";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, "src", "index.ts"),
      formats: ["es", "cjs"],
      fileName: (ext) => ({ es: "index.mjs", cjs: "index.cjs" }[ext]),
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies || {})],
    },
    //target: "esnext",
    target: "es2015",
  },
});
