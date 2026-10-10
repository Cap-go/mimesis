// Renders the promo videos from the recorded reels in public/.
//   bun scripts/render.ts
// Record the reels first (see README "Promo videos"), then:
//   store/preview/<locale>/app-preview.mp4   App Store app previews (886×1920, 30 fps)
//   website/video/mimesis-<lang>.mp4         website video + poster
//   store/creative/<locale>/                 App Store creative assets: header (21:9) and search
//                                            results (3:2) loops, plus the universal 16:9 still
import { mkdir } from 'node:fs/promises'
import { $ } from 'bun'

const root = `${import.meta.dir}/../..`
const out = `${import.meta.dir}/../out`
await mkdir(out, { recursive: true })

for (const [lang, locale] of [['en', 'en-US'], ['fr', 'fr-FR']]) {
  await $`bunx remotion render src/index.tsx preview-${lang} ${out}/preview-${lang}.mp4 --codec h264 --crf 16 --audio-bitrate 256k --log error`
  await mkdir(`${root}/store/preview/${locale}`, { recursive: true })
  // App Store wants stereo AAC; keep the H.264 stream as rendered.
  await $`ffmpeg -loglevel error -y -i ${out}/preview-${lang}.mp4 -c:v copy -c:a aac -b:a 256k -ac 2 -ar 48000 -movflags +faststart ${root}/store/preview/${locale}/app-preview.mp4`

  await $`bunx remotion render src/index.tsx website-${lang} ${out}/website-${lang}.mp4 --codec h264 --crf 18 --log error`
  await mkdir(`${root}/website/video`, { recursive: true })
  await $`ffmpeg -loglevel error -y -i ${out}/website-${lang}.mp4 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ${root}/website/video/mimesis-${lang}.mp4`
  await $`bunx remotion still src/index.tsx website-${lang} ${out}/poster-${lang}.png --frame=400 --log error`
  await $`cwebp -quiet -q 82 -resize 1280 0 ${out}/poster-${lang}.png -o ${root}/website/video/poster-${lang}.webp`
  const creative = `${root}/store/creative/${locale}`
  await mkdir(creative, { recursive: true })
  for (const id of ['header', 'search'])
    await $`bunx remotion render src/index.tsx ${id}-${lang} ${creative}/${id}.mp4 --codec h264 --crf 16 --muted --log error`
  await $`bunx remotion still src/index.tsx header-${lang} ${out}/header-${lang}.png --frame=0 --log error`
  await $`bunx remotion still src/index.tsx universal-${lang} ${out}/universal-${lang}.png --frame=0 --log error`
  // Apple rejects images with an alpha channel.
  await $`ffmpeg -loglevel error -y -i ${out}/header-${lang}.png -pix_fmt rgb24 ${creative}/header.png`
  await $`ffmpeg -loglevel error -y -i ${out}/universal-${lang}.png -pix_fmt rgb24 ${creative}/universal.png`
  console.log(lang, 'done')
}
