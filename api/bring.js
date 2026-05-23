const BRING_BASE = "https://api.getbring.com/rest/v2";

async function login() {
  const res = await fetch(`${BRING_BASE}/bringauth`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `email=${encodeURIComponent(process.env.BRING_EMAIL)}&password=${encodeURIComponent(process.env.BRING_PASSWORD)}`
  });
  if (!res.ok) throw new Error("Bring login failed: " + res.status);
  return await res.json();
}

async function getLists(token, uuid) {
  const res = await fetch(`${BRING_BASE}/bringusers/${uuid}/lists`, {
    headers: { "Authorization": `Bearer ${token}`, "X-BRING-CLIENT": "webApp", "X-BRING-COUNTRY": "DE" }
  });
  if (!res.ok) throw new Error("getLists failed: " + res.status);
  return await res.json();
}

async function getItems(token, listUuid) {
  const res = await fetch(`${BRING_BASE}/bringlists/${listUuid}`, {
    headers: { "Authorization": `Bearer ${token}`, "X-BRING-CLIENT": "webApp", "X-BRING-COUNTRY": "DE" }
  });
  if (!res.ok) throw new Error("getItems failed: " + res.status);
  return await res.json();
}

async function saveItem(token, listUuid, itemName, spec) {
  const body = new URLSearchParams({ purchase: itemName, recently: "", specification: spec || "", remove: "", sender: "null" });
  const res = await fetch(`${BRING_BASE}/bringlists/${listUuid}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-BRING-CLIENT": "webApp", "X-BRING-COUNTRY": "DE"
    },
    body: body.toString()
  });
  if (!res.ok) throw new Error("saveItem failed: " + res.status);
}

async function removeItem(token, listUuid, itemName) {
  const body = new URLSearchParams({ purchase: "", recently: itemName, specification: "", remove: itemName, sender: "null" });
  const res = await fetch(`${BRING_BASE}/bringlists/${listUuid}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-BRING-CLIENT": "webApp", "X-BRING-COUNTRY": "DE"
    },
    body: body.toString()
  });
  if (!res.ok) throw new Error("removeItem failed: " + res.status);
}

async function completeItem(token, listUuid, itemName) {
  const body = new URLSearchParams({ purchase: "", recently: itemName, specification: "", remove: "", sender: "null" });
  const res = await fetch(`${BRING_BASE}/bringlists/${listUuid}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-BRING-CLIENT": "webApp", "X-BRING-COUNTRY": "DE"
    },
    body: body.toString()
  });
  if (!res.ok) throw new Error("completeItem failed: " + res.status);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const auth = await login();
    const token = auth.access_token;
    const userUuid = auth.uuid;

    const { lists } = await getLists(token, userUuid);
    // Use first list (Einkaufsliste) or find by name
    const list = lists.find(l => l.name === "Einkaufsliste") || lists[0];
    if (!list) return res.status(404).json({ error: "No list found" });
    const listUuid = list.listUuid;

    if (req.method === "GET") {
      const data = await getItems(token, listUuid);
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
        await saveItem(token, listUuid, item.text, item.qty || "");
      } else if (action === "remove") {
        await removeItem(token, listUuid, item.text);
      } else if (action === "complete") {
        await completeItem(token, listUuid, item.text);
      }
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
