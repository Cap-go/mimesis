# Mimesis website

Static copy of the public `mimesis.fun` landing site. Deploy `website/` to Cloudflare Pages.

Required GitHub setting for `.github/workflows/deploy_website.yml`:

- Repository secret: `CLOUDFLARE_API_TOKEN` with Cloudflare Pages write access.

The workflow targets Cloudflare account `9ee3d7479a3c359681e3fab2c8cb22c0` and creates the `mimesis` Pages project if it does not already exist.

Analytics use DataFast for `mimesis.fun`.
