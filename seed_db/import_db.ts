import { createWriteStream, readFileSync, unlinkSync } from 'fs'
import { get } from 'https'
import csvtojson from 'csvtojson'
import admin from 'firebase-admin'

const service_account = readFileSync('./seed_db/firebase_admin.json', {
  encoding: 'utf8',
  flag: 'r',
})
const storageBucket = 'mimesis-ce509.appspot.com'
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(service_account)),
  storageBucket,
})
const firestore = admin.firestore()
const storage = admin.storage().bucket()

const folders = ['art']
// const folders = ['art', 'expression', 'improbable', 'rebus']
const kind = ['base']
// const kind = ['base', 'plus']
// const folders = ['art', 'expression', 'improbable', 'rebus']

const downloadImage = async (url: string) => {
  let name = url.split('/')[url.split('/').length - 1]
  if (name === '800x800bb-50.webp')
    name = url.split('/')[url.split('/').length - 2]

  const path = `./seed_db/tmp/${name}`
  const file = createWriteStream(path)
  try {
    await new Promise((resolve, reject) => {
      get(url, (response) => {
        response.pipe(file)
        response
          .on('end', () => resolve(undefined))
          .on('error', () => reject(new Error(`error ${url}`)))
      })
    })
  }
  catch (err) {
    console.error('downloadImage', err)
  }
  return path
}

const parseAndUpload = async (folder: string, kind: string) => {
  const ref = firestore.collection(
    `mode/${folder}${kind === 'base' ? '' : '_plus'}/fr`,
  )
  console.log('Load data csv', folder)
  const datas = await csvtojson({ delimiter: ';' }).fromFile(
    `./seed_db/${folder}/${kind}.csv`,
  )
  console.log('Data csv loaded', folder)
  console.log('Upload data csv', folder)
  // datas.length = 1
  const allPaths: string[] = []
  for (let index = 0; index < datas.length; index++) {
    const data = datas[index]
    // console.log('data', data);

    if (data.cover) {
      const path = await downloadImage(data.cover)
      try {
        const destination = `art/${path.split('/')[path.split('/').length - 1]}`
        await storage.upload(path, { destination })
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(
          destination,
        )}?alt=media`
        // console.log('publicUrl', publicUrl)
        data.cover = publicUrl
        allPaths.push(path)
      }
      catch (err) {
        console.error(err, path)
      }
    }
    ref.doc().set(data)
  }
  allPaths.map(path => unlinkSync(path))
  console.log('Data csv uploaded', folder)
}

folders.forEach((folder) => {
  if (kind.includes('base')) {
    console.log('Upload base', folder)
    parseAndUpload(folder, 'base')
  }
  if (kind.includes('plus')) {
    console.log('Upload plus', folder)
    parseAndUpload(folder, 'plus')
  }
})
