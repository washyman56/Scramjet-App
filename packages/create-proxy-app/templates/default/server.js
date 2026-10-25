import http from "node:http";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();

app.use((req, res, next) => {
    if (routeRequest(req, res)) return;
    next();
});

// Use an absolute path so public assets always load correctly
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

// Dynamically use Render's assigned port, fallback to 3030 locally
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});