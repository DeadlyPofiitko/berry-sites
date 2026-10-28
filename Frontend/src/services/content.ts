// src/services/content.ts
import { notifyError, notifySuccess } from '../stores/notification';
import { getApiBaseUrl } from './auth';

export type Language = 'EN' | 'CS';

export interface SectionContentApi {
  id: string;
  language: Language | number | string;
  json: string;
  sectionId: string;
}

export interface SectionApi {
  id: string;
  name: string;
  contents: SectionContentApi[];
}

export interface ContactItem {
  id: string;
  url: string;
  text: string;
  svg?: string | null;
}

export interface ContactsSectionData {
  title: string;
  subtitle: string;
  items: ContactItem[];
}

export interface UpdateSectionContentPayload {
  id: string;
  content: string;
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

export function parseContactsJson(rawJson: string): ContactsSectionData {
  try {
    const parsed = JSON.parse(rawJson || '{}');
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : '',
      items: Array.isArray(parsed.items)
        ? parsed.items.map((it: any) => ({
            id: it.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
            url: typeof it.url === 'string' ? it.url : '',
            text: typeof it.text === 'string' ? it.text : '',
            svg: typeof it.svg === 'string' && it.svg.trim() ? it.svg : null,
          }))
        : [],
    };
  } catch {
    return { title: '', subtitle: '', items: [] };
  }
}

export type AboutBlockType = 'content' | 'image';

export interface AboutContentBlock {
  id: string;
  type: 'content';
  content: string;
}

export interface AboutImageBlock {
  id: string;
  type: 'image';
  image: string;
  caption?: string;
}

export type AboutBlock = AboutContentBlock | AboutImageBlock;

export interface AboutSectionData {
  title: string;
  blocks: AboutBlock[];
  content?: string;
  image?: string;
}

function toPreviewImageUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  if (url.includes('/uploads/full/')) {
    return url.replace('/uploads/full/', '/uploads/thumbs/').replace('_full.webp', '_md.webp');
  }
  return url;
}

export function parseAboutJson(rawJson: string): AboutSectionData {
  try {
    const parsed = JSON.parse(rawJson || '{}');
    const title = typeof parsed.title === 'string' ? parsed.title : '';

    let blocks: AboutBlock[] = [];

    if (Array.isArray(parsed.blocks)) {
      blocks = parsed.blocks
        .filter((b: any) => b && typeof b === 'object' && (b.type === 'content' || b.type === 'image'))
        .map((b: any) => {
          const id =
            typeof b.id === 'string' && b.id
              ? b.id
              : typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2, 9);

          if (b.type === 'image') {
            return {
              id,
              type: 'image' as const,
              image: toPreviewImageUrl(b.image),
            };
          }

          return {
            id,
            type: 'content' as const,
            content: typeof b.content === 'string' ? b.content : '',
          };
        });
    } else {
      // Migrate legacy single image/content into blocks
      if (typeof parsed.image === 'string' && parsed.image) {
        blocks.push({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          type: 'image',
          image: toPreviewImageUrl(parsed.image),
        });
      }
      if (typeof parsed.content === 'string' && parsed.content) {
        blocks.push({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          type: 'content',
          content: parsed.content,
        });
      }
    }

    return {
      title,
      blocks,
    };
  } catch {
    return { title: '', blocks: [] };
  }
}

/**
 * Fetches all sections via GET /content/all
 */
export async function getAllSections(): Promise<SectionApi[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/section/all`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      notifyError('Failed to fetch content sections');
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.sections) ? data.sections : [];
  } catch {
    notifyError('Network error while loading content sections');
    return [];
  }
}

/**
 * Creates a new section via POST /content
 */
export async function createSection(name: string): Promise<SectionApi | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/section`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to create section';
      try {
        const err = await res.json();
        if (err.detail) errorMsg = err.detail;
        else if (err.message) errorMsg = err.message;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      notifyError(errorMsg);
      return null;
    }

    const data = await res.json();
    return data.section || null;
  } catch {
    notifyError('Network error while creating section');
    return null;
  }
}

/**
 * Updates section content records via PATCH /content
 */
export async function updateSectionContent(
  dtos: UpdateSectionContentPayload[],
  successMessage?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/section`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dtos),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to save section content';
      try {
        const err = await res.json();
        if (err.detail) errorMsg = err.detail;
        else if (err.message) errorMsg = err.message;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      notifyError(errorMsg);
      return false;
    }

    if (successMessage) {
      notifySuccess(successMessage);
    }
    return true;
  } catch {
    notifyError('Network error while saving section content');
    return false;
  }
}

/**
 * Retrieves or automatically initializes the 'contacts' section.
 */
export async function getOrCreateContactsSection(): Promise<SectionApi | null> {
  const sections = await getAllSections();
  const existing = sections.find((s) => s.name?.toLowerCase() === 'contacts');

  if (existing) {
    return existing;
  }

  // Create it if it doesn't exist yet
  const created = await createSection('contacts');
  return created;
}

/**
 * Retrieves or automatically initializes the 'about' section.
 */
export async function getOrCreateAboutSection(): Promise<SectionApi | null> {
  const sections = await getAllSections();
  const existing = sections.find((s) => s.name?.toLowerCase() === 'about');

  if (existing) {
    return existing;
  }

  // Create it if it doesn't exist yet
  const created = await createSection('about');
  return created;
}

/**
 * GET /section/content?Language=...&Name=... - fetches section content by language and section name.
 */
export async function getSectionContent(name: string, locale: string = 'en'): Promise<ContactsSectionData | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const langParam = locale.toUpperCase() === 'CS' ? '1' : '0';
    const endpoint = `${baseUrl}/section/content?Language=${langParam}&Name=${encodeURIComponent(name)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.content) {
      return parseContactsJson(data.content);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /section/content?Language=...&Name=about - fetches and parses about section content by language.
 */
export async function getAboutContent(locale: string = 'en'): Promise<AboutSectionData | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const langParam = locale.toUpperCase() === 'CS' ? '1' : '0';
    const endpoint = `${baseUrl}/section/content?Language=${langParam}&Name=about`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.content) {
      return parseAboutJson(data.content);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves an about block image URL into a high-performance responsive image with srcset.
 */
export function resolveAboutImage(url: string) {
  if (!url) return null;
  const match = url.match(/\/uploads\/(?:thumbs|full)\/([a-zA-Z0-9-]+)_(?:sm|md|lg|full)\.webp/);
  if (match) {
    const imageId = match[1];
    const baseUrl = url.includes('/uploads/')
      ? url.substring(0, url.indexOf('/uploads/')) || getApiBaseUrl()
      : getApiBaseUrl();

    return {
      src: `${baseUrl}/uploads/thumbs/${imageId}_md.webp`,
      srcSet: `${baseUrl}/uploads/thumbs/${imageId}_sm.webp 500w, ${baseUrl}/uploads/thumbs/${imageId}_md.webp 900w, ${baseUrl}/uploads/thumbs/${imageId}_lg.webp 1400w, ${baseUrl}/uploads/full/${imageId}_full.webp 1920w`,
      sizes: '(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 880px',
    };
  }

  return {
    src: url,
    srcSet: undefined,
    sizes: undefined,
  };
}

