import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";

// Some installations/ESLint versions don't ship the `core-web-vitals` entrypoint.
// Hotfix: keep lint deterministic by conditionally importing it.
let nextVitals = [];
try {
  // eslint-config-next v14 sometimes exposes this path, but not always.
  // eslint-disable-next-line import/no-unresolved
  nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
} catch {
  nextVitals = [];
}


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
