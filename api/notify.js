const webpush = require("web-push");

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readBody = req =>
  new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }
    let data = "";
    req.on("data", chunk => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const formatQty = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "1";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n);
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@klb-finance.local";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!privateKey || !publicKey || !supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "server_not_configured" });
  }

  try {
    const body = await readBody(req);
    const lista_codigo = String(body.lista_codigo || "").trim();
    const nome = String(body.nome || "").trim();
    const item_nome = String(body.item_nome || "").trim().slice(0, 60);
    const quantidade = Number(body.quantidade);

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(lista_codigo) || nome.length < 2 || !item_nome) {
      return json(res, 400, { error: "invalid_payload" });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const query = new URLSearchParams({
      lista_codigo: `eq.${lista_codigo}`,
      nome: `neq.${nome}`,
      select: "endpoint,p256dh,auth"
    });

    const subsRes = await fetch(`${supabaseUrl}/rest/v1/push_inscricoes?${query}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!subsRes.ok) return json(res, 502, { error: "subscription_lookup_failed" });

    const subscriptions = await subsRes.json();
    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return json(res, 200, { sent: 0 });
    }

    const qty = formatQty(quantidade);
    const label = Number(quantidade) === 1 ? item_nome : `${item_nome} (${qty})`;
    const payload = JSON.stringify({
      title: "KLB Finance",
      body: `${label} — ${nome}`,
      url: `/#c=${encodeURIComponent(lista_codigo)}`
    });

    let sent = 0;
    const stale = [];

    for (const row of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload
        );
        sent += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) stale.push(row.endpoint);
      }
    }

    for (const endpoint of stale) {
      await fetch(`${supabaseUrl}/rest/v1/push_inscricoes?endpoint=eq.${encodeURIComponent(endpoint)}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }).catch(() => {});
    }

    return json(res, 200, { sent });
  } catch {
    return json(res, 500, { error: "notify_failed" });
  }
};
