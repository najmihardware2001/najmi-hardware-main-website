# Domain launch and search migration

Prepared 29 October 2026. This repository has not configured your DNS, changed the old website, edited Google Business Profile or verified Search Console.

## Before publishing the new domain

1. Deploy the repository to Netlify using the settings in the README. Use its temporary URL to review mobile and desktop pages. Confirm all 58 products and colour choices.
2. Connect `najmihardware.com` and `www.najmihardware.com`, choose the non-www domain as primary, verify HTTPS, then check the canonical URLs resolve successfully. Keep any email DNS records.
3. Check all of these return the appropriate content: `/`, `/en/`, `/shop`, `/en/shop`, `/product/7849`, `/en/product/7849`, `/robots.txt`, `/sitemap.xml`, both child sitemaps, and `/api/health`. An invented URL must return 404, not the homepage.
4. Test a multi-product quote on a real phone. The link targets +96599652718. Each item and specification is on its own line with blank lines between fields. No message is sent automatically. PDF download provides a separate copy for larger lists.
5. Confirm the exact legal/public business name, street address, business phone and hours against the existing Google Business Profile. Current structured data uses only the confirmed name, 2001, owner phone, Shuwaikh and Kuwait. Detailed street address/hours/coordinates/reviews have deliberately not been invented. Update both visible contact content and structured data if verified details change.
6. For database-backed accounts/orders/admin, finish `backend/DEPLOYMENT.md`. The initial catalogue mode does not supply these services.

## Move the old site's search value

The existing site is `https://www.najmihardware.net/`. A new domain does not automatically inherit its ranking or replace its listing.

- In the **old hosting account**, configure permanent server-side 301/308 redirects from each old URL to the closest relevant new URL. This cannot be done by a file hosted only on the new domain.
- Map `/` and `/index.html` to `https://najmihardware.com/`, `/about.html` to `/about`, and `/contact.html` to `/contact`. Review old product/category URLs individually: several categories on the old site are outside this approved catalogue. Do not redirect every missing product to the homepage or invent listings. Use a real 404/410 for genuinely removed content without an equivalent.
- Keep old-domain redirects and domain ownership for **at least one year**, preferably longer. Test HTTP/HTTPS and www/non-www versions and avoid redirect chains.
- Keep original product imagery indexed by redirecting old image URLs where there is a true equivalent.
- Update the existing **Google Business Profile's Website field** to `https://najmihardware.com/`. Keep the same profile, business identity and genuine reviews. Do not create a duplicate profile.
- Update important directory, social and business-reference links to the new URL. Keep name/address/phone consistent. Ask real customers for genuine reviews without incentives or review gating.

## Search Console after HTTPS/domain launch

1. Add a **Domain property** for `najmihardware.com` using the same Google account that manages the business. Google will give you a DNS TXT record; add that exact record at your DNS provider. No invented verification token is included here.
2. Verify ownership of the old `.net` property too. If this is a complete domain move, use Search Console's **Change of Address** after the old redirects are live and tested. If the old website will remain a separate site, do not use that tool.
3. Submit **https://najmihardware.com/sitemap.xml**. It references 20 general-page URLs and 116 product URLs, with language alternates and images. Only existing public pages are included.
4. Inspect the homepage, `/en/`, one rope product, one polybag product and Ribbon with URL Inspection; run a live test and request indexing for the important pages. Do not repeatedly submit every URL.
5. Validate LocalBusiness/Product/Breadcrumb JSON-LD with Google's Rich Results Test. Current quote-only products have no `Offer` or reviews; product rich-result eligibility may therefore be limited. Do not add fake prices or ratings to silence warnings.
6. Review indexing reports, submitted/discovered/indexed counts, excluded filter URLs, soft 404s, canonical selection, mobile Core Web Vitals and search queries weekly initially. Fix genuine errors; indexing/rankings can fluctuate during migration.

## Content and performance maintenance

- Use accurate, useful English/Arabic product descriptions and actual size/colour options. Keep technical suitability claims tied to supplier documentation.
- Keep every product linked from the catalogue and important collections. New/removed products require a refreshed public export and rebuild so HTML, API snapshot and sitemaps agree.
- Do not noindex production at launch. Non-production build contexts set noindex automatically. When copying a preview deployment manually, rebuild in the production context.
- Gallery images are lazy-loaded outside the main image; the main photo has an eager/high-priority path. Hashed JS/CSS are cached; product assets have shorter caching so corrections can be deployed. Inspect actual performance after hosting; no live Core Web Vitals score is claimed by this repository.
- Current Arabic URLs have no prefix. English uses `/en/`. Browser language/local storage cannot silently change the content of the URL delivered to crawlers. The language switch preserves the current route and the stored basket.

## Primary references

- Google site moves: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
- Google JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- LocalBusiness structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Local ranking factors: https://support.google.com/business/answer/7091
- Netlify Git repository support: https://docs.netlify.com/build/git-workflows/overview/
