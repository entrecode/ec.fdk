import { defineConfig } from 'vite';
import { resolve } from 'path';

function shebang() {
  return {
    name: 'shebang',
    renderChunk(code) {
      return '#!/usr/bin/env node\n' + code;
    },
  };
}

export default defineConfig({
  plugins: [shebang()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'cli', 'main.ts'),
      formats: ['cjs'],
      fileName: () => 'cli.cjs',
    },
    rollupOptions: {
      external: [/^node:/],
    },
    target: 'node18',
    emptyOutDir: false,
  },
});
