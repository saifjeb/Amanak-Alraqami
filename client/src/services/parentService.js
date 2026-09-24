import { api } from "../api/api.js";

export const parentService = {
  getSession: () => api.get("/parent/me"),
  login: (credentials) => api.post("/parent/login", credentials),
  logout: () => api.post("/parent/logout"),
};
