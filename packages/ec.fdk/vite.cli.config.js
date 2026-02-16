import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import ts from 'typescript';

function shebang() {
  return {
    name: 'shebang',
    renderChunk(code) {
      return '#!/usr/bin/env node\n' + code;
    },
  };
}

const SKIP_TYPES = new Set([
  'AdminConfig', 'AdminListConfig', 'AdminDmConfig', 'AdminDmListConfig',
  'AdminResourceListConfig', 'AdminCreateConfig', 'AdminDmCreateConfig',
  'AdminEditConfig', 'AdminDeleteConfig', 'GenericListOptions',
  'AssetCreateOptions', 'StorageAdapter', 'FdkConfig', 'PublicApiRoot',
]);

function inlineListItems(types) {
  for (const [name, body] of Object.entries(types)) {
    if (!name.endsWith('List')) continue;
    const m = body.match(/items:\s*(\w+)\[\]/);
    if (m && types[m[1]]) {
      types[name] = body.replace(`items: ${m[1]}[]`, `items: ${types[m[1]]}[]`);
    }
  }
}

function typeDefinitionsPlugin() {
  const virtualId = 'virtual:type-definitions';
  const resolvedId = '\0' + virtualId;

  return {
    name: 'type-definitions',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;

      const src = readFileSync(resolve(__dirname, 'src', 'types.ts'), 'utf-8');
      const sourceFile = ts.createSourceFile('types.ts', src, ts.ScriptTarget.Latest, true);
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

      const types = {};
      for (const stmt of sourceFile.statements) {
        if (!ts.isTypeAliasDeclaration(stmt)) continue;
        const name = stmt.name.text;
        if (SKIP_TYPES.has(name)) continue;
        types[name] = printer.printNode(ts.EmitHint.Unspecified, stmt.type, sourceFile);
      }

      inlineListItems(types);

      return `export default ${JSON.stringify(types, null, 2)};`;
    },
  };
}

export default defineConfig({
  plugins: [typeDefinitionsPlugin(), shebang()],
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
