import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/exhaustive-deps": "off", // Disable useEffect dependency warnings
      "@typescript-eslint/no-unused-vars": "off", // Disable unused variable errors
      "@typescript-eslint/no-explicit-any": "off", // Allow using `any` type
      "react/no-unescaped-entities": "off", // Disable warnings for unescaped characters
    },
  },
];

export default eslintConfig;
