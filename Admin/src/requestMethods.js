import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1/";

export const publicRequest = axios.create({
  baseURL: BASE_URL,
});

publicRequest.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("sendit_admin_user");
    if (raw) {
      const admin = JSON.parse(raw);
      if (admin?.accessToken) {
        config.headers.Authorization = `Bearer ${admin.accessToken}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});
