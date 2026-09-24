import { api } from "../api/api.js";

export const adminService = {
  getSession: () => api.get("/admin/me"),
  login: (credentials) => api.post("/admin/login", credentials),
  logout: () => api.post("/admin/logout"),
};
