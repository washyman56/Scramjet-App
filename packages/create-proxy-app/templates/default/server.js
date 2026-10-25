import http from "node:http";
import { createRequire } from "node:module";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dirOf = (specifier) => path.dirname(require.resolve(specifier));
const { routeRequest, routeUpgrade } = await bootstrap({
    transport: "epoxy",
    epoxyClientPath: "/epoxy/index.js",
});

const app = express();

app.use((req, res, next) => {
    if (routeRequest(req, res)) return;
    next();
});

// Serve your public folder using absolute path resolution
app.use("/epoxy/", express.static(dirOf("@mercuryworkshop/epoxy-transport")));
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

// Dynamically use Render's PORT environment variable
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
