// Global stylesheets are imported for their side effects only
// (e.g. `import "@/globals.css"`); Next.js bundles them. Declaring the module
// lets TypeScript accept these imports, including when the
// noUncheckedSideEffectImports check is enabled (the default in newer
// TypeScript versions used by editors).
declare module "*.css";
