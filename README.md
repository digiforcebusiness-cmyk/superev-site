# superev.app

Static marketing site for SuperRev: every engine is playable in the browser (60 s of revving per visit), and each one has its own SEO page.

## Rebuild and deploy

```sh
./scripts/sync-packs.sh "/path/to/Engine Sounds"   # or no argument: sparse-clones the app repo
node scripts/extract-cars.mjs "/path/to/Engine Sounds"   # only when the app's car catalog changes
npm test                                           # also builds public/
vercel --prod
```

Generated pages, `sitemap.xml`, `robots.txt` and `public/packs/` are git-ignored. `npm run build` regenerates the pages and sync-packs regenerates the packs.
