// One-shot export of the legacy Supabase project into D1 SQL + R2 images.
// Usage:
//   SUPABASE_URL=... SUPABASE_KEY=... bun scripts/migrate-from-supabase.ts sql
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... SUPABASE_URL=... SUPABASE_KEY=... bun scripts/migrate-from-supabase.ts images
//   SUPABASE_URL=... SUPABASE_KEY=... bun scripts/migrate-from-supabase.ts delta <last legacy game id in D1>
//   then: wrangler d1 execute mimesis --remote --file .migration/delta.sql
import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const BUCKET = process.env.R2_BUCKET ?? 'mimesis-images'
const STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/mimesis-public-images/`
const OUT_DIR = `${import.meta.dir}/../.migration/`
const PAGE = 1000

type Row = Record<string, unknown>

async function fetchAll(table: string, order = 'id'): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    })
    if (!res.ok)
      throw new Error(`${table}: ${res.status} ${await res.text()}`)
    const page = await res.json() as Row[]
    rows.push(...page)
    if (page.length < PAGE)
      return rows
  }
}

function sql(value: unknown): string {
  if (value === null || value === undefined)
    return 'NULL'
  if (typeof value === 'number')
    return String(value)
  if (typeof value === 'boolean')
    return value ? '1' : '0'
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return `'${text.replaceAll('\'', '\'\'')}'`
}

function inserts(table: string, columns: string[], rows: unknown[][]): string {
  const out: string[] = []
  // D1 caps a single statement at 100 KB, keep batches small.
  for (let i = 0; i < rows.length; i += 25) {
    const values = rows.slice(i, i + 25).map(r => `(${r.map(sql).join(', ')})`).join(',\n')
    out.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values};`)
  }
  return out.join('\n')
}

function coverKey(cover: unknown): string | null {
  if (typeof cover !== 'string' || !cover)
    return null
  // A few legacy rows point at dead third-party hosts; drop them.
  return cover.startsWith(STORAGE_PREFIX) ? cover.slice(STORAGE_PREFIX.length) : null
}

async function exportSql() {
  const [langs, modes, guesses, users, games] = await Promise.all([
    fetchAll('mimesis_lang'),
    fetchAll('mimesis_modes'),
    fetchAll('mimesis_guesses'),
    fetchAll('mimesis_users'),
    fetchAll('mimesis_games'),
  ])
  const userIds = new Set(users.map(u => u.id))
  // Games can reference devices that never got a users row; backfill them so the FK holds.
  for (const g of games) {
    if (g.user_id && !userIds.has(g.user_id)) {
      userIds.add(g.user_id)
      users.push({ id: g.user_id, created_at: g.created_at, games: 0 })
    }
  }
  const parts = [
    inserts('langs', ['id', 'created_at', 'name', 'locale'], langs.map(l => [l.id, l.created_at, l.name, l.id === 1 ? 'fr' : String(l.locale ?? l.id)])),
    inserts('modes', ['id', 'created_at', 'name', 'icon', 'active', 'id_ios', 'id_android', 'sort_order', 'status'], modes.map(m => [m.id, m.created_at, m.name, m.icon, m.active, m.id_ios, m.id_android, m.order, m.status])),
    inserts('guesses', ['id', 'created_at', 'lang', 'mode', 'author', 'cover', 'title', 'type'], guesses.map(g => [g.id, g.created_at, g.lang, g.mode, g.author, coverKey(g.cover), g.title, g.type])),
    inserts('users', ['id', 'created_at', 'games'], users.map(u => [u.id, u.created_at, u.games])),
    inserts('games', ['id', 'created_at', 'user_id', 'lang', 'mode', 'teams', 'found_guess', 'skip_guess'], games.map(g => [g.id, g.created_at, g.user_id, g.lang, g.mode, JSON.stringify(g.team ?? []), JSON.stringify(g.found_guess ?? []), JSON.stringify(g.skip_guess ?? [])])),
  ]
  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(`${OUT_DIR}data.sql`, `${parts.join('\n')}\n`)
  console.log(`langs=${langs.length} modes=${modes.length} guesses=${guesses.length} users=${users.length} games=${games.length}`)
}

// Old store builds keep writing to Supabase until they update; replay their games into D1.
// D1 ids for new games start at 1,000,000, so legacy ids never collide.
async function exportDelta(sinceId: number) {
  const games = (await fetchAll('mimesis_games')).filter(g => Number(g.id) > sinceId)
  const users = await fetchAll('mimesis_users')
  const ids = new Set(games.map(g => g.user_id))
  const parts = [
    ...users.filter(u => ids.has(u.id)).map(u => `INSERT INTO users (id, created_at, games) VALUES (${sql(u.id)}, ${sql(u.created_at)}, ${sql(u.games)}) ON CONFLICT(id) DO UPDATE SET games = max(games, excluded.games);`),
    inserts('games', ['id', 'created_at', 'user_id', 'lang', 'mode', 'teams', 'found_guess', 'skip_guess'], games.map(g => [g.id, g.created_at, g.user_id, g.lang, g.mode, JSON.stringify(g.team ?? []), JSON.stringify(g.found_guess ?? []), JSON.stringify(g.skip_guess ?? [])])).replaceAll('INSERT INTO', 'INSERT OR IGNORE INTO'),
  ]
  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(`${OUT_DIR}delta.sql`, `${parts.join('\n')}\n`)
  console.log(`delta games=${games.length} since id ${sinceId}`)
}

async function copyImages() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!
  const token = process.env.CLOUDFLARE_API_TOKEN!
  const guesses = await fetchAll('mimesis_guesses')
  const keys = [...new Set(guesses.map(g => coverKey(g.cover)).filter((k): k is string => !!k))]
  let done = 0
  let failed = 0
  const queue = [...keys]
  async function worker() {
    for (let key = queue.shift(); key; key = queue.shift()) {
      try {
        const src = await fetch(`${STORAGE_PREFIX}${key}`)
        if (!src.ok)
          throw new Error(`download ${src.status}`)
        const body = await src.arrayBuffer()
        const put = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/objects/${key.split('/').map(encodeURIComponent).join('/')}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': src.headers.get('content-type') ?? 'image/jpeg',
          },
          body,
        })
        if (!put.ok)
          throw new Error(`upload ${put.status} ${await put.text()}`)
        done++
      }
      catch (err) {
        failed++
        console.error(key, err)
      }
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker))
  console.log(`images uploaded=${done} failed=${failed} total=${keys.length}`)
  if (failed)
    process.exit(1)
}

const step = process.argv[2]
if (step === 'sql')
  await exportSql()
else if (step === 'images')
  await copyImages()
else if (step === 'delta')
  await exportDelta(Number(process.argv[3] ?? 0))
else
  throw new Error('usage: migrate-from-supabase.ts <sql|images|delta <sinceId>>')
