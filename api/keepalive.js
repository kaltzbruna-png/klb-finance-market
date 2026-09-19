module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server_not_configured" }));
    return;
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/rest/v1/listas?select=codigo&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!upstream.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "upstream_failed" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "keepalive_failed" }));
  }
};
