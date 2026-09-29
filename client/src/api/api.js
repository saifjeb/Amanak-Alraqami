import axios from "axios";

const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

const apiBaseUrl =
  import.meta.env.PROD
    ? "/api"
    : configuredApiBaseUrl;

const apiTimeout =
  import.meta.env.PROD
    ? 75000
    : 10000;

const renderHealthUrl =
  "https://amanak-alraqami.onrender.com/health";

const warmupTimeoutMs = 60000;
const warmupCacheMs = 10 * 60 * 1000;
const retryDelayMs = 2500;

const retryableStatuses =
  new Set([502, 503, 504]);

const safeRetryMethods =
  new Set([
    "get",
    "head",
    "options",
  ]);

let warmupPromise = null;
let lastWarmupAt = 0;

const wait = (milliseconds) =>
  new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });

async function performWarmup() {
  const controller =
    new AbortController();

  const timer =
    window.setTimeout(
      () => controller.abort(),
      warmupTimeoutMs,
    );

  try {
    const response =
      await fetch(
        renderHealthUrl,
        {
          method: "GET",
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        },
      );

    if (!response.ok) {
      throw new Error(
        `Server warmup failed with status ${response.status}`,
      );
    }

    lastWarmupAt = Date.now();
  } finally {
    window.clearTimeout(timer);
  }
}

export async function ensureApiAwake() {
  if (
    !import.meta.env.PROD ||
    typeof window === "undefined" ||
    !navigator.onLine
  ) {
    return;
  }

  const stillFresh =
    lastWarmupAt > 0 &&
    Date.now() - lastWarmupAt <
      warmupCacheMs;

  if (stillFresh) {
    return;
  }

  if (!warmupPromise) {
    warmupPromise =
      performWarmup()
        .catch((error) => {
          lastWarmupAt = 0;
          throw error;
        })
        .finally(() => {
          warmupPromise = null;
        });
  }

  return warmupPromise;
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: apiTimeout,
  headers: {
    Accept: "application/json",
  },
});

/*
 * Before an API request, give the free Render
 * service a chance to wake up.
 */
api.interceptors.request.use(
  async (config) => {
    if (import.meta.env.PROD) {
      try {
        await ensureApiAwake();
      } catch {
        /*
         * Continue with the real API request.
         * Its normal error handling still applies.
         */
      }
    }

    return config;
  },
);

/*
 * Retry only safe/read-only requests.
 * Never automatically repeat POST, PUT,
 * PATCH or DELETE operations.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const config = error.config;

    if (
      !import.meta.env.PROD ||
      !config
    ) {
      return Promise.reject(error);
    }

    const method =
      String(
        config.method || "get",
      ).toLowerCase();

    if (
      !safeRetryMethods.has(method)
    ) {
      return Promise.reject(error);
    }

    const retryCount =
      Number(
        config.__amanakRetryCount || 0,
      );

    if (retryCount >= 1) {
      return Promise.reject(error);
    }

    const status =
      error.response?.status;

    const gatewayFailure =
      retryableStatuses.has(status);

    const networkFailure =
      !error.response &&
      error.code !== "ECONNABORTED" &&
      error.code !== "ERR_CANCELED";

    if (
      !gatewayFailure &&
      !networkFailure
    ) {
      return Promise.reject(error);
    }

    config.__amanakRetryCount =
      retryCount + 1;

    lastWarmupAt = 0;

    try {
      await ensureApiAwake();
    } catch {
      // The retry itself remains the final check.
    }

    await wait(retryDelayMs);

    return api.request(config);
  },
);

/*
 * Start waking Render as soon as the
 * application JavaScript loads.
 */
if (
  import.meta.env.PROD &&
  typeof window !== "undefined"
) {
  void ensureApiAwake().catch(
    () => {},
  );
}
