# Mimesis website

Static copy of the public `mimesis.fun` landing site. Deploy `website/` to Cloudflare Pages.

Required GitHub settings for `.github/workflows/deploy_website.yml`:

- Repository variable: `CLOUDFLARE_PAGES_PROJECT_NAME`
- Repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

The site keeps the Plausible script for `mimesis.fun`.
