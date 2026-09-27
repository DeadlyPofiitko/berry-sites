// src/services/pattern.ts
import { notifyError, notifySuccess } from '../stores/notification';
import { getApiBaseUrl } from './auth';

export enum PatternType {
  ROW = 0,
  COLUMN = 1,
}

export interface PatternImageDto {
  order: number;
  imageId: string;
  height: number;
  width: number;
}

export interface PatternDto {
  id: string;
  order: number;
  patternType?: PatternType | number | string;
  images: PatternImageDto[];
}

export interface SetPatternDto {
  patternId: string;
  imageIdsOrder: string[];
}

export interface ChangePatternPayload {
  pageId: string;
  patternsOrder: SetPatternDto[];
}

export type ImageQuality = 'sm' | 'md' | 'lg';

/**
 * Returns available quality options for an image based on original dimensions.
 * Max dimension = Math.max(width, height)
 * sm: max 500px (always available)
 * md: max 900px (only if original max dimension >= 900 or > 500)
 * lg: max 1400px (only if original max dimension >= 1400 or > 900)
 */
export function getAvailableQualities(width: number, height: number): ImageQuality[] {
  const maxDim = Math.max(width || 0, height || 0);
  const qualities: ImageQuality[] = ['sm'];
  if (maxDim > 500) {
    qualities.push('md');
  }
  if (maxDim > 900) {
    qualities.push('lg');
  }
  return qualities;
}

/**
 * Resolves thumbnail url for an image with desired quality fallback.
 */
export function getThumbnailUrl(
  id: string,
  width?: number,
  height?: number,
  preferred: ImageQuality = 'md'
): string {
  const baseUrl = getApiBaseUrl();
  let quality = preferred;
  if (width && height) {
    const available = getAvailableQualities(width, height);
    if (!available.includes(quality)) {
      quality = available[available.length - 1]; // pick largest available
    }
  }
  return `${baseUrl}/uploads/thumbs/${id}_${quality}.webp`;
}

/**
 * Resolves full original webp url for PhotoSwipe.
 */
export function getFullImageUrl(id: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/uploads/full/${id}_full.webp`;
}

/**
 * Generates responsive srcset string based on available qualities.
 */
export function getImageSrcSet(id: string, width: number, height: number): string {
  const baseUrl = getApiBaseUrl();
  const available = getAvailableQualities(width, height);
  const sources: string[] = [];
  if (available.includes('sm')) sources.push(`${baseUrl}/uploads/thumbs/${id}_sm.webp 500w`);
  if (available.includes('md')) sources.push(`${baseUrl}/uploads/thumbs/${id}_md.webp 900w`);
  if (available.includes('lg')) sources.push(`${baseUrl}/uploads/thumbs/${id}_lg.webp 1400w`);
  return sources.join(', ');
}

/**
 * GET /pattern?pageId=... - retrieves patterns for a page
 */
export async function getPagePatterns(pageId: string): Promise<PatternDto[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/pattern?pageId=${encodeURIComponent(pageId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      notifyError('Failed to load page gallery patterns');
      return [];
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.patterns)) {
      return data.patterns
        .map((p: any) => {
          const rawType = p.patternType ?? p.PatternType;
          let parsedType: PatternType = PatternType.ROW;
          if (rawType !== undefined && rawType !== null) {
            if (rawType === 1 || rawType === 'COLUMN' || rawType === 'Column') {
              parsedType = PatternType.COLUMN;
            } else {
              parsedType = PatternType.ROW;
            }
          }

          const rawImages = p.images || p.Images || [];
          const images: PatternImageDto[] = rawImages
            .map((img: any) => ({
              order: img.order ?? img.Order ?? 0,
              imageId: img.imageId || img.ImageId,
              height: img.height ?? img.Height ?? 0,
              width: img.width ?? img.Width ?? 0,
            }))
            .sort((a: any, b: any) => a.order - b.order);

          return {
            id: p.id || p.Id,
            order: p.order ?? p.Order ?? 0,
            patternType: parsedType,
            images,
          };
        })
        .sort((a: any, b: any) => a.order - b.order);
    }
    return [];
  } catch (e) {
    notifyError('Network error while loading patterns');
    return [];
  }
}

/**
 * POST /pattern - creates a new pattern row for a page
 */
export async function createPattern(pageId: string, patternType: PatternType): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/pattern`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId,
        patternType,
      }),
    });

    if (!res.ok) {
      let msg = 'Failed to create pattern';
      try {
        const err = await res.json();
        if (err.detail) msg = err.detail;
        else if (err.message) msg = err.message;
      } catch {}
      notifyError(msg);
      return false;
    }

    notifySuccess('Pattern row added');
    return true;
  } catch (e) {
    notifyError('Network error while creating pattern');
    return false;
  }
}

/**
 * PATCH /pattern - changes order of patterns and their image assignment/order
 */
export async function changePatterns(
  pageId: string,
  patternsOrder: SetPatternDto[]
): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/pattern`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId,
        patternsOrder,
      }),
    });

    if (!res.ok) {
      let msg = 'Failed to save gallery changes';
      try {
        const err = await res.json();
        if (err.detail) msg = err.detail;
        else if (err.message) msg = err.message;
      } catch {}
      notifyError(msg);
      return false;
    }

    notifySuccess('Gallery saved successfully');
    return true;
  } catch (e) {
    notifyError('Network error while saving gallery');
    return false;
  }
}

/**
 * DELETE /pattern - deletes a pattern row
 */
export async function deletePattern(patternId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/pattern`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patternId,
      }),
    });

    if (!res.ok) {
      let msg = 'Failed to delete pattern';
      try {
        const err = await res.json();
        if (err.detail) msg = err.detail;
        else if (err.message) msg = err.message;
      } catch {}
      notifyError(msg);
      return false;
    }

    notifySuccess('Pattern row deleted');
    return true;
  } catch (e) {
    notifyError('Network error while deleting pattern');
    return false;
  }
}
