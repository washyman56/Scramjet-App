import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.join(process.cwd(), "public");
const PORT = 3000;

const mime = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".png": "image/png",
};

const server = http.createServer((req, res) => {
	let filePath = path.join(PUBLIC, req.url === "/" ? "/index.html" : req.url);
	filePath = path.normalize(filePath);
	if (!filePath.startsWith(PUBLIC + path.sep) && filePath !== PUBLIC) {
		res.statusCode = 403;
		res.end("Forbidden");
		return;
	}
	fs.stat(filePath, (err, stat) => {
		if (err) {
			res.statusCode = 404;
			res.end("Not found");
			return;
		}
		if (stat.isDirectory()) {
			filePath = path.join(filePath, "index.html");
			fs.stat(filePath, (err2) => {
				if (err2) {
					res.statusCode = 404;
					res.end("Not found");
					return;
				}
				serveFile(filePath, res);
			});
			return;
		}
		serveFile(filePath, res);
	});
});

function serveFile(filePath, res) {
	const ext = path.extname(filePath).toLowerCase();
	res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
	const stream = fs.createReadStream(filePath);
	stream.pipe(res);
	stream.on("error", () => {
		res.statusCode = 500;
		res.end("Server error");
	});
}

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Static server: http://localhost:${PORT}/`);
	console.log(`Serving: ${PUBLIC}`);
});
