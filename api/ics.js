export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const httpUrl = decodeURIComponent(url).replace(/^webcal:\/\//i, "https://");
    const response = await fetch(httpUrl, {
      headers: { "User-Agent": "Familienboard/1.0" }
    });
    if (!response.ok) throw new Error("Fetch failed: " + response.status);
    const text = await response.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
