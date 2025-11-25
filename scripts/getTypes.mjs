import { exec as execCb } from 'node:child_process'
import util from 'node:util'
import { supa_url } from './utils.mjs'

const exec = util.promisify(execCb)
const projectId = supa_url.split('//')[1].split('.')[0]
const command = `npx supabase gen types typescript --project-id=${projectId} > src/types/database.types.ts`

async function main() {
  try {
    const { stderr } = await exec(command)
    if (stderr)
      console.error(stderr)
    else
      console.log('Type generated ✅')
  }
  catch (e) {
    console.error(e) // should contain code (exit code) and signal (that caused the termination).
  }
}
main()
