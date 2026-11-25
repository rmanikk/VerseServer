const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOKEN_KEY = "verseserver_admin_token";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { token, headers, ...requestOptions } = options;

  const adminToken =
    token ??
    (typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(TOKEN_KEY)
      : null);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      result?.message || "Something went wrong. Please try again.",
      response.status,
    );
  }

  return result as ApiResponse<T>;
}