// Writes every HTML page, sitemap.xml and robots.txt into public/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { home, carsIndex, categoryPage, carPage, privacyPage, privacyChoicesPage, contactPage, notFound } from './src/templates.mjs';
import { ORIGIN } from './src/seo.mjs';

const cars = JSON.parse(readFileSync(new URL('./data/cars.json', import.meta.url)));
const categories = JSON.parse(readFileSync(new URL('./data/categories.json', import.meta.url)));
const out = new URL('./public/', import.meta.url);

const pages = [];
const emit = (path, html) => {
  const dir = new URL('.' + path, out);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), html);
  pages.push(path);
};

emit('/', home({ cars, categories }));
emit('/cars/', carsIndex({ cars, categories }));
for (const cat of categories) emit(`/cars/${cat.slug}/`, categoryPage({ cat, cars }));
for (const car of cars) {
  const cat = categories.find((c) => c.name === car.category);
  emit(`/cars/${car.slug}/`, carPage({ car, cat, cars }));
}
emit('/privacy/', privacyPage());
emit('/privacy-choices/', privacyChoicesPage());
emit('/contact/', contactPage());
writeFileSync(new URL('404.html', out), notFound());

const today = new Date().toISOString().slice(0, 10);
writeFileSync(new URL('sitemap.xml', out), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `<url><loc>${ORIGIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(new URL('robots.txt', out), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`built ${pages.length} pages + 404`);
