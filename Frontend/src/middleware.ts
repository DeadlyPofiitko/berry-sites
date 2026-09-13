import { defineMiddleware } from 'astro:middleware';

const SUPPORTED_LOCALES = ['en', 'cs'];
const DEFAULT_LOCALE = 'en';

const DOMAIN_LOCALE_MAP: Record<string, string> = {
  'berry.com': 'en',
  'berry.cz': 'cs',
  'localhost': 'cs'
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, searchParams } = context.url;

  // 1. Skip middleware rewriting for internal Astro/Vite assets & API endpoints
  if (
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/@') ||
    pathname.includes('.') // Skips favicon.ico, images, robots.txt, etc.
  ) {
    return next();
  }

  // Strip the port to normalize host (e.g., "localhost:4321" -> "localhost")
  const rawHost = context.request.headers.get('host') || context.url.host;
  const host = rawHost.split(':')[0].toLowerCase();

  // 2. Resolve Domain: check mock param first (for dev convenience), then real host
  const mockDomain = searchParams.get('mock_domain');
  const activeDomain = mockDomain || host;

  let locale = DEFAULT_LOCALE;
  let isDomainScoped = false;
  let targetPath = pathname;

  const segments = pathname.split('/').filter(Boolean);

  // 3. Match strategy
  if (DOMAIN_LOCALE_MAP[activeDomain]) {
    locale = DOMAIN_LOCALE_MAP[activeDomain];
    isDomainScoped = true;
  } else if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0])) {
    locale = segments[0];
    // Strip the prefix for file routing: /es/about -> /about
    targetPath = '/' + segments.slice(1).join('/') || '/';
  }

  // 4. Attach to Astro.locals
  context.locals.locale = locale;
  context.locals.isDomainScoped = isDomainScoped;

  // 5. Internally rewrite path-prefixed requests to matched page routes
  if (targetPath !== pathname) {
    return context.rewrite(targetPath);
  }

  return next();
});