import axios from "axios";

const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const apiBaseUrl = import.meta.env.PROD
  ? "/api"
  : configuredApiBaseUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});
