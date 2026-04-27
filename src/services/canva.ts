import type { StoryFrame } from '../types'

const CLIENT_ID = import.meta.env.VITE_CANVA_CLIENT_ID as string | undefined

// ── PKCE helpers ──────────────────────────────────────────────────
function randomBase64url(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256Base64url(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Token storage ─────────────────────────────────────────────────
const TOKEN_KEY = 'canva_access_token'
const VERIFIER_KEY = 'canva_code_verifier'

export function getCanvaToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function clearCanvaToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

// ── OAuth: start ──────────────────────────────────────────────────
export async function startCanvaOAuth() {
  if (!CLIENT_ID) throw new Error('VITE_CANVA_CLIENT_ID not configured')

  const verifier = randomBase64url(32)
  const challenge = await sha256Base64url(verifier)
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  const redirectUri = window.location.origin
  const url = new URL('https://www.canva.com/api/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'asset:write design:content:write')
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', 'canva_save')

  window.location.href = url.toString()
}

// ── OAuth: exchange code for token ────────────────────────────────
export async function exchangeCanvaCode(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier || !CLIENT_ID) throw new Error('Missing PKCE verifier or CLIENT_ID')

  const redirectUri = window.location.origin

  const res = await fetch('/api/canva-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: redirectUri }),
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  const data = await res.json()
  if (!data.access_token) throw new Error(data.error_description ?? 'No access token returned')

  sessionStorage.setItem(TOKEN_KEY, data.access_token)
  sessionStorage.removeItem(VERIFIER_KEY)
}

// ── Render frame to PNG blob ──────────────────────────────────────
async function frameToBlob(frame: StoryFrame): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')!

    const stops = frame.backgroundColor.match(/#[0-9a-fA-F]{3,6}/g) ?? ['#111', '#333']
    if (frame.backgroundColor.startsWith('linear')) {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
      stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = frame.backgroundColor
    }
    ctx.fillRect(0, 0, 1080, 1920)

    const drawText = () => {
      frame.textElements.forEach(el => {
        ctx.save()
        ctx.translate((el.x / 100) * 1080, (el.y / 100) * 1920)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize}px "${el.fontFamily}"`
        ctx.fillStyle = el.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 20
        ctx.fillText(el.content, 0, 0)
        ctx.restore()
      })
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png')
    }

    if (frame.imageUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1080, 1920)
        if (frame.overlayColor) {
          ctx.fillStyle = frame.overlayColor
          ctx.fillRect(0, 0, 1080, 1920)
        }
        drawText()
      }
      img.onerror = () => drawText()
      img.src = frame.imageUrl
    } else {
      drawText()
    }
  })
}

// ── Upload asset to Canva ─────────────────────────────────────────
async function uploadAsset(blob: Blob, name: string, token: string): Promise<string> {
  const nameB64 = btoa(unescape(encodeURIComponent(name)))

  const res = await fetch('https://api.canva.com/rest/v1/assets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/png',
      'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameB64, import_type: 'RASTER' }),
    },
    body: blob,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Asset upload failed (${res.status})`)
  }

  const data = await res.json()
  // Asset upload might be async — poll if needed
  const jobId = data.job?.id
  if (jobId) return pollAssetJob(jobId, token)

  return data.asset?.id ?? ''
}

async function pollAssetJob(jobId: string, token: string, tries = 0): Promise<string> {
  if (tries > 20) throw new Error('Asset upload timed out')
  await new Promise(r => setTimeout(r, 1500))

  const res = await fetch(`https://api.canva.com/rest/v1/asset-uploads/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()

  if (data.job?.status === 'success') return data.job.asset?.id ?? ''
  if (data.job?.status === 'failed') throw new Error('Asset upload failed on Canva side')
  return pollAssetJob(jobId, token, tries + 1)
}

// ── Create design from asset ──────────────────────────────────────
async function createDesign(assetId: string, name: string, token: string): Promise<string> {
  const res = await fetch('https://api.canva.com/rest/v1/designs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_type: { name: 'Instagram Story' },
      asset_id: assetId,
      title: name,
    }),
  })

  const data = await res.json()
  return data.design?.urls?.edit_url ?? 'https://www.canva.com/your-projects'
}

// ── Main export: save frames to Canva ────────────────────────────
export async function saveFramesToCanva(
  frames: StoryFrame[],
  projectName: string,
  onProgress?: (msg: string) => void
): Promise<string[]> {
  const token = getCanvaToken()
  if (!token) throw new Error('NOT_AUTHENTICATED')

  const urls: string[] = []

  for (let i = 0; i < frames.length; i++) {
    const name = frames.length > 1 ? `${projectName} — Story ${i + 1}` : projectName
    onProgress?.(`Enviando story ${i + 1} de ${frames.length}...`)

    const blob = await frameToBlob(frames[i])
    const assetId = await uploadAsset(blob, name, token)
    const url = await createDesign(assetId, name, token)
    urls.push(url)
  }

  return urls
}

export const canvaConfigured = Boolean(CLIENT_ID)
