let eventsCache = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { title, date, location } = req.body;
    const colors = ['#7c6fff','#60a5fa','#4ecdc4','#ffd93d'];
    eventsCache.unshift({
      title, date,
      who: location || '',
      time: date ? new Date(date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—',
      color: colors[eventsCache.length % colors.length]
    });
    if (eventsCache.length > 10) eventsCache = eventsCache.slice(0, 10);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ events: eventsCache });
  }
}
