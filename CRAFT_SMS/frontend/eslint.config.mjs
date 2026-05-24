import { defineConfig, globalIgnores } from "eslint/config";

let nextVitals = [];
try {
  // eslint-config-next v14 sometimes exposes this path, but not always.
  // eslint-disable-next-line import/no-unresolved
  nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
  if (!Array.isArray(nextVitals)) nextVitals = [nextVitals];
} catch {
  nextVitals = [];
}

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
