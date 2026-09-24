import { api } from "../api/api.js";

export const authService = {
  registerChild: (credentials) => api.post("/auth/register", credentials),
  loginChild: (credentials) => api.post("/auth/login", credentials),
  getChildSession: () => api.get("/auth/me"),
  logoutChild: () => api.post("/auth/logout"),
};
