import { staticStorage } from "@/lib/config";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(staticStorage.tokenKey);
}

export function setAuth(token: string, user: { id: string; email: string; name: string }) {
  localStorage.setItem(staticStorage.tokenKey, token);
  localStorage.setItem(staticStorage.userKey, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(staticStorage.tokenKey);
  localStorage.removeItem(staticStorage.userKey);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(staticStorage.userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export function requireAuthOrRedirect(router: { replace: (path: string) => void }): boolean {
  if (!isAuthenticated()) {
    clearAuth();
    router.replace("/login");
    return false;
  }
  return true;
}
