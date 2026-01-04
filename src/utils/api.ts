const API_BASE = "http://localhost:8080";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
   const token = localStorage.getItem("accessToken");

   const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
   };

   if (token) {
      headers["Authorization"] = `Bearer ${token}`;
   }

   const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
   });

   if (response.status === 401 || response.status === 403) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      throw new Error("Authentication failed");
   }

   return response;
}
