import { Fragment } from 'react'
import { Composition, registerRoot } from 'remotion'
import { APP_PREVIEW_FRAMES, AppPreview } from './AppPreview'
import { Header, LOOP_FRAMES, Search, Universal } from './Creative'
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
      {(['en', 'fr'] as const).map(lang => (
        <Fragment key={`creative-${lang}`}>
          <Composition id={`header-${lang}`} component={Header} defaultProps={{ lang }} durationInFrames={LOOP_FRAMES} fps={FPS} width={3840} height={1646} />
          <Composition id={`search-${lang}`} component={Search} defaultProps={{ lang }} durationInFrames={LOOP_FRAMES} fps={FPS} width={2880} height={1920} />
          <Composition id={`universal-${lang}`} component={Universal} defaultProps={{ lang }} durationInFrames={1} fps={FPS} width={5244} height={2950} />
        </Fragment>
      ))}
    </>
  )
}

registerRoot(Root)
