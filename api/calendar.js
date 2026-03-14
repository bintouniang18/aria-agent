export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const tokenData = cookies.google_token ? JSON.parse(decodeURIComponent(cookies.google_token)) : null;

    if (!tokenData?.access_token) {
      return res.status(401).json({ error: 'Non connectÃ© Ã  Google', needsAuth: true });
    }

    let accessToken = tokenData.access_token;
    if (Date.now() > tokenData.expiry - 60000) {
      accessToken = await refreshToken(tokenData.refresh_token);
    }

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${in7days.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=8`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calData = await calRes.json();

    if (!calRes.ok) return res.status(calRes.status).json({ error: calData.error?.message });

    const colors = ['#7c6fff', '#60a5fa', '#4ecdc4', '#ffd93d'];
    const events = (calData.items || []).map((ev, i) => {
      const start = ev.start?.dateTime || ev.start?.date || '';
      const d = new Date(start);
      const time = ev.start?.dateTime
        ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : 'Toute la journÃ©e';
      const date = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      const attendees = (ev.attendees || []).map(a => a.displayName || a.email).slice(0, 2).join(', ');

      return {
        title: ev.summary || 'Sans titre',
        time,
        date,
        who: attendees || ev.location || '',
        color: colors[i % colors.length]
      };
    });

    return res.status(200).json({ events });

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
