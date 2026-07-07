export async function broadcastEvent(event: object) {
  const url =
    process.env.WS_NOTIFY_URL ?? "http://localhost:3001/broadcast";

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // WebSocket server mungkin belum berjalan — abaikan
  }
}
