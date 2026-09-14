// src/services/admin.ts
import { notifyError, notifySuccess } from "../stores/notification";
import { API_BASE_URL, getApiBaseUrl } from "./auth";

export interface AdminUser {
  email: string;
  name?: string | null;
  picture?: string | null;
}

/** GET /admin - retrieve list of admins */
export async function getAdmins(): Promise<AdminUser[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      notifyError("Failed to fetch admins", { detail: err.detail });
      return null;
    }
    const data = (await res.json()) as AdminUser[];
    return data;
  } catch (e) {
    notifyError("Network error while fetching admins");
    return null;
  }
}

/** DELETE /admin with email in body */
export async function deleteAdmin(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      notifyError("Failed to delete admin", { detail: err.detail });
      return false;
    }
    notifySuccess("Admin removed");
    return true;
  } catch (e) {
    notifyError("Network error while deleting admin");
    return false;
  }
}

/** POST /admin with email in body */
export async function addAdmin(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      notifyError("Failed to add admin", { detail: err.detail });
      return false;
    }
    notifySuccess("Admin added");
    return true;
  } catch (e) {
    notifyError("Network error while adding admin");
    return false;
  }
}
