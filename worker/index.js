const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const SLUG_RE = /^\/posts\/[a-z0-9-]+\/$/;
const MAX_RAW_CHARS = 8 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW = 3600;
const EMAIL_RE = /^(?=.{3,254}$)[^\s@<>"'\x00-\x1f]+@[^\s@<>"'\x00-\x1f]+\.[^\s@<>"'\x00-\x1f]+$/;

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token, ip, env) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return data.success === true;
}

async function listComments(url, env) {
  const slug = url.searchParams.get("slug") || "";
  if (!SLUG_RE.test(slug)) return json({ error: "bad_slug" }, 400);
  const { results } = await env.DB
    .prepare(
      "SELECT id, author, body, created_at FROM comments WHERE slug = ?1 AND status = 'approved' ORDER BY created_at ASC LIMIT 200"
    )
    .bind(slug)
    .all();
  let replies = [];
  let notificationsAvailable = false;
  try {
    ({ results: replies = [] } = await env.DB.prepare(
      `SELECT r.id, r.comment_id, r.body, r.created_at FROM comment_replies r
       INNER JOIN comments c ON c.id = r.comment_id
       WHERE c.slug = ?1 AND c.status = 'approved' ORDER BY r.created_at ASC`
    ).bind(slug).all());
    try {
      await env.DB.prepare("SELECT comment_id FROM comment_subscriptions LIMIT 1").all();
      notificationsAvailable = true;
    } catch (e) {
      if (!/no such table/i.test(String(e?.message || e))) throw e;
    }
  } catch (e) {
    if (!/no such table/i.test(String(e?.message || e))) throw e;
  }
  const replyMap = new Map();
  for (const reply of replies) {
    if (!replyMap.has(reply.comment_id)) replyMap.set(reply.comment_id, []);
    replyMap.get(reply.comment_id).push({
      id: reply.id, author: "Yazar", body: reply.body, created_at: reply.created_at, is_author: true
    });
  }
  return json({
    notificationsAvailable,
    comments: results.map(c => ({ ...c, replies: replyMap.get(c.id) || [] }))
  });
}

async function createComment(request, env) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "bad_origin" }, 403);
  }

  const raw = await request.text();
  if (raw.length > MAX_RAW_CHARS) return json({ error: "too_large" }, 413);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const slug = String(data.slug || "");
  const author = String(data.author || "").trim();
  const body = String(data.body || "").trim();
  const token = String(data.token || "");
  const email = String(data.email || "").trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) return json({ error: "Geçersiz e-posta adresi" }, 400);

  if (!SLUG_RE.test(slug)) return json({ error: "bad_slug" }, 400);
  if (author.length < 1 || author.length > 40) return json({ error: "bad_author" }, 400);
  if (body.length < 2 || body.length > 2000) return json({ error: "bad_body" }, 400);
  if (!token) return json({ error: "captcha_required" }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "";
  if (!(await verifyTurnstile(token, ip, env))) {
    return json({ error: "captcha_failed" }, 403);
  }

  const ipHash = await sha256Hex(ip + env.IP_SALT);
  const now = Math.floor(Date.now() / 1000);

  const recent = await env.DB
    .prepare("SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ?1 AND created_at > ?2")
    .bind(ipHash, now - RATE_WINDOW)
    .first();
  if (recent && recent.n >= RATE_LIMIT) return json({ error: "rate_limited" }, 429);

  const insert = env.DB.prepare(
    "INSERT INTO comments (slug, author, body, created_at, status, ip_hash) VALUES (?1, ?2, ?3, ?4, 'pending', ?5)"
  ).bind(slug, author, body, now, ipHash);
  if (email) {
    try {
      await env.DB.batch([
        insert,
        env.DB.prepare(
          "INSERT INTO comment_subscriptions (comment_id, email, created_at) VALUES (last_insert_rowid(), ?1, ?2)"
        ).bind(email, now)
      ]);
    } catch (e) {
      console.error("Comment subscription storage failed", String(e));
      return json({ error: "Bildirim sistemi henüz hazır değil. E-postayı boş bırakarak yeniden deneyin." }, 503);
    }
  } else {
    await insert.run();
  }

  return json({ ok: true, status: "pending" }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/comments") {
      if (request.method === "GET") return listComments(url, env);
      if (request.method === "POST") return createComment(request, env);
      return json({ error: "method_not_allowed" }, 405);
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);

    return env.ASSETS.fetch(request);
  },
};
