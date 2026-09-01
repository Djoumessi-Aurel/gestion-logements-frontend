import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Assets statiques servis tels quels, dont les bundles générés au build par
    // next-pwa (sw.js, workbox-*.js, fallback-*.js, swe-worker-*.js). Ce sont du
    // code minifié : ils représentaient à eux seuls 110 des 123 avertissements
    // et rendaient `npm run lint` inexploitable.
    "public/**",
  ]),
  {
    rules: {
      // Convention du projet : un identifiant préfixé d'un underscore est
      // délibérément inutilisé (paramètre imposé par une signature, capture
      // d'erreur ignorée…). Sans cela, le storage neutre de store/index.ts
      // remonte deux avertissements pour des paramètres volontairement ignorés.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
