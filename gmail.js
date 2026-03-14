export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Récupérer le token depuis le cookie
    const cookies = parseCookies(req.headers.cookie || '');
    const tokenData = cookies.google_token ? JSON.parse(decodeURIComponent(cookies.google_token)) : null;

    if (!tokenData?.access_token) {
      return res.status(401).json({ error: 'Non connecté à Google', needsAuth: true });
    }

    // Rafraîchir le token si expiré
    let accessToken = tokenData.access_token;
    if (Date.now() > tokenData.expiry - 60000) {
      accessToken = await refreshToken(tokenData.refresh_token);
    }

    // Récupérer les emails non lus
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
    const listData = await listRes.json();

    if (!listRes.ok) return res.status(listRes.status).json({ error: listData.error?.message });

    const messages = listData.messages || [];

    // Récupérer les détails de chaque email
    const emails = await Promise.all(messages.map(async (msg) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || 'Inconnu';
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sans objet';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const snippet = msgData.snippet || '';
      const fromName = from.replace(/<.*>/, '').trim() || from;
      const initials = fromName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const colors = ['#7c6fff', '#4ecdc4', '#ffd93d', '#ff6b6b', '#60a5fa'];
      const color = colors[Math.abs(fromName.charCodeAt(0)) % colors.length];

      return { from: fromName, initials, subject, date: formatDate(date), summary: snippet.slice(0, 80) + '...', color };
    }));

    return res.status(200).json({ emails });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function parseCookies(cookieStr) {
  return Object.fromEntries(cookieStr.split(';').map(c => {
    const [k, ...v] = c.trim().split('=');
    return [k, v.join('=')];
  }));
}

async function refreshToken(refreshToken) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });
  const data = await r.json();
  return data.access_token;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}
