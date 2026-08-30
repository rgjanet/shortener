# Git-based URL Shortener

A URL shortener with no server and no database: links are YAML files in
`/links`, a GitHub Action turns them into static redirect pages, and
GitHub Pages serves the result on your own domain. Sveltia CMS gives you
a form-based admin UI at `/admin` so you don't have to hand-edit files.

## How it works

1. You (or anyone with access) create a link via the `/admin` form.
2. Sveltia commits a new file like `links/abc123.yml` to this repo.
3. A GitHub Action builds `public/abc123/index.html` — a page that
   instantly redirects to your destination URL.
4. GitHub Pages deploys `public/` to your custom domain.

## One-time setup

### 1. Create the repo
Push this folder to a new GitHub repository.

### 2. Enable GitHub Pages
Repo → Settings → Pages → Source: **GitHub Actions**.

### 3. Point your domain at GitHub Pages
- Edit `CNAME` in this repo to your real subdomain (e.g. `go.yoursite.com`).
- In your DNS provider, add a `CNAME` record: `go` → `yourusername.github.io`.
- (See GitHub's docs on custom domains for the exact records if you're
  using an apex domain instead of a subdomain.)

### 4. Create a GitHub OAuth App
GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
- Homepage URL: your Pages URL (e.g. `https://go.yoursite.com`)
- Authorization callback URL: `https://<your-worker>.workers.dev/callback`

Note the **Client ID** and **Client Secret**.

### 5. Deploy the OAuth Worker
The CMS needs a small proxy to complete the GitHub login handshake
(`oauth-worker/worker.js`).

```
cd oauth-worker
npm install -g wrangler       # if you don't have it
wrangler init                 # if you want a fresh wrangler.toml
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler deploy
```

Take note of the deployed Worker URL.

### 6. Update `admin/config.yml`
- Set `repo:` to `yourusername/your-repo`
- Set `base_url:` to your deployed Worker URL

### 7. Push and go
Commit everything. The Action will run, deploy Pages, and your admin
UI will be live at `https://go.yoursite.com/admin`.

## Creating a link manually (no CMS)

Add a file to `links/`, e.g. `links/hello.yml`:

```yaml
slug: hello
url: https://example.com/some/long/page
date: 2026-08-30T00:00:00.000Z
```

Push it — the Action does the rest. Visiting `go.yoursite.com/hello`
redirects to the destination.

## Notes & limits

- No click analytics out of the box — bolt on Plausible/Fathom or a
  tracking snippet in the redirect template if you want it.
- Redirects take as long as the Action takes to run (usually well
  under a minute), not instant like a real backend.
- Slugs are restricted to letters, numbers, `-`, and `_` for safety.
