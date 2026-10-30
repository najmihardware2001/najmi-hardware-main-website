# Deploy directly to Cloudflare Workers

The website uses a Worker script plus static assets. Uploading only a Vite `dist` folder cannot provide the `/api/products` and `/api/catalogue/resolve` endpoints required by product lists and colour/measurement selectors. Netlify Functions and a Node Docker server do not run automatically on a static-only Worker.

## Existing project settings

Project: **najmi-hardware-main-website**

1. In **Workers & Pages → najmi-hardware-main-website → Settings → Builds**, connect this repository and select branch `main`.
2. Set the root directory to the **repository root**, not `frontend`.
3. Set the build command to **`npm run build:cloudflare`**.
4. Set the deploy command to **`npx wrangler deploy`**.
5. Save and deploy the latest commit. Root `wrangler.jsonc` selects `cloudflare/worker.mjs`, binds `frontend/dist` as `ASSETS`, and uses the existing project name.
6. Check the project URL: `/api/health` must return JSON with 58 products; `/en/shop` must load the catalogue; `/en/product/7849` must allow diameter, length and colour selection. A static homepage alone does not prove the deployment is complete.

The API is the approved read-only catalogue. It includes all existing public options and prices, keeps retail purchasing gated and supports the local cart/quote basket and WhatsApp enquiries. Database-backed accounts/admin/stored orders are still unavailable until PostgreSQL and the commerce API are hosted.

## Attach najmihardware.com

Nameservers `jobs.ns.cloudflare.com` and `sreeni.ns.cloudflare.com` are already active. No additional nameserver change at Hostinger is needed.

1. Open your Worker and select the **Domains** tab shown in the dashboard, or **Settings → Domains & Routes**.
2. Choose **Add → Custom Domain** and enter **`najmihardware.com`**.
3. Complete the activation/DNS confirmation. The old root `A` record `2.57.91.91` is a Hostinger parking destination and must be replaced as part of the Worker connection.
4. Add **`www.najmihardware.com`** as a second Worker Custom Domain if you want it supported. Cloudflare cannot add it while the old `www` CNAME exists; replace that website CNAME through the setup flow. The Worker redirects `www` to the root domain with a 301.
5. Leave mail/MX/SPF/DKIM records intact. They are unrelated to the website connection.
6. Wait for the custom domain and certificate to become active. Verify `https://najmihardware.com/api/health` returns JSON rather than a Hostinger parking page.

Official instructions: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

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

After signing into the correct Cloudflare account, `npm run deploy:cloudflare` deploys the Worker and its assets. It does not attach the custom domain because no DNS routes or account-specific IDs are hard-coded in the repository.
