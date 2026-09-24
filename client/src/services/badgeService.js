import { api } from "../api/api.js";

export const badgeService = {
  getMine: () => api.get("/badges/me"),
};
