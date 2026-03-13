export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?auth=error&message=' + encodeURIComponent(error));
  }

  if (!code) {
    return res.redirect('/?auth=error&message=no_code');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/auth/callback`
      : 'http://localhost:3000/api/auth/callback';

    // Échanger le code contre un token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.redirect('/?auth=error&message=' + encodeURIComponent(tokens.error_description || 'token_error'));
    }

    // Stocker le token dans un cookie sécurisé
    const tokenData = encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: Date.now() + (tokens.expires_in * 1000)
    }));

    res.setHeader('Set-Cookie', `google_token=${tokenData}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    return res.redirect('/?auth=success');

  } catch (err) {
    return res.redirect('/?auth=error&message=' + encodeURIComponent(err.message));
  }
}
