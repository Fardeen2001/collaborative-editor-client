import { getToken, clearAuth } from "./auth";
import type { DocumentSummary, Snapshot, User } from "@/types";
import type { RuntimeConfig } from "@/types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function createRequester(apiUrl: string) {
  return async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${apiUrl}${path}`, { ...options, headers });
    } catch {
      throw new ApiError(
        `Cannot reach the server at ${apiUrl}. Make sure the backend is running (npm run dev in collaborative-editor-server).`,
        0
      );
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
      }
      throw new ApiError(
        (data as { error?: string }).error || "Request failed",
        res.status
      );
    }
    return data as T;
  };
}

export function createApi(config: RuntimeConfig) {
  const request = createRequester(config.apiUrl);

  return {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    listDocuments: () =>
      request<{ documents: DocumentSummary[] }>("/api/documents"),

    createDocument: (title: string) =>
      request<{ document: DocumentSummary }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),

    getDocument: (id: string) =>
      request<{ document: DocumentSummary }>(`/api/documents/${id}`),

    shareDocument: (id: string, email: string, role: "editor" | "viewer") =>
      request<{ access: { userId: string; email: string; role: string } }>(
        `/api/documents/${id}/share`,
        { method: "POST", body: JSON.stringify({ email, role }) }
      ),

    listSnapshots: (id: string) =>
      request<{ snapshots: Snapshot[] }>(`/api/documents/${id}/snapshots`),

    saveSnapshot: (id: string, label?: string) =>
      request<{ snapshot: Snapshot }>(`/api/documents/${id}/snapshots`, {
        method: "POST",
        body: JSON.stringify({ label }),
      }),

    restoreSnapshot: (id: string, snapshotId: string) =>
      request<{ success: boolean }>(
        `/api/documents/${id}/snapshots/${snapshotId}/restore`,
        { method: "POST" }
      ),

    improveText: (text: string, instruction?: string) =>
      request<{ improved: string }>("/api/ai/improve", {
        method: "POST",
        body: JSON.stringify({ text, instruction }),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApi>;
export { ApiError };
