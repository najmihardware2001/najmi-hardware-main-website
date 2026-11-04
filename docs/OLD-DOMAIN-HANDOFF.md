# Request for the administrator of najmihardware.net

Najmi Hardware's replacement website is `https://najmihardware.com/`. The owner has updated the existing Google Business Profile website field. The old `.net` homepage still returned 200 with its own content on 4 November 2026.

1. Back up the old site and export its actual URLs. Preserve domain ownership and email DNS records.
2. Map each old URL to the closest equivalent new page. Redirect the old homepage to the new root, or `/en/` if the owner chooses English. Map contact/about/product/category URLs individually after checking the destination content.
3. Install server-side 301/308 redirects at the old host, including HTTP/HTTPS and www/non-www. Do not redirect every missing product to the homepage. Removed content without an equivalent can return 404/410.
4. Verify destination content, TLS and status codes; avoid loops and redirect chains. Keep redirects for at least a year, preferably longer.
5. Help the owner verify both Search Console properties and use Change of Address after redirects work, if this is a complete domain move.

The new repository cannot install redirects on the old domain. Do not change the new website's nameservers or email records for this task.

Google's migration guidance: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
