const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const getFullImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const host = apiBase.replace(/\/api\/?$/, "");
  if (host) {
    return `${host}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
};

export const getAuthToken = () => localStorage.getItem("lith_token");
export const setAuthToken = (token) => localStorage.setItem("lith_token", token);
export const removeAuthToken = () => localStorage.removeItem("lith_token");

const request = async (endpoint, options = {}) => {
  const headers = { ...options.headers };
  const token = getAuthToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "An unexpected error occurred");
  }

  return data;
};

export const api = {
  // Auth
  register: (phone_or_email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ phone_or_email, password }),
    }),

  login: (phone_or_email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone_or_email, password }),
    }),

  getMe: () => request("/auth/me"),

  // Documents
  uploadDocument: (file, title, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    return request("/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  getDocuments: () => request("/documents"),

  getDocumentStatus: (docId) => request(`/documents/${docId}`),

  getDocumentPage: (docId, pageNumber) =>
    request(`/documents/${docId}/pages/${pageNumber}`),

  deleteDocument: (docId) =>
    request(`/documents/${docId}`, { method: "DELETE" }),

  downloadTranslatedPdf: async (docId, mode = "bilingual", filename = "lecture_bilingual.pdf") => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/documents/${docId}/export-pdf?mode=${mode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("فشل تحميل ملف PDF المترجم");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Payments
  submitPayment: (data) =>
    request("/payments/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyPayments: () => request("/payments/my-payments"),

  getPendingPayments: () => request("/payments/admin/pending"),

  verifyPayment: (paymentId, action) =>
    request(`/payments/admin/${paymentId}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
