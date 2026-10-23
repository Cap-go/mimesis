// Minimal HTMLRewriter types so the website worker typechecks without Workers packages.
interface HtmlRewriterElement {
  readonly tagName: string
  getAttribute: (name: string) => string | null
  setAttribute: (name: string, value: string) => this
  removeAttribute: (name: string) => this
  setInnerContent: (content: string) => this
  append: (content: string, options?: { html?: boolean }) => this
}

interface HtmlRewriterHandlers {
  element?: (element: HtmlRewriterElement) => void
}

declare class HTMLRewriter {
  on: (selector: string, handlers: HtmlRewriterHandlers) => this
  transform: (response: Response) => Response
}
