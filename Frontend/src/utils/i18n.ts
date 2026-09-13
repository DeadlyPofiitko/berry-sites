export const SUPPORTED_LOCALES = ['en', 'cs'] as const;
export const DEFAULT_LOCALE = 'en';

export const DOMAIN_LOCALE_MAP: Record<string, string> = {
  'berry.com': 'en',
  'berry.cz': 'cs',
  'localhost': 'cs',
};

export function getClientLocaleInfo(): { locale: string; isDomainScoped: boolean } {
  if (typeof window === 'undefined') {
    return { locale: DEFAULT_LOCALE, isDomainScoped: false };
  }

  const rawHost = window.location.host;
  const host = rawHost.split(':')[0].toLowerCase();

  if (DOMAIN_LOCALE_MAP[host]) {
    return {
      locale: DOMAIN_LOCALE_MAP[host],
      isDomainScoped: true,
    };
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length > 0 && (SUPPORTED_LOCALES as readonly string[]).includes(segments[0])) {
    return {
      locale: segments[0],
      isDomainScoped: false,
    };
  }

  const docLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
  const docScoped = typeof document !== 'undefined' ? document.documentElement.dataset.domainScoped : '';
  if (docLang && (SUPPORTED_LOCALES as readonly string[]).includes(docLang)) {
    return {
      locale: docLang,
      isDomainScoped: docScoped === 'true',
    };
  }

  return { locale: DEFAULT_LOCALE, isDomainScoped: false };
}

export function getLocalizedPath(
  path: string, 
  locale: string, 
  isDomainScoped: boolean = false,
  defaultLocale: string = 'en'
): string {
  // External links, standalone anchors (#about), or empty strings remain untouched
  if (/^(https?:|\/\/|mailto:|tel:|#)/.test(path) || !path) {
    return path;
  }

  // Split pathname and hash fragment (e.g. "/#about" or "/about#team")
  const [pathname, hash] = path.split('#');
  const hashSuffix = hash !== undefined ? `#${hash}` : '';

  // Ensure clean leading slash and no double slashes
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  // Domain-based (example.es) or default language on root domain -> no prefix
  if (isDomainScoped || locale === defaultLocale) {
    return `${normalizedPath}${hashSuffix}`;
  }

  // Subpath based (example.com/es/about)
  const base = normalizedPath === '/' ? '' : normalizedPath;
  return `/${locale}${base}${hashSuffix}`;
}