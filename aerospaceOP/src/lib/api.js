/* One place that knows where the API is and how to talk to it.
   VITE_API_BASE is empty in production when the API sits behind the same
   domain; set it to the Render/Railway URL otherwise. */
export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

/* sessionStorage, not localStorage: the token dies with the tab. Committee
   members share lab machines, and a forgotten browser window should not
   leave the site editable. */
const TOKEN_KEY = "stratosphere-admin-token";

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode / storage blocked
  }
};

export const setToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to do: the session just will not survive a reload */
  }
};

export const clearToken = () => setToken(null);

/* Turns a stored "/api/media/<id>" into something the browser can load when
   the API lives on another origin. Absolute URLs and files in public/ pass
   through untouched. */
export function mediaUrl(src) {
  if (!src) return src;
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/api/")) return `${API_BASE}${src}`;
  return src;
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || [];
  }
}

export async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = {};
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  // Let the browser set the multipart boundary; setting it by hand breaks upload.
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    signal,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    /* The token is gone or the account was suspended — drop it so the panel
       falls back to the login screen rather than looping on 401s. */
    if (res.status === 401 && auth && token) clearToken();
    throw new ApiError(payload.message || `Request failed (${res.status})`, res.status, payload.errors);
  }

  return payload;
}

export const api = {
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/api/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/api/auth/password", { method: "POST", body: { currentPassword, newPassword } }),

  getContent: (signal) => request("/api/content", { auth: false, signal }),
  saveSection: (key, value) => request(`/api/content/${key}`, { method: "PUT", body: { value } }),
  resetSection: (key) => request(`/api/content/${key}`, { method: "DELETE" }),

  listMedia: () => request("/api/media"),
  uploadMedia: (formData) => request("/api/media", { method: "POST", body: formData }),
  deleteMedia: (id) => request(`/api/media/${id}`, { method: "DELETE" }),

  listUsers: () => request("/api/users"),
  createUser: (data) => request("/api/users", { method: "POST", body: data }),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: "PATCH", body: data }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
};
