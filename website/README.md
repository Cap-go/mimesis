# Mimesis website

Static landing site for `mimesis.fun`, deployed as a Cloudflare Worker (`wrangler.jsonc`) by `.github/workflows/deploy_website.yml`.

English is the source, at `/` and `/privacy/`. Any other language is the same page under a prefix (`/fr/`, `/ja/`, `/zh-hant/`). Copy comes from the translation worker (`GET /v1/site` on `i18n.mimesis.fun`), the same on-demand dictionaries as the app. A visitor with no saved choice is sent from `/` to their browser language. The language menu stores an explicit choice in the `mimesis_lang` cookie.

Analytics use DataFast for `mimesis.fun`.
