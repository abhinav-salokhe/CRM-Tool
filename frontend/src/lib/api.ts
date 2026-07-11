const AUTH_TOKEN_KEY = "crm_token";
const AUTH_USERNAME_KEY = "crm_username";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const buildUrl = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) return input;
    return `${API_BASE_URL}${input.startsWith("/") ? input : `/${input}`}`;
  }

  return input;
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getStoredUsername = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_USERNAME_KEY);
};

export const storeAuth = (username: string, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USERNAME_KEY, username);
};

export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USERNAME_KEY);
};

export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(buildUrl(input), {
    ...init,
    headers,
    credentials: "include",
  });
};
