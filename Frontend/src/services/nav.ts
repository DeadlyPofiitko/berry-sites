// src/services/nav.ts
import { notifyError, notifySuccess } from '../stores/notification';
import { getApiBaseUrl } from './auth';

export type Language = 'EN' | 'CS';

export interface NavItem {
  href: string;
  label: string;
}

export interface PublicNavLinkDto {
  name: string;
  order: number;
  url: string;
}

export interface GetAllLinkContentsDto {
  language: Language;
  name: string;
}

export interface GetAllLinksDto {
  id: string; // Guid
  url: string;
  order: number;
  contents: GetAllLinkContentsDto[];
}

let detectedNumericEnum: boolean | null = null;

function normalizeLanguage(lang: unknown): Language {
  if (typeof lang === 'number' || lang === '0' || lang === '1') {
    if (detectedNumericEnum === null) detectedNumericEnum = true;
    return (lang === 1 || lang === '1') ? 'CS' : 'EN';
  }
  if (typeof lang === 'string' && detectedNumericEnum === null) {
    detectedNumericEnum = false;
  }
  if (String(lang).toUpperCase() === 'CS') {
    return 'CS';
  }
  return 'EN';
}

function normalizeLinkItem(raw: any, defaultOrder: number): GetAllLinksDto {
  const id = raw?.id || raw?.Id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000');
  const url = raw?.url ?? raw?.Url ?? '';
  const order = typeof raw?.order === 'number' ? raw.order : typeof raw?.Order === 'number' ? raw.Order : defaultOrder;
  const rawContents = Array.isArray(raw?.contents) ? raw.contents : Array.isArray(raw?.Contents) ? raw.Contents : [];

  let enName = '';
  let csName = '';

  for (const c of rawContents) {
    const l = normalizeLanguage(c?.language ?? c?.Language);
    const n = c?.name ?? c?.Name ?? '';
    if (l === 'EN') {
      enName = n;
    } else if (l === 'CS') {
      csName = n;
    }
  }

  return {
    id,
    url,
    order,
    contents: [
      { language: 'EN', name: enName },
      { language: 'CS', name: csName },
    ],
  };
}

/** GET /nav/admin - retrieve list of navigation links */
export async function getNavLinks(): Promise<GetAllLinksDto[] | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/nav/admin`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err.detail || err.message;
      } catch {
        // ignore parse error
      }
      notifyError('Failed to fetch navigation links', { detail });
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const links = data
      .map((item, index) => normalizeLinkItem(item, index))
      .sort((a, b) => a.order - b.order);

    return links;
  } catch (e) {
    notifyError('Network error while fetching navigation links');
    return null;
  }
}

/** POST /nav - save navigation links */
export async function saveNavLinks(links: GetAllLinksDto[]): Promise<boolean> {
  const buildPayload = (useNumeric: boolean) =>
    links.map((link, index) => ({
      id: link.id,
      url: link.url,
      order: index,
      contents: [
        {
          language: (useNumeric ? 0 : 'EN') as unknown as Language,
          name: link.contents.find((c) => c.language === 'EN')?.name ?? '',
        },
        {
          language: (useNumeric ? 1 : 'CS') as unknown as Language,
          name: link.contents.find((c) => c.language === 'CS')?.name ?? '',
        },
      ],
    }));

  try {
    const baseUrl = getApiBaseUrl();
    const useNumeric = detectedNumericEnum === true;
    let payload = buildPayload(useNumeric);

    let res = await fetch(`${baseUrl}/nav`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NavLinkDtos: payload }),
    });

    // If 400 Bad Request, could be enum type mismatch (string vs numeric)
    if (res.status === 400 && detectedNumericEnum === null) {
      const altPayload = buildPayload(!useNumeric);
      const altRes = await fetch(`${baseUrl}/nav`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NavLinkDtos: altPayload }),
      });
      if (altRes.ok) {
        detectedNumericEnum = !useNumeric;
        notifySuccess('Navigation saved successfully');
        return true;
      }
    }

    // If 404/405, attempt fallback to /nav/admin
    if (res.status === 404 || res.status === 405) {
      const fallbackRes = await fetch(`${baseUrl}/nav/admin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) {
        notifySuccess('Navigation saved successfully');
        return true;
      }
    }

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err.detail || err.message;
      } catch {
        // ignore parse error
      }
      notifyError('Failed to save navigation links', { detail });
      return false;
    }

    notifySuccess('Navigation saved successfully');
    return true;
  } catch (e) {
    notifyError('Network error while saving navigation links');
    return false;
  }
}

/** GET /nav - retrieve public navigation links for current language (server-side in Astro) */
export async function getPublicNav(locale: string = 'en'): Promise<NavItem[] | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = new URL(`${baseUrl}/nav/public`);
    url.searchParams.set('language', locale.toUpperCase());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let res: Response | null = null;
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } catch {
      // Query param attempt failed or timed out
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res || !res.ok) {
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return null;
    }

    const links: NavItem[] = data
      .map((item: any, index: number) => {
        const name = item?.name ?? item?.Name ?? '';
        const href = item?.url ?? item?.Url ?? '';
        const order =
          typeof item?.order === 'number'
            ? item.order
            : typeof item?.Order === 'number'
            ? item.Order
            : index;
        return {
          href,
          label: name,
          order,
        };
      })
      .filter((item) => item.href && item.label)
      .sort((a, b) => a.order - b.order)
      .map(({ href, label }) => ({ href, label }));
    return links.length > 0 ? links : null;
  } catch {
    return null;
  }
}

