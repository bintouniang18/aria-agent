export default async function handler(req, res) {

  const cookie = req.headers.cookie || "";

  const sessionId = cookie
    .split("; ")
    .find(c => c.startsWith("session_id="))
    ?.split("=")[1];

  if (!sessionId) {
    return res.status(401).json({ error: "Not connected" });
  }

  const tokens = global.sessions?.[sessionId];

  if (!tokens) {
    return res.status(401).json({ error: "Session expired" });
  }

  const accessToken = tokens.access_token;

  if (!accessToken) {
    return res.status(401).json({
      error: "Google non connecté"
    });
  }

  const gmailRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const data = await gmailRes.json();

  res.status(200).json(data);
}
