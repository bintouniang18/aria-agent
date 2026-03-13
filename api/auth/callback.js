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
    const host = req.headers.host || process.env.VERCEL_URL || 'aria-agent-iota.vercel.app';
    const redirectUri = `https://${host}/api/auth/callback`;

    // Ã‰changer le code contre un token
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

    // Stocker le token dans un cookie sÃ©curisÃ©
    const tokenData = encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: Date.now() + (tokens.expires_in * 1000)
    }));

    res.setHeader('Set-Cookie', `google_token=${tokenData}; Path=/; Secure; SameSite=None; Max-Age=2592000`);
    return res.redirect('/?auth=success');

  } catch (err) {
    return res.redirect('/?auth=error&message=' + encodeURIComponent(err.message));
  }
}
