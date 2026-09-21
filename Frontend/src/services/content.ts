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
  svg: string;
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
            svg: typeof it.svg === 'string' ? it.svg : '',
          }))
        : [],
    };
  } catch {
    return { title: '', subtitle: '', items: [] };
  }
}

/**
 * Fetches all sections via GET /content/all
 */
export async function getAllSections(): Promise<SectionApi[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/content/all`, {
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
    const res = await fetch(`${getApiBaseUrl()}/content`, {
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
export async function updateSectionContent(dtos: UpdateSectionContentPayload[]): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/content`, {
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

    notifySuccess('Contacts saved successfully');
    return true;
  } catch {
    notifyError('Network error while saving contacts');
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
