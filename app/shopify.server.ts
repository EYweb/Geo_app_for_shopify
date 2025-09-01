import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-10";
import { DeliveryMethod } from "@shopify/shopify-api";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  restResources,
  scopes: process.env.SCOPES?.split(",") || [
    "write_products",
    "read_products", 
    "write_script_tags",
    "read_script_tags",
    "write_themes",
    "read_themes",
    "write_articles",
    "read_articles"
  ],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new (await import("@shopify/shopify-app-remix/server")).MemorySessionStorage(),
  distribution: "app",
  isEmbedded: true,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
  },
  isOnline: false,
});

export default shopify;
export const authenticate = shopify.authenticate;


