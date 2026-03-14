export default async function handler(req, res) {
  const { code } = req.query;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  const tokens = await tokenRes.json();

  const sessionId = crypto.randomUUID();

  global.sessions = global.sessions || {};
  global.sessions[sessionId] = tokens;

  res.setHeader(
    "Set-Cookie",
    `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  res.redirect("/");
}
