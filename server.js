// Render runs `pnpm start` at the repository root, so start the proxy app that
// lives in the create-proxy-app default template (its public/ is the themed home page).
await import("./packages/create-proxy-app/templates/default/server.js");
