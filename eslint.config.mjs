import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));

// eslint-config-next 15 ships legacy (eslintrc) configs, so they are loaded
// through FlatCompat for ESLint 9's flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // TypeScript rules only apply to converted .ts/.tsx files.
  ...compat.extends("next/typescript").map((config) => ({ ...config, files: ["**/*.ts", "**/*.tsx"] })),
  {
    ignores: [".next/**", "out/**", "build/**", "public/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
