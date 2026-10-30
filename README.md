# Najmi Hardware — official website

Industrial Minimal storefront for **Najmi Hardware, Kuwait, established 2001**.
Primary domain: **https://najmihardware.com**. Arabic is at `/`; English is at `/en/`.

**Direct Cloudflare Workers deployment:** use **`npm run build:cloudflare`**, then **`npx wrangler deploy`**, from the repository root. Root `wrangler.jsonc` includes the catalogue API, static pages and production domain routes. See [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) for the existing Worker project's build settings and domain connection.

**Aiven Runtime deployment is supported:** select root **`compose.aiven.yaml`** in the GitHub deployment wizard. See [docs/AIVEN.md](docs/AIVEN.md) for the scan/deploy steps, custom domain setup and indexing switch. The existing Netlify configuration remains available as an alternative.

## What this first Netlify deployment runs

- All 58 approved public catalogue products, 388 specification groups, existing prices, colour options and corrected product media.
- Product galleries, colour previews, saved selections, comparisons, bulk requirements and a browser-persisted cart/quotation basket.
- Spaced, numbered WhatsApp quotation requests to Najmuddin, **+965 9965 2718**, and client-side RFQ PDFs.
- A Netlify Function providing the approved **read-only public catalogue**. `/api/health` honestly reports `database: "not-configured"`.
- No retail checkout, online account login, admin writes, stored orders or server-side RFQ submissions until hosted PostgreSQL and the live API are configured. These routes return an explicit error, never a fake success. The existing database-backed implementation is preserved in `backend/`.

No passwords, `.env` files, customer records, database clusters, dumps, local backups or old Git history are included. The existing local admin password has not been changed.

## Deploy from GitHub to Netlify

1. In Netlify choose **Add new project → Import an existing project → GitHub** and authorize this repository.
2. Select `najmihardware2001/najmi-hardware-main-website`, branch `main`.
3. Leave the **base directory empty**. Root `netlify.toml` sets the build command to `npm run build`, publish directory to `frontend/dist`, functions directory to `netlify/functions` and Node to 22.
4. Build the site. No database secret or payment key is needed for catalogue/WhatsApp mode.
5. Add `najmihardware.com` and `www.najmihardware.com` in Domain management. Make **najmihardware.com** the primary domain. Apply the DNS records Netlify gives you; leave unrelated mail/MX records intact. Wait for HTTPS to be issued.
6. Confirm `/api/health`, one product, one colour selection, cart and the prepared WhatsApp text on an actual phone. The deployment checklist is in [docs/LAUNCH-AND-SEO.md](docs/LAUNCH-AND-SEO.md).

Private personal GitHub repositories are supported when Netlify has permission to read them. Organization-owned private repositories may require a paid Netlify plan. Do not make the repository public merely to deploy it.

## Local verification

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://localhost:5180. This uses the same built pages and public-catalogue API as Netlify. Backend development requires separate environment configuration; see [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md).

## SEO output

Each build creates **136 initial HTML pages**: 58 products and 10 information/catalogue routes in both languages. Product names, descriptions, image links, specifications and catalogue links are present before JavaScript runs. React then takes over the same route with the interactive storefront. This is the same response for people and crawlers.

- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml` — sitemap index to submit in Search Console
- `frontend/public/sitemap-pages.xml`
- `frontend/public/sitemap-products.xml` — products, alternate languages and product images
- Unique titles/descriptions, canonical `.com` URLs, reciprocal `ar-KW`/`en-KW` hreflang, Open Graph and Twitter metadata.
- HardwareStore, WebSite, BreadcrumbList and Product JSON-LD. No invented offers, stock, reviews, ratings, opening hours or certifications.
- Genuine HTTP 404s for unknown direct URLs; app/account/cart routes are noindex. Facet/search URLs canonicalize to the shop and are noindex in the rendered app.
- Netlify branch/deploy-preview builds are noindex with blocked crawling. A production build enables indexing.

Google can take time to crawl and index a new domain. No code or sitemap can guarantee a #1 result. The existing `.net` site's redirects, Google Business Profile website link, consistent business details and genuine local references/reviews matter to the migration.

## Updating the catalogue

`catalogue/public-catalogue.json` is an approved public export, not the live database. Its timestamp is recorded in `catalogue/manifest.json`. Changes in the local admin do **not** automatically update this file or Netlify. Refresh the public export and its referenced media, review it, then commit and rebuild. After the hosted database is connected, the database API becomes the authoritative source; see the deployment document before activating it.

Existing image corrections and commercial gates remain intact. Public product IDs and URLs are stable.
