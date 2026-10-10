import { Composition, registerRoot } from 'remotion'
import { APP_PREVIEW_FRAMES, AppPreview } from './AppPreview'
import { FPS } from './theme'
import { Website, WEBSITE_FRAMES } from './Website'

function Root() {
  return (
    <>
      {(['en', 'fr'] as const).map(lang => (
        <Composition key={`preview-${lang}`} id={`preview-${lang}`} component={AppPreview} defaultProps={{ lang }} durationInFrames={APP_PREVIEW_FRAMES} fps={FPS} width={886} height={1920} />
      ))}
      {(['en', 'fr'] as const).map(lang => (
        <Composition key={`website-${lang}`} id={`website-${lang}`} component={Website} defaultProps={{ lang }} durationInFrames={WEBSITE_FRAMES} fps={FPS} width={1920} height={1080} />
      ))}
    </>
  )
}

registerRoot(Root)
