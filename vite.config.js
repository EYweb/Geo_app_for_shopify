import { defineConfig } from "vite";
import { shopify } from "@shopify/shopify-app-remix/vite";

export default defineConfig({
  plugins: [
    shopify({
      appType: "app",
      buildDir: "build",
      buildCommand: "npm run build",
      devCommand: "npm run dev",
      devPort: 3000,
    }),
  ],
});
