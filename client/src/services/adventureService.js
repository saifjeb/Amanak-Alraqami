import { api } from "../api/api.js";

export const adventureService = {
  list: () => api.get("/adventures"),
  getById: (id) => api.get(`/adventures/${id}`),
};
