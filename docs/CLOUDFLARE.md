# Deploy directly to Cloudflare Workers

The website uses a Worker script plus static assets. Uploading only a Vite `dist` folder cannot provide the `/api/products` and `/api/catalogue/resolve` endpoints required by product lists and colour/measurement selectors. Netlify Functions and a Node Docker server do not run automatically on a static-only Worker.

## Existing project settings

Project: **najmi-hardware-main-website**

1. In **Workers & Pages → najmi-hardware-main-website → Settings → Builds**, connect this repository and select branch `main`.
2. Set the root directory to the **repository root**, not `frontend`.
3. Set the build command to **`npm run build:cloudflare`**.
4. Set the deploy command to **`npx wrangler deploy`**.
5. Save and deploy the latest commit. Root `wrangler.jsonc` selects `cloudflare/worker.mjs`, binds `frontend/dist` as `ASSETS`, and uses the existing project name.
6. Check the project URL: `/api/health` must return JSON with 65 products; `/en/shop` must load the catalogue; `/en/product/7849` must allow diameter, length and colour selection. A static homepage alone does not prove the deployment is complete.

The API is the approved read-only catalogue. It includes all existing public options and prices, keeps retail purchasing gated and supports the local cart/quote basket and WhatsApp enquiries. Database-backed accounts/admin/stored orders are still unavailable until PostgreSQL and the commerce API are hosted.

## Live domain routing

Nameservers `jobs.ns.cloudflare.com` and `sreeni.ns.cloudflare.com` are already active. No additional nameserver change at Hostinger is needed.

The deployed configuration uses Worker routes `najmihardware.com/*` and `www.najmihardware.com/*`, both in the `najmihardware.com` zone. The existing root A and www CNAME records must remain **proxied**. The Worker handles these requests and serves its own assets/API without fetching the old Hostinger parking origin. The old parking address is therefore not the website host while these routes are active.

The Worker redirects `www` and root HTTP requests to the canonical HTTPS root, preserving paths and queries. Mail/MX/SPF/DKIM records were not changed. Custom Domain activation was rejected because of existing DNS records; it is not required for this route-based setup.

Check **Domains & Routes** after future deployments and verify `https://najmihardware.com/api/health` returns JSON with 65 products. If a local resolver still shows the old Hostinger page, compare public DNS before changing any records. Official route instructions: https://developers.cloudflare.com/workers/configuration/routing/routes/

`INDEXING_ENABLED=true` permits indexing only on `najmihardware.com`; temporary `workers.dev` pages always get an HTTP noindex header and crawling is blocked in their robots file. After the real domain works, submit `https://najmihardware.com/sitemap.xml` and follow the `.net` migration steps in `docs/LAUNCH-AND-SEO.md`.

## Local verification or deployment from the CLI

```sh
npm ci
npm run build:cloudflare
npm test
npm run dev:cloudflare
```

Use `http://localhost:8787` to test the actual Cloudflare runtime. A local dry-run bundle uses:

```sh
npx wrangler deploy --dry-run
```

After signing into the correct Cloudflare account, `npm run deploy:cloudflare` deploys the Worker, assets and the two production routes declared in `wrangler.jsonc`. No account API token is stored in the repository.
