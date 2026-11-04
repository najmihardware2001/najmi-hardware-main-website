# Kuwait search and performance release — 4 November 2026

## Search pages

Eight bilingual collections target actual catalogue families. Arabic URLs start at `/collections/`; English adds `/en`. Each has initial HTML, direct product links, buying advice, a visible question/answer, canonicals, hreflang and a sitemap entry.

| Collection slug | Search intent |
| --- | --- |
| ropes-kuwait | ropes in Kuwait; rope supplier; braided, cotton and jute rope |
| wire-ropes-kuwait | galvanized, stainless and PVC-coated wire rope Kuwait |
| decorative-ropes-kuwait | decorative and velvet rope Kuwait |
| ribbons-kuwait | ribbon supplier; plain, satin-style and glitter ribbon Kuwait |
| bag-handles-kuwait | paper bag handle rope; satin and cotton bag handles Kuwait |
| twine-kuwait | cotton, jute and packaging twine supplier Kuwait |
| webbing-jute-fabric-kuwait | cotton niwar, webbing and jute fabric Kuwait |
| velcro-kuwait | Velcro tape, dots and stickers Kuwait |

Three bilingual guides explain rope diameter, paper bag handles, and ribbon widths/colours. Existing 58 product IDs, size groups, colours and commercial eligibility remain intact. Product metadata now focuses on the product and Kuwait. Sitemap coverage is 158 public language/page combinations: 116 product pages and 42 other pages. Filter/search variants remain noindex. Quote-only products do not get fabricated Offers, prices, ratings or certifications.

## Loading changes

The build renders the actual React storefront and initial public data. Browser hydration keeps that DOM, replacing the previous unrelated SEO shell → loading screen → storefront sequence. Customer-specific browser state is restored after hydration, and the complete page can paint before event handlers attach.

Responsive WebP derivatives are generated from existing assets; content hashes prevent stale files. Original photographs remain available. Hero images, family thumbnails and cards use appropriate sizes. Video uses an optimized poster and preload none. WOFF2 replaces TTF delivery; the used icon font falls from about 970 KB to 26 KB. Text fonts use optional display and language-specific preloads. Initial CSS is included directly to avoid stylesheet round trips. Stable header/media dimensions, sequential footer headings, improved contrast and a smaller favicon address supplied audits.

Run `npm run build:cloudflare` from the repository root, then `npx wrangler deploy`. The root build generates the responsive manifest before TypeScript/Vite and then prerenders the pages. Do not deploy an isolated Vite build. Optimized image output and its generated manifest are local build outputs, not duplicate catalogue sources.

Optional font maintenance: install fonttools and brotli, then run `python scripts/optimize-fonts.py` when adding icon names. Committed WOFF2 files mean production builds do not require Python. Original licensed fonts remain in place.

## External actions

The owner confirmed Google Business Profile already points to the new website, and that old `.net` hosting access is unavailable. Redirects and Change of Address require that host's administrator; see `OLD-DOMAIN-HANDOFF.md`. They were not performed by this release.

Retain `https://najmihardware.com/sitemap.xml` in Search Console. Inspect important new category URLs and both homepages, and monitor indexing and queries with country Kuwait. Neither sitemap inclusion nor Lighthouse SEO 100 proves indexing or ranking. No search volumes, positions or field Core Web Vitals results are claimed without reporting data.

Once the owner's analytics property is available, configure and verify WhatsApp, telephone and quote-basket conversion events without message contents or contact details. No analytics account, identifier or consent configuration was invented here.

## Evidence

The supplied mobile report scored 54 (LCP 6.6 s, CLS 0.405); desktop scored 59 (LCP 3.1 s, CLS 0.799). Both reported no field data. Local audits and acceptance evidence are under `D:/Codex Output/najmi hardware main (2)/2026-11-04/seo-performance/`. Live post-deployment measurements are recorded separately. Local Lighthouse results must not be presented as PageSpeed service results.
