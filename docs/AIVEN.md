# Deploy the Najmi website on Aiven Runtime

In the GitHub deployment window shown in your screenshot:

1. Select account **najmihardware2001**, repository **najmi-hardware-main-website**, branch **main**.
2. Click **Next**. Refresh/reselect the branch if you opened the wizard before the deployment files were pushed.
3. Select **`compose.aiven.yaml`** from the repository root and click **Scan**.
4. Review the detected application **najmi-website**, build context **`.`**, Dockerfile **`Dockerfile`**, HTTP port **8080**. This file requests one application and no database, cache or other data services.
5. Review the plan/region and any charges displayed by Aiven, then click **Deploy** when ready. No hosting service is created by adding these repository files.
6. Open the Application URL Aiven provides. Check `/`, `/en/`, `/en/shop`, `/en/product/7849`, `/api/health`, and a multi-item WhatsApp quote on a phone.

No app secret is required for the current catalogue/WhatsApp mode. All 65 public products, approved images, colour selectors, gallery, local cart/quote basket and SEO pages are served by the same container. No Netlify function/proxy is needed on Aiven, and the app does not add a hosting badge.

**This does not activate the database-backed admin, login or stored orders.** `/api/health` continues to report `database: "not-configured"`. Creating a new empty PostgreSQL service alone would not migrate your existing catalogue/accounts; follow `backend/DEPLOYMENT.md` before activating the commerce backend.

## Indexing and the purchased domain

`INDEXING_ENABLED` is initially **`false`**. Temporary hosting previews return an `X-Robots-Tag: noindex, nofollow` header and a robots file blocking crawling. This prevents the temporary Aiven URL being launched in search before the custom domain is ready. Canonical URLs and sitemaps still point to `https://najmihardware.com`.

Aiven currently documents custom domains via a **Cloudflare Worker proxy**, rather than only pointing an unproxied DNS record at the application. Follow:

https://aiven.io/docs/products/runtime/custom-domain

Use your actual Aiven Application URL as the upstream; do not invent a hostname. Connect `najmihardware.com` and, if used, `www.najmihardware.com` through Cloudflare with HTTPS. Preserve existing email/MX records. The existing site uses relative navigation/API/media links and fixed `.com` canonical URLs, so no build-time backend hostname is needed.

After the domain, HTTPS and all products are verified, change the application's environment variable **`INDEXING_ENABLED` to `true`** in Aiven and redeploy. Confirm `/robots.txt` now allows crawling and references `https://najmihardware.com/sitemap.xml`, and the public homepage response has no noindex header. Keep private cart/admin/account pages noindex. Follow `docs/LAUNCH-AND-SEO.md` for Search Console, old `.net` redirects and Google Business Profile updates.

Do not submit the new sitemap to Google before the domain is connected and indexing is enabled.

## Future updates

**Git pushes do not automatically deploy in Aiven Runtime.** In Aiven, open the application and choose **Actions → Deploy latest commit** after a website update is pushed.

https://aiven.io/docs/products/runtime/deploy-apps

## Local verification

Without Docker:

```sh
npm ci
npm run build
npm test
npm start
```

Open `http://localhost:8080`. `npm start` uses the same Node HTTP server as the container.

With Docker installed:

```sh
docker compose -f compose.aiven.yaml config
docker compose -f compose.aiven.yaml up --build
```

Docker is not installed in the preparation environment, so a full image build/run was not performed here. The Node server, HTTP routing, health endpoint, specification POST requests, metadata/files, caching, 404s and indexing controls are tested locally. Aiven's remote container build remains the final platform check.
