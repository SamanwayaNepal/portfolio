# Samanwaya Nepal — Official Website

Static website for [Samanwaya Nepal](https://samanwaya.org.np), a youth-centered
non-profit institution in Kathmandu, Nepal. Built as a fast, dependency-free
multi-page site designed for **GitHub Pages** hosting.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `about.html` | Vision, mission, governance, board |
| `founder.html` | Founder's Note (Jagdish Kumar Ayer) |
| `programs.html` | Eight program pillars + upcoming events |
| `contact.html` | Contact info + join form |
| `admin.html` | Admin dashboard (events, notices, content editing, backup) |
| `404.html` | Custom not-found page |
| `css/style.css` | Single shared stylesheet (theme: `#ff751e` / `#0d077c`) |
| `js/content.js` | Default content + localStorage override store |
| `js/main.js` | Loader, nav, scroll animations, dynamic rendering |
| `js/admin.js` | Admin login (SHA-256) + dashboard logic |
| `sitemap.xml`, `robots.txt`, `CNAME`, `site.webmanifest` | SEO / hosting |

## Admin

Open `/admin.html` (linked from the footer). Admins can:

- Publish, edit, and delete **events** (with auto-compressed photos)
- Post **notices** shown on the home page
- **Edit page content** — hero text, quotes, vision/mission, stats, contact details
- **Export / import** all content as a JSON backup

> Note: GitHub Pages is a static host with no database, so admin edits are
> saved in the browser's localStorage. Use *Backup & restore* to export the
> content JSON and import it elsewhere (or commit it to the repo).

## SEO

Every page ships unique titles/descriptions, canonical URLs pointing at
`samanwaya.org.np`, Open Graph + Twitter cards, and Schema.org JSON-LD
(NGO, WebSite, Person, ItemList, ContactPage). `sitemap.xml` and `robots.txt`
are included. After deploying, submit the sitemap in
[Google Search Console](https://search.google.com/search-console) to speed up
indexing.

## Custom domain (GitHub Pages)

The `CNAME` file pins the site to `samanwaya.org.np`. In your DNS provider:

- `A` records for the apex (`samanwaya.org.np`) → GitHub Pages IPs
  (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
- Optional `CNAME` record for `www` → `<username>.github.io`
- Enable **Enforce HTTPS** in the repository's Pages settings.
