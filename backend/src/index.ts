import { Hono } from 'hono'
import { cors } from 'hono/cors'

interface Env {
  DB: D1Database
  IMAGES: R2Bucket
}

interface ModeRow {
  id: number
  name: string
  icon: string | null
  sort_order: number
  status: 'free' | 'paid' | 'locked'
}

interface GuessRow {
  id: number
  mode: number
  title: string
  author: string | null
  cover: string | null
  type: string | null
}

interface GameBody {
  deviceId?: unknown
  lang?: unknown
  mode?: unknown
  teams?: unknown
  foundGuess?: unknown
  skipGuess?: unknown
}

const CATALOG_TTL = 60 * 60
const IMAGE_TTL = 60 * 60 * 24 * 365

const app = new Hono<{ Bindings: Env }>()

app.use('/v1/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }))

app.get('/', c => c.json({ name: 'mimesis-api', ok: true }))

async function resolveLang(db: D1Database, locale: string) {
  const row = await db.prepare('SELECT id FROM langs WHERE locale = ?').bind(locale).first<{ id: number }>()
  return row?.id ?? 1
}

// One request gives the app everything it needs to play offline.
app.get('/v1/catalog', async (c) => {
  const locale = c.req.query('lang') ?? 'fr'
  const cache = caches.default
  const cacheKey = new Request(new URL(`/v1/catalog?lang=${encodeURIComponent(locale)}`, c.req.url))
  const cached = await cache.match(cacheKey)
  if (cached)
    return cached

  const db = c.env.DB
  const langId = await resolveLang(db, locale)
  const imageBase = new URL('/images/', c.req.url).toString()
  const [modes, guesses] = await db.batch([
    db.prepare('SELECT id, name, icon, sort_order, status FROM modes WHERE active = 1 ORDER BY sort_order, id'),
    db.prepare('SELECT id, mode, title, author, cover, type FROM guesses WHERE lang = ?').bind(langId),
  ])

  const res = c.json({
    lang: locale,
    themes: (modes.results as unknown as ModeRow[]).map(m => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      order: m.sort_order,
      status: m.status,
    })),
    guesses: (guesses.results as unknown as GuessRow[]).map(g => ({
      id: g.id,
      mode: g.mode,
      title: g.title,
      author: g.author,
      type: g.type,
      cover: g.cover ? `${imageBase}${g.cover}` : null,
    })),
  }, 200, { 'Cache-Control': `public, max-age=${CATALOG_TTL}` })
  c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()))
  return res
})

function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 2000 && value.every(v => Number.isInteger(v))
}

app.post('/v1/games', async (c) => {
  const body = await c.req.json<GameBody>().catch(() => null)
  if (!body)
    return c.json({ error: 'invalid_json' }, 400)
  const { deviceId, mode, teams, foundGuess, skipGuess } = body
  const locale = typeof body.lang === 'string' ? body.lang : 'fr'
  if (typeof deviceId !== 'string' || deviceId.length < 4 || deviceId.length > 128)
    return c.json({ error: 'invalid_device' }, 400)
  if (!Number.isInteger(mode))
    return c.json({ error: 'invalid_mode' }, 400)
  if (!Array.isArray(teams) || teams.length > 20)
    return c.json({ error: 'invalid_teams' }, 400)
  if (!isIdList(foundGuess) || !isIdList(skipGuess))
    return c.json({ error: 'invalid_guesses' }, 400)
  const teamsJson = JSON.stringify(teams)
  if (teamsJson.length > 50_000)
    return c.json({ error: 'teams_too_large' }, 400)

  const db = c.env.DB
  const langId = await resolveLang(db, locale)
  const [user] = await db.batch([
    db.prepare(`INSERT INTO users (id, games) VALUES (?1, 1)
      ON CONFLICT(id) DO UPDATE SET games = games + 1
      RETURNING games`).bind(deviceId),
    db.prepare(`INSERT INTO games (user_id, lang, mode, teams, found_guess, skip_guess)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
      .bind(deviceId, langId, mode, teamsJson, JSON.stringify(foundGuess), JSON.stringify(skipGuess)),
  ])
  const games = (user.results[0] as { games: number } | undefined)?.games ?? 1
  return c.json({ games })
})

app.get('/images/*', async (c) => {
  const key = c.req.path.slice('/images/'.length)
  if (!key)
    return c.notFound()
  const object = await c.env.IMAGES.get(key)
  if (!object)
    return c.notFound()
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  // Legacy uploads carry no extension and were stored as text/plain.
  if (!headers.get('content-type')?.startsWith('image/'))
    headers.set('content-type', 'image/jpeg')
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', `public, max-age=${IMAGE_TTL}, immutable`)
  headers.set('Access-Control-Allow-Origin', '*')
  return new Response(object.body, { headers })
})

export default app
