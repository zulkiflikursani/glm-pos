import { createServer } from "http";

import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.WS_PORT ?? 3001);
const clients = new Set<WebSocket>();

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(body);
        }
      });
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(`WebSocket server berjalan di ws://localhost:${PORT}`);
});
