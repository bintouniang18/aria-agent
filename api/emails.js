let emailsCache = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { from, subject, snippet } = req.body;
    const colors = ['#7c6fff','#4ecdc4','#ffd93d','#ff6b6b','#60a5fa'];
    const initials = (from||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const color = colors[Math.abs((from||'').charCodeAt(0)||0) % colors.length];
    emailsCache.unshift({ from, subject, snippet, initials, color, date: new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) });
    if (emailsCache.length > 10) emailsCache = emailsCache.slice(0, 10);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ emails: emailsCache });
  }
}
