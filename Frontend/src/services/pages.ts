// src/services/pages.ts
import { notifyError, notifySuccess } from '../stores/notification';
import { getApiBaseUrl } from './auth';

export type PageType = 'STANDART' | 'COMICS';
export type Language = 'EN' | 'CS';

export interface PageContentDto {
  language: Language;
  title: string;
  subtitle: string;
}

export interface PageDto {
  id: string; // Guid
  url: string;
  pageType: PageType;
  contents: PageContentDto[];
}

export interface CreatePagePayload {
  pageType: PageType;
  url: string;
  contents: {
    language: Language;
    title: string;
    subtitle: string;
  }[];
}

export interface UpdatePagePayload {
  id: string;
  url: string;
  contents: {
    language: Language;
    title: string;
    subtitle: string;
  }[];
}

export function normalizeLanguage(lang: unknown): Language {
  if (typeof lang === 'number' || lang === '0' || lang === '1') {
    return (lang === 1 || lang === '1') ? 'CS' : 'EN';
  }
  if (String(lang).toUpperCase() === 'CS') {
    return 'CS';
  }
  return 'EN';
}

export function normalizePageType(type: unknown): PageType {
  if (typeof type === 'number' || type === '0' || type === '1') {
    return (type === 1 || type === '1') ? 'COMICS' : 'STANDART';
  }
  if (String(type).toUpperCase() === 'COMICS') {
    return 'COMICS';
  }
  return 'STANDART';
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+|-+$/g, '');
}

/** GET /page/all - retrieve all pages */
export async function getAllPages(): Promise<PageDto[] | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/page/all`, {
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
      notifyError('Failed to fetch pages', { detail });
      return null;
    }

    const data = await res.json();
    const rawPages = Array.isArray(data?.pages) ? data.pages : Array.isArray(data) ? data : [];

    return rawPages.map((p: any) => {
      const rawContents = Array.isArray(p.contents) ? p.contents : Array.isArray(p.Contents) ? p.Contents : [];
      let enContent: PageContentDto = { language: 'EN', title: '', subtitle: '' };
      let csContent: PageContentDto = { language: 'CS', title: '', subtitle: '' };

      for (const c of rawContents) {
        const lang = normalizeLanguage(c.language ?? c.Language);
        const title = c.title ?? c.Title ?? '';
        const subtitle = c.subtitle ?? c.Subtitle ?? '';
        if (lang === 'EN') {
          enContent = { language: 'EN', title, subtitle };
        } else if (lang === 'CS') {
          csContent = { language: 'CS', title, subtitle };
        }
      }

      return {
        id: p.id || p.Id,
        url: p.url || p.Url || '',
        pageType: normalizePageType(p.pageType ?? p.PageType),
        contents: [enContent, csContent],
      };
    });
  } catch (e) {
    notifyError('Network error while fetching pages');
    return null;
  }
}

/** POST /page - create a new page */
export async function createPage(payload: CreatePagePayload): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();

    // Map enums to numeric values for ASP.NET Core default serialization
    const bodyNumeric = {
      pageType: payload.pageType === 'COMICS' ? 1 : 0,
      url: payload.url,
      contents: payload.contents.map((c) => ({
        language: c.language === 'CS' ? 1 : 0,
        title: c.title,
        subtitle: c.subtitle,
      })),
    };

    let res = await fetch(`${baseUrl}/page`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyNumeric),
    });

    // If 400, retry with string enums if enum parsing might be string-based
    if (res.status === 400) {
      const bodyString = {
        pageType: payload.pageType,
        url: payload.url,
        contents: payload.contents.map((c) => ({
          language: c.language,
          title: c.title,
          subtitle: c.subtitle,
        })),
      };
      const retryRes = await fetch(`${baseUrl}/page`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyString),
      });
      if (retryRes.ok) {
        const data = await retryRes.json();
        notifySuccess('Page created successfully');
        return { success: true, pageId: data.pageId || data.PageId };
      }
    }

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err.detail || err.message || err.title;
      } catch {
        // ignore parse error
      }
      notifyError('Failed to create page', { detail });
      return { success: false, error: detail || 'Failed to create page' };
    }

    const data = await res.json();
    notifySuccess('Page created successfully');
    return { success: true, pageId: data.pageId || data.PageId };
  } catch (e) {
    notifyError('Network error while creating page');
    return { success: false, error: 'Network error' };
  }
}

/** PATCH /page - update existing page */
export async function updatePage(payload: UpdatePagePayload): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();

    const bodyNumeric = {
      id: payload.id,
      url: payload.url,
      contents: payload.contents.map((c) => ({
        language: c.language === 'CS' ? 1 : 0,
        title: c.title,
        subtitle: c.subtitle,
      })),
    };

    let res = await fetch(`${baseUrl}/page`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyNumeric),
    });

    if (res.status === 400) {
      const bodyString = {
        id: payload.id,
        url: payload.url,
        contents: payload.contents.map((c) => ({
          language: c.language,
          title: c.title,
          subtitle: c.subtitle,
        })),
      };
      const retryRes = await fetch(`${baseUrl}/page`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyString),
      });
      if (retryRes.ok) {
        notifySuccess('Changes saved successfully');
        return { success: true };
      }
    }

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err.detail || err.message || err.title;
      } catch {
        // ignore parse error
      }
      notifyError('Failed to save changes', { detail });
      return { success: false, error: detail || 'Failed to save changes' };
    }

    notifySuccess('Changes saved successfully');
    return { success: true };
  } catch (e) {
    notifyError('Network error while saving page changes');
    return { success: false, error: 'Network error' };
  }
}

/** DELETE /page - delete a page */
export async function deletePage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();

    const res = await fetch(`${baseUrl}/page`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const err = await res.json();
        detail = err.detail || err.message || err.title;
      } catch {
        // ignore parse error
      }
      notifyError('Failed to delete page', { detail });
      return { success: false, error: detail || 'Failed to delete page' };
    }

    notifySuccess('Page deleted successfully');
    return { success: true };
  } catch (e) {
    notifyError('Network error while deleting page');
    return { success: false, error: 'Network error' };
  }
}

export interface PublicPageContent {
  title: string;
  subtitle: string;
  patterns?: any[];
}

/** GET /page/content?url=...&language=... - retrieve public page content on server-side */
export async function getPublicPageContent(
  urlPath: string,
  locale: string = 'en'
): Promise<PublicPageContent | null> {
  const fetchWithUrl = async (targetUrl: string): Promise<PublicPageContent | null> => {
    try {
      const baseUrl = getApiBaseUrl();
      const langParam = locale.toUpperCase() === 'CS' ? '1' : '0';
      const endpoint = `${baseUrl}/page/content?url=${encodeURIComponent(targetUrl)}&language=${langParam}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      const page = data?.page ?? data?.Page;
      if (data?.success && page) {
        return {
          title: page.title ?? page.Title ?? '',
          subtitle: page.subtitle ?? page.Subtitle ?? '',
          patterns: page.patterns ?? page.Patterns ?? [],
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Try the provided urlPath
  let result = await fetchWithUrl(urlPath);
  if (result) return result;

  // Try alternate leading slash variation
  if (urlPath.startsWith('/')) {
    result = await fetchWithUrl(urlPath.slice(1));
    if (result) return result;
  } else {
    result = await fetchWithUrl(`/${urlPath}`);
    if (result) return result;
  }

  return null;
}

