const API_BASE_URL = "/api/backend";

interface ApiErrorBody {
  detail?: string;
  errors?: Array<{ field: string; message: string }>;
}

function getErrorMessage(status: number, body: ApiErrorBody): string {
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    const label = first.field ? `${first.field}: ` : "";
    return `${body.detail || "Validation error"} - ${label}${first.message}`;
  }
  if (body.detail) {
    return body.detail;
  }
  return `Request failed: ${status}`;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    const hasBody = options.body !== undefined && options.body !== null;
    const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
    if (hasBody && !hasContentType && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
      throw new Error(getErrorMessage(res.status, body));
    }

    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    return (await res.text()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, data?: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(data) });
  }

  patch<T>(path: string, data?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(data) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  private getFilenameFromDisposition(disposition: string | null): string | null {
    if (!disposition) return null;

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const quotedMatch = disposition.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
      return quotedMatch[1];
    }

    const plainMatch = disposition.match(/filename=([^;]+)/i);
    return plainMatch?.[1]?.trim() ?? null;
  }

  async download(path: string): Promise<{ blob: Blob; filename: string | null }> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
      throw new Error(getErrorMessage(res.status, body));
    }

    return {
      blob: await res.blob(),
      filename: this.getFilenameFromDisposition(res.headers.get("content-disposition")),
    };
  }

  async uploadCsv<T>(path: string, file: File) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
      throw new Error(getErrorMessage(res.status, body));
    }
    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }
    return res.json() as T;
  }
}

export const api = new ApiClient();
