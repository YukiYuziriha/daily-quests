# TypeScript Configuration

## verbatimModuleSyntax
- Requires `type` keyword for type-only imports: `import type { X }`
- Build errors if missing `type` on imports that are only used as types
- Enforces explicit separation between type and value imports

## Path Aliases
- Must be configured in **TWO** places:
  - `tsconfig.app.json`: `"paths": { "@/*": ["./src/*"] }`
  - `vite.config.ts`: `resolve: { alias: { '@': path.resolve(__dirname, './src') } }`
- Missing either configuration breaks `@/` imports during build or runtime
