const { getDefaultConfig } = require("expo/metro-config");
const httpProxy = require("http-proxy");

const config = getDefaultConfig(__dirname);

const AUTH_TARGET =
  process.env.EXPO_PUBLIC_AUTH_PROXY_TARGET ||
  "https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io";

const PRODUCT_TARGET =
  process.env.EXPO_PUBLIC_PRODUCT_PROXY_TARGET || "http://localhost:5272";

const authProxy = httpProxy.createProxyServer({
  target: AUTH_TARGET,
  changeOrigin: true,
  secure: true,
});

const productProxy = httpProxy.createProxyServer({
  target: PRODUCT_TARGET,
  changeOrigin: true,
});

function onProxyError(label) {
  return (err, _req, res) => {
    console.error(`[${label}-proxy]`, err.message);
    if (res && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `${label} proxy error`, detail: err.message }));
    }
  };
}

authProxy.on("error", onProxyError("auth"));
productProxy.on("error", onProxyError("product"));

/**
 * Expo Web — как Vite на desktop:
 *   `/auth-api/*` → Azure Auth
 *   `/api/*`      → Perry.Api :5272 (тот же Product backend)
 */
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/auth-api")) {
        req.url = req.url.replace(/^\/auth-api/, "") || "/";
        return authProxy.web(req, res);
      }
      // Product API + медиа (как Vite `/api` и раздача файлов с :5272)
      if (req.url && (req.url.startsWith("/api") || req.url.startsWith("/uploads"))) {
        return productProxy.web(req, res);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
