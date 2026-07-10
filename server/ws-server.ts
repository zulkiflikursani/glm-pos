import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { jwtVerify, JWTPayload } from "jose"; // Import for JWT verification
import { URLSearchParams } from "url"; // For parsing URL queries

const PORT = Number(process.env.WS_PORT ?? 3001);
const WS_SECRET = process.env.WS_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

if (!WS_SECRET) {
  console.error("WS_SECRET environment variable is not set.");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set.");
  process.exit(1);
}

const JWT_SECRET_ENCODED = new TextEncoder().encode(JWT_SECRET);

// Store clients along with their heartbeat timer
interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  role?: string;
}
const clients = new Set<AuthenticatedWebSocket>();

const server = createServer(async (req, res) => {
  // C3: Autentikasi endpoint /broadcast
  if (req.method === "POST" && req.url === "/broadcast") {
    // Validate secret header
    if (req.headers["x-ws-secret"] !== WS_SECRET) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      // C3: Validasi payload
      try {
        JSON.parse(body); // Simple validation, just check if it's valid JSON
      } catch (e) {
        console.error("Invalid JSON payload for broadcast:", e);
        res.writeHead(400);
        res.end("Bad Request: Invalid JSON payload");
        return;
      }

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

// C4: Heartbeat mechanism
const interval = setInterval(() => {
  clients.forEach((wsClient: AuthenticatedWebSocket) => {
    if (wsClient.isAlive === false) {
      console.log(`Terminating dead WebSocket connection for user: ${wsClient.userId}`);
      clients.delete(wsClient);
      return wsClient.terminate();
    }
    wsClient.isAlive = false;
    wsClient.ping();
  });
}, 30000); // Check every 30 seconds

wss.on("close", () => {
  clearInterval(interval);
});

// C4: Autentikasi koneksi WebSocket
wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "Authentication token required");
    console.warn("WebSocket connection rejected: No token provided.");
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED);
    ws.userId = payload.userId as string;
    ws.role = payload.role as string;

    clients.add(ws);
    console.log(`WebSocket connected: User ${ws.userId} (${ws.role})`);
  } catch (e) {
    ws.close(1008, "Authentication failed");
    console.warn("WebSocket connection rejected: Invalid token.", e);
    return;
  }

  ws.on("close", () => {
    console.log(`WebSocket disconnected: User ${ws.userId}`);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server berjalan di ws://localhost:${PORT}`);
});
