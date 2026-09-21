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
        thumbnailUrl: `${baseUrl}/uploads/thumbs/${img.id || img.Id}_thumb.webp`,
      }));
    }
    return [];
  } catch (e) {
    notifyError("Network error while loading images");
    return [];
  }
}

/**
 * Deletes an image by ID via DELETE /image.
 */
export async function deleteImage(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/image`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
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
      notifyError(errorMsg);
      return false;
    }

    notifySuccess("Image deleted successfully");
    return true;
  } catch (e) {
    notifyError("Network error while deleting image");
    return false;
  }
}


