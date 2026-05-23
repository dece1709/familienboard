import Bring from "bring-shopping";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const bring = new Bring({
      mail: process.env.BRING_EMAIL,
      password: process.env.BRING_PASSWORD
    });

    await bring.login();
    const { lists } = await bring.loadLists();
    const list = lists.find(l => l.name === "Einkaufsliste") || lists[0];
    if (!list) return res.status(404).json({ error: "No list found" });

    if (req.method === "GET") {
      const data = await bring.getItems(list.listUuid);
      const purchase = (data.purchase || []).map(i => ({
        id: i.uuid || i.name,
        text: i.name,
        qty: i.specification || "",
        done: false
      }));
      const recently = (data.recently || []).map(i => ({
        id: (i.uuid || i.name) + "_done",
        text: i.name,
        qty: i.specification || "",
        done: true
      }));
      return res.status(200).json([...purchase, ...recently]);
    }

    if (req.method === "POST") {
      const { action, item } = req.body;
      if (action === "add") {
        await bring.saveItem(list.listUuid, item.text, item.qty || "");
      } else if (action === "remove") {
        await bring.removeItem(list.listUuid, item.text);
      } else if (action === "complete") {
        await bring.moveToRecentList(list.listUuid, item.text);
      }
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
