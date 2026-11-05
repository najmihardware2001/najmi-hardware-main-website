# Quote-only catalogue structured data — 5 November 2026

The supplied Search Console screenshot reports 18 invalid Product snippet items (last updated 3 November): “Either offers, review or aggregateRating should be specified.” The catalogue has no verified public retail offers or product reviews. Product markup without any of these is not eligible for Google's product snippets; a zero price or invented review would be misleading.

The build and browser A+ component now describe these catalogue entries as WebPage, with their real name, description, identifier, image, URL and language. HardwareStore, WebSite and BreadcrumbList remain. Product pages remain indexable, with the same URLs, canonical links, language alternates, visible product content and sitemap entries. This removes an unsupported rich-result claim; it does not create valid price/star snippets. Add Product/Offer markup only when genuine published offers or qualifying visible product reviews are implemented.

Regression checks inspect every JSON-LD block in all 116 English/Arabic product pages, including the rendered A+ component, to prevent client markup from reintroducing invalid Product entries.

After deployment, inspect an affected product using Search Console's Test Live URL, then choose Validate Fix on the issue. Historical counts can remain until Google recrawls and completes validation. Deployment itself does not change the Search Console report immediately.

Official requirements: https://developers.google.com/search/docs/appearance/structured-data/product-snippet

The separate mobile PageSpeed report supplied on 5 November scored 88 performance and 100 accessibility/best practices/SEO, with LCP 3.3 s, TBT 0 ms and CLS 0. Product-card responsive sizes now account for the two-column mobile grid's padding/gap, and slideshow prefetch uses the same responsive candidates rather than an unrelated default. This reduces unnecessary image downloads without changing product photography. No new hosted score is claimed without a new measurement.
