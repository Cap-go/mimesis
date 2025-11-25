// Mock Ionic/Stencil global objects for test environment
global.HTMLElement = global.HTMLElement || class {}

// Mock document.baseURI if not present
if (typeof document !== 'undefined' && !document.baseURI) {
  Object.defineProperty(document, 'baseURI', {
    value: 'http://localhost:3000/',
    writable: true,
  })
}
