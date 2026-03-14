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

  const res = await fetch(
  "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }
);

  const data = await gmail.json();
  res.json(data);
}
