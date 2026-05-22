export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const BIN_ID = process.env.JSONBIN_ID;
  const API_KEY = process.env.JSONBIN_KEY;

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({ error: "JSONBin not configured" });
  }

  try {
    if (req.method === "GET") {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { "X-Master-Key": API_KEY }
      });
      const data = await r.json();
      return res.status(200).json(data.record?.items || []);
    }
    if (req.method === "POST") {
      const { items } = req.body;
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
        body: JSON.stringify({ items })
      });
      return res.status(200).json({ ok: true });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
