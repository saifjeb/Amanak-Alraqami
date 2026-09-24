import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
})