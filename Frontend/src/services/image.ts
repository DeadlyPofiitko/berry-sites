// src/services/image.ts
import { notifyError, notifySuccess } from "../stores/notification";
import { getApiBaseUrl } from "./auth";

export interface ImageUploadItemPayload {
  file: File;
  name?: string | null;
}

/**
 * Uploads a batch of PNG images to the backend via POST /image/upload.
 * Sends FormData with 'Items[i].File' (IFormFile) and 'Items[i].Name' (string).
 * If name is null, undefined, or empty, the backend will use the original file name.
 */
export async function uploadImages(items: ImageUploadItemPayload[]): Promise<boolean> {
  if (!items || items.length === 0) {
    notifyError("No images selected for upload.");
    return false;
  }

  const formData = new FormData();
  items.forEach((item, index) => {
    formData.append(`Items[${index}].File`, item.file);
    const customName = item.name ? item.name.trim() : "";
    formData.append(`Items[${index}].Name`, customName);
  });

  try {
    const res = await fetch(`${getApiBaseUrl()}/image/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = "Failed to upload image(s)";
      try {
        const err = await res.json();
        if (err.detail) errorMsg = err.detail;
        else if (err.message) errorMsg = err.message;
        else if (typeof err === "string") errorMsg = err;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      notifyError(errorMsg);
      return false;
    }

    notifySuccess(
      items.length > 1
        ? `${items.length} images uploaded successfully`
        : "Image uploaded successfully"
    );
    return true;
  } catch (e) {
    notifyError("Network error while uploading image(s)");
    return false;
  }
}

/**
 * Uploads a single PNG image (convenience wrapper around uploadImages).
 */
export async function uploadImage(file: File, name?: string | null): Promise<boolean> {
  return uploadImages([{ file, name }]);
}

export interface BackendImage {
  id: string;
  createdAt: string;
  name: string;
  height: number;
  width: number;
  fullUrl: string;
  thumbnailUrl: string;
}

/**
 * Fetches all uploaded images from GET /image.
 */
export async function getAllImages(): Promise<BackendImage[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/image`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      notifyError("Failed to fetch images");
      return [];
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.images)) {
      const baseUrl = getApiBaseUrl();
      return data.images.map((img: any) => ({
        id: img.id || img.Id,
        createdAt: img.createdAt || img.CreatedAt,
        name: img.name || img.Name,
        height: img.height || img.Height || 0,
        width: img.width || img.Width || 0,
        fullUrl: `${baseUrl}/uploads/full/${img.id || img.Id}_full.webp`,
        thumbnailUrl: `${baseUrl}/uploads/thumbs/${img.id || img.Id}_sm.webp`,
      }));
    }
    return [];
  } catch (e) {
    notifyError("Network error while loading images");
    return [];
  }
}

export interface DeleteImagePayload {
  id: string;
  replaceWithId?: string | null;
  forced?: boolean;
}

export interface DeleteImageResult {
  success: boolean;
  errorMessage?: string;
  requiresReplacement?: boolean;
  usedInSections?: string;
}

/**
 * Deletes an image via DELETE /image.
 * Supports replacing pattern references with `replaceWithId` and forcing deletion when used in sections via `forced`.
 */
export async function deleteImage(
  payloadOrId: DeleteImagePayload | string
): Promise<DeleteImageResult> {
  const payload: DeleteImagePayload =
    typeof payloadOrId === "string"
      ? { id: payloadOrId, replaceWithId: null, forced: false }
      : {
          id: payloadOrId.id,
          replaceWithId: payloadOrId.replaceWithId ?? null,
          forced: Boolean(payloadOrId.forced),
        };

  try {
    const res = await fetch(`${getApiBaseUrl()}/image`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = "Failed to delete image";
      try {
        const err = await res.json();
        if (err.detail) errorMsg = err.detail;
        else if (err.message) errorMsg = err.message;
        else if (typeof err === "string") errorMsg = err;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }

      const lower = errorMsg.toLowerCase();
      if (lower.includes("cannot delete used image")) {
        notifyError(errorMsg);
        return {
          success: false,
          errorMessage: errorMsg,
          requiresReplacement: true,
        };
      }

      if (lower.startsWith("section(s):") || lower.includes("section(s):")) {
        notifyError(`Image is used in ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
          usedInSections: errorMsg,
        };
      }

      notifyError(errorMsg);
      return {
        success: false,
        errorMessage: errorMsg,
      };
    }

    notifySuccess("Image deleted successfully");
    return { success: true };
  } catch (e) {
    const errorMsg = "Network error while deleting image";
    notifyError(errorMsg);
    return {
      success: false,
      errorMessage: errorMsg,
    };
  }
}


