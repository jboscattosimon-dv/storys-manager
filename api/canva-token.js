// Vercel serverless function — exchanges Canva OAuth code for access token.
// Keeps CANVA_CLIENT_SECRET out of the browser.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST')   { res.status(405).end(); return }

  const clientId     = process.env.CANVA_CLIENT_ID
  const clientSecret = process.env.CANVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'Server missing CANVA_CLIENT_ID or CANVA_CLIENT_SECRET env vars' })
    return
  }

  const { code, code_verifier, redirect_uri } = req.body ?? {}
  if (!code || !code_verifier || !redirect_uri) {
    res.status(400).json({ error: 'Missing code, code_verifier or redirect_uri' })
    return
  }

  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri,
    client_id:     clientId,
    client_secret: clientSecret,
    code_verifier,
  })

  const upstream = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params,
  })

  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
