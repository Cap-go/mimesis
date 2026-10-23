// While a language is still being translated, the page stays in English and this
// swaps in strings as the translation worker finishes them. Same wait as the app.
const root = document.documentElement
const lang = root.dataset.locale || 'en'

function apply(messages) {
  if (!messages)
    return
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const value = messages[el.getAttribute('data-i18n')]
    if (!value)
      continue
    if (el.tagName === 'META')
      el.setAttribute('content', value)
    else
      el.textContent = value
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    const value = messages[el.getAttribute('data-i18n-aria')]
    if (value)
      el.setAttribute('aria-label', value)
  }
  for (const el of document.querySelectorAll('[data-i18n-alt]')) {
    const value = messages[el.getAttribute('data-i18n-alt')]
    if (value)
      el.setAttribute('alt', value)
  }
}

async function refresh(attempt) {
  try {
    const res = await fetch(`https://i18n.mimesis.fun/v1/site?lang=${encodeURIComponent(lang)}`)
    if (!res.ok)
      return
    const body = await res.json()
    apply(body.messages)
    if (!body.complete && attempt < 15)
      setTimeout(() => void refresh(attempt + 1), 20000)
    else if (body.complete)
      root.dataset.complete = 'true'
  }
  catch (err) {
    console.warn('i18n', err)
  }
}

if (lang !== 'en' && root.dataset.complete !== 'true')
  void refresh(0)
