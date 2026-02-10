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
      entry: resolve(__dirname, 'src', 'mcp.ts'),
      formats: ['cjs'],
      fileName: () => 'mcp.cjs',
    },
    rollupOptions: {
      external: [/^node:/, /^@modelcontextprotocol/, /^zod/],
    },
    target: 'node18',
    emptyOutDir: false,
  },
});
