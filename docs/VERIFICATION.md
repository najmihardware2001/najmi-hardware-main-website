# Release verification — 29 October 2026

- Fresh read-only export: **58 public products**, **388 specification groups**, **665 referenced catalogue images**. Existing variant selection data and prices are preserved. No database writes were made.
- Production TypeScript/Vite build and static HTML generation pass. **136 public HTML pages** include their initial content, metadata and JSON-LD.
- Six automated Node test groups pass: complete catalogue/media, all 116 product/language pages, sitemap coverage, private-route/404 configuration, Netlify function GET/POST paths and commercial gating, and exclusion of local environments/synthetic customer/order seeds.
- Headed Chromium checks cover corrected black/white cotton images, persistent colour picker, two distinct quote lines, English and Arabic WhatsApp message spacing/encoding/recipient, language switching without losing the basket, all 58 cards at 390px and 1440px in both languages, two mobile columns, polybag image loading, mobile overflow, production canonicals, reciprocal language alternates, runtime Product/Breadcrumb schema and homepage content.
- Mobile Arabic product and desktop English homepage screenshots were inspected locally. No JavaScript page errors were reported during these journeys.
- Initial HTML, sitemap and schema checks are local checks, not a claim that Google has indexed the site or awarded a rich result.
- The browser's prepared WhatsApp URL was decoded and verified. **No message was sent**; actual receipt in the client's WhatsApp app should be checked at launch.
- The public function correctly reports `database: "not-configured"`; login and stored checkout requests are gated. No hosted database, DNS, Google Business Profile change, Search Console verification or production Netlify deployment was performed.
- The frontend router was updated to 7.18.5 in the release to address the advisories affecting the previous 6.x dependency. The production frontend dependency audit reports zero known vulnerabilities at verification time.

The deployable source is the root of this repository. The previous local development project and its Git remote/history were preserved separately.

## Aiven Runtime configuration

Root `compose.aiven.yaml` and the multi-stage `Dockerfile` build the same frontend and public-catalogue API into a non-root Node container on port 8080. The YAML was parsed and validated locally. Four additional test groups validate actual HTTP requests to the container's Node entry point, preview indexing controls, production caching/private routes/404s, and the manifest's single-app configuration. All **10** current automated test groups pass.

No Docker engine is installed in this environment; the full Linux container image has not been built or run here. Aiven's remote build is still required. No Aiven application, paid plan, database or Cloudflare change was created by this update.

## Cloudflare Workers adaptation — 30 October 2026

The existing static-only Worker returned 404 for `/en/shop`, `/api/health` and `/api/products`. Added a native Worker script, public catalogue API and Wrangler configuration for the same project name. All **14** automated test groups pass. A Wrangler dry-run bundle passed (about 105 KiB gzip), and the actual local workerd runtime served the English/Arabic HTML routes, all 58 catalogue products, configuration POSTs, cart refresh routes and real 404s. All **25** headed browser checks also passed against the local Cloudflare runtime, including colour-image updates, the persistent picker, spaced bilingual WhatsApp requests and mobile layouts.

Deployment and custom-domain activation are separate from these local checks. Follow `docs/CLOUDFLARE.md`; the repository contains no account API token or hard-coded DNS binding.
