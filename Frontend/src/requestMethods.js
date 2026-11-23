import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1/";

export const publicRequest = axios.create({
  baseURL: BASE_URL,
});

publicRequest.interceptors.request.use((config) => {
  try {
    const persistedRoot = localStorage.getItem("persist:root");
    if (persistedRoot) {
      const parsed = JSON.parse(persistedRoot);
      const currentUser = parsed.currentUser
        ? JSON.parse(parsed.currentUser)
        : null;
      if (currentUser?.accessToken) {
        config.headers.Authorization = `Bearer ${currentUser.accessToken}`;
      }
    }
  } catch {
    // ignore storage parsing issues
  }
  return config;
});
