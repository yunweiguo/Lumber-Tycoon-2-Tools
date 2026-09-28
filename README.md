# LT2 Tools MVP

Zero-dependency static MVP for a Lumber Tycoon 2 tools site. It can be deployed directly to Cloudflare Pages, GitHub Pages (with path adjustments), Netlify, or any static host.

## Included

- Trade Calculator with explicit historical-data warning
- Values database: woods, axes, vehicles
- Schematic route map
- Wood profit calculator
- Five SEO landing pages: Secret Badge, Glorb, Lost Cave, Work Light, First Car
- Responsive design, robots.txt, 404

## Local run

```bash
python3 -m http.server 8080 -d .
```

Open http://localhost:8080/

## Production checklist

1. Replace the historical trade snapshot with verified 2026 observations before marketing the calculator as current.
2. Add a real domain and canonical URLs, then generate sitemap.xml.
3. Verify the schematic map against an authoritative/current map and add screenshots or a measured coordinate layer.
4. Add analytics (PostHog or GA4) for calculator_submit, route_select, value_search and guide_cta.
5. Add a small CMS/data pipeline for observations instead of editing assets/data.js manually.
6. Review Roblox trademark/fan-content presentation and avoid implying affiliation.

## Data notes

Fixed store / sell values are seeded from long-running community documentation. Market trade ranges bundled in the MVP are intentionally old and visibly labeled stale; this is a product-behavior demo, not a claim that those are current market prices.
