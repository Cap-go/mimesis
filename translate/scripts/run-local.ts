// Runs the worker's queue handler on this machine, against Workers AI (REST) and the production R2
// dictionaries, to translate many languages at once without waiting on the queue.
//   bun scripts/run-local.ts <quick|full> <lang> [lang ...]
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { $ } from 'bun'
import worker from '../src/index'

const [phase, ...langs] = process.argv.slice(2) as ['quick' | 'full', ...string[]]
const ACCOUNT = '9ee3d7479a3c359681e3fab2c8cb22c0'
const BUCKET = 'mimesis-translations'
const token = (await Bun.file(`${process.env.HOME}/Library/Preferences/.wrangler/config/default.toml`).text()).match(/oauth_token = "([^"]+)"/)![1]
const dir = await mkdtemp(`${tmpdir()}/mimesis-r2-`)

const env = {
  MODEL: '@cf/openai/gpt-oss-120b',
  AI: {
    async run(model: string, inputs: object) {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${model}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(inputs) })
      const body = await res.json() as { result?: unknown, errors?: unknown }
      if (!res.ok)
        throw new Error(`AI ${res.status} ${JSON.stringify(body.errors)}`)
      return body.result
    },
  },
  CACHE: {
    async get(key: string) {
      const out = await $`bunx wrangler r2 object get ${`${BUCKET}/${key}`} --remote --pipe`.quiet().nothrow()
      return out.exitCode === 0 && out.stdout.length ? { json: async () => JSON.parse(out.stdout.toString()) } : null
    },
    async put(key: string, value: string) {
      const file = `${dir}/${key.replaceAll('/', '_')}`
      await Bun.write(file, value)
      await $`bunx wrangler r2 object put ${`${BUCKET}/${key}`} --file ${file} --content-type application/json --remote`.quiet()
    },
    async delete(key: string) {
      await $`bunx wrangler r2 object delete ${`${BUCKET}/${key}`} --remote`.quiet().nothrow()
    },
  },
  API: { fetch: (url: string) => fetch(url) },
  QUEUE: { send: async () => {} },
}

const queue = [...langs]
await Promise.all(Array.from({ length: Number(process.env.CONCURRENCY ?? 8) }, async () => {
  while (queue.length) {
    const lang = queue.shift()!
    const started = Date.now()
    try {
      await (worker as any).queue({ messages: [{ body: { lang, phase }, ack() {} }] }, env)
      console.log('done', lang, phase, `${Math.round((Date.now() - started) / 1000)}s`)
    }
    catch (err) {
      console.log('failed', lang, String(err).slice(0, 160))
    }
  }
}))
