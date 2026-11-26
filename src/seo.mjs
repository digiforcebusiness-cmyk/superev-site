export const ORIGIN = 'https://superev.app';
export const IOS_URL = 'https://apps.apple.com/app/id6770043689?ct=superev';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.tuning3d.engine.sounds&referrer=utm_source%3Dsuperev';
export const PRIVACY_URL = 'https://www.servepointpos.com/superrev/privacy';
export const SUPPORT_URL = 'https://www.servepointpos.com/superrev/contact';
export const DISCLAIMER = 'Engine-inspired simulations. Not affiliated with or endorsed by any vehicle manufacturer.';

export const esc = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** Shortest of the candidates that fits `max`, else the last one. */
export const fit = (max, ...candidates) => candidates.find((c) => c.length <= max) ?? candidates.at(-1);

export function metaTags({ title, description, path, image = '/img/og.png', type = 'website' }) {
  const url = ORIGIN + path;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="SuperRev">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ORIGIN}${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${ORIGIN}${image}">`,
  ].join('\n');
}

export const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replaceAll('<', '\\u003c')}</script>`;

export const appSchema = (engineCount) => ({
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'Engine Sounds: SuperRev',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EntertainmentApplication',
  description: `Real engine sounds that follow your driving: ${engineCount} engines, GPS mode and acceleration sync.`,
  url: `${ORIGIN}/`,
  installUrl: [IOS_URL, PLAY_URL],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: 'SuperRev', url: `${ORIGIN}/`,
});

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({
    '@type': 'ListItem', position: i + 1, name, item: ORIGIN + path,
  })),
});

export const faqSchema = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
