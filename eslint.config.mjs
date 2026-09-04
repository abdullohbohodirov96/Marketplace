import nextPlugin from "eslint-config-next";

const eslintConfig = [
  ...nextPlugin,
  {
    ignores: [".next/**", "node_modules/**", "supabase/**"],
  },
];

export default eslintConfig;
