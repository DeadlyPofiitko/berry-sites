import { defineMiddleware } from 'astro:middleware';

const SUPPORTED_LOCALES = ['en', 'cs'];
const DEFAULT_LOCALE = 'en';

const DOMAIN_LOCALE_MAP: Record<string, string> = {
  'berry26.com': 'en',
  'berry26.cz': 'cs',
  'localhost': 'en'
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

  // Support X-Forwarded-Host if proxy modified Host header
  const forwardedHost = context.request.headers.get('x-forwarded-host');
  const rawHost = forwardedHost || context.request.headers.get('host') || context.url.host;
  const host = rawHost.split(':')[0].toLowerCase();

  // Support direct X-Locale header passed by Nginx (e.g. proxy_set_header X-Locale cs;)
  const headerLocale = context.request.headers.get('x-locale')?.toLowerCase();

  // 2. Resolve Domain: check mock param first (for dev convenience), then real host
  const mockDomain = searchParams.get('mock_domain');
  const activeDomain = mockDomain || host;

  let locale = DEFAULT_LOCALE;
  let isDomainScoped = false;
  let targetPath = pathname;

  const segments = pathname.split('/').filter(Boolean);

  // 3. Match strategy
  if (headerLocale && SUPPORTED_LOCALES.includes(headerLocale)) {
    locale = headerLocale;
    isDomainScoped = true;
  } else if (DOMAIN_LOCALE_MAP[activeDomain]) {
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