import { get } from 'https'
import csvtojson from 'csvtojson'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://asavjwzyvjjyjdmsjlhv.supabase.co'
const supabaseAnonKey = '***'

export const useSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// sql delete all guesses
// DELETE FROM guesses
const supabase = useSupabase()
const storageBucket = 'mimesis-public-images'

// const folders = ['art']
const folders = ['art', 'expression', 'improbable', 'rebus']
// const kinds = ['base']
const kinds = ['base', 'plus']

const modeId = {
  art: 1,
  art_plus: 2,
  expression: 3,
  expression_plus: 4,
  improbable: 5,
  improbable_plus: 5,
  rebus: 6,
  rebus_plus: 7,
}
const langId = 1

const urlToBuffer = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const data: Uint8Array[] = []
    get(url, (res) => {
      res
        .on('data', (chunk: Uint8Array) => {
          data.push(chunk)
        })
        .on('end', () => {
          resolve(Buffer.concat(data))
        })
        .on('error', (err) => {
          console.log('Error: ', url, err.message)
          reject(err)
        })
    })
  })
}

interface CsvImport {
  type: string
  title: string
  author: string
  cover: string
}
interface Guesses extends CsvImport {
  lang: number
  mode: number
}

const autoRetryUpload = async (destination: string, body: Buffer): Promise<string> => {
  let image = ''
  while (image !== '') {
    const res = await supabase
      .storage
      .from(storageBucket)
      .upload(destination, body)
    if (!res.error) {
      const res2 = await supabase
        .storage
        .from(storageBucket)
        .getPublicUrl(destination)
      if (!res2.error && res2.data)
        image = res2.data.publicURL
      else
        console.log('Error destination, retry', destination, res2.error)
    }
  }
  return image
}

const parseAndUpload = async (folder: string, kind: string) => {
  console.log('Load data csv', folder)
  const datas: Guesses[] = await csvtojson({ delimiter: ';' }).fromFile(
    `./seed_db/${folder}/${kind}.csv`,
  )
  console.log('Data csv loaded', folder)
  console.log('Prepare data', folder)
  // datas.length = 1

  const res = await Promise.all(datas.map(async (data, i) => {
    console.log(`${kind} ${folder} chunk ${i + 1}/${datas.length}`)

    data.lang = langId
    const modeName = `${folder}${kind === 'plus' ? '_plus' : ''}`
    data.mode = modeId[modeName as keyof typeof modeId]
    // console.log('data', data);

    if (data.cover) {
      try {
        const body = await urlToBuffer(data.cover)
        const randomId = Math.random().toString(36).substring(2, 15)
        const destination = `guesses/${folder}/${randomId}`
        data.cover = await autoRetryUpload(destination, body)
      }
      catch (err) {
        console.error(err, data.cover)
      }
    }
    return data
  }))
  console.log('Upload data', folder)
  // split res in chunks of 100
  const chunks: Guesses[][] = []
  const chunkSize = 50
  for (let i = 0; i < res.length; i += chunkSize)
    chunks.push(res.slice(i, i + chunkSize))

  await Promise.all(chunks.map(async (chunk, i) => {
    console.log(`Upload ${folder} chunk ${i + 1}/${chunks.length}`)
    await supabase
      .from ('mimesis_guesses')
      .insert(chunk)
  }))
  console.log('Data csv uploaded', folder, kind)
}

const main = async () => {
  await Promise.all(folders.map(async (folder) => {
    if (kinds.includes('base')) {
      console.log('Upload base', folder)
      await parseAndUpload(folder, 'base')
    }
    if (kinds.includes('plus')) {
      console.log('Upload plus', folder)
      await parseAndUpload(folder, 'plus')
    }
  }))
}
main()
