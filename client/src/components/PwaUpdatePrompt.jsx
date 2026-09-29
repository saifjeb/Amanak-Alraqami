import { useRegisterSW } from "virtual:pwa-register/react";
import "./PwaUpdatePrompt.css";

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;
const INITIAL_UPDATE_DELAY_MS = 60 * 1000;

let updateChecksStarted = false;

function startUpdateChecks(swUrl, registration) {
  if (!registration || updateChecksStarted) {
    return;
  }

  updateChecksStarted = true;

  async function checkForUpdate() {
    if (
      registration.installing ||
      !navigator.onLine
    ) {
      return;
    }

    try {
      const response = await fetch(swUrl, {
        cache: "no-store",
        headers: {
          "cache-control": "no-cache",
        },
      });

      if (response.ok) {
        await registration.update();
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(
          "Service worker update check failed:",
          error,
        );
      }
    }
  }

  window.setTimeout(() => {
    void checkForUpdate();
  }, INITIAL_UPDATE_DELAY_MS);

  window.setInterval(() => {
    void checkForUpdate();
  }, UPDATE_INTERVAL_MS);

  window.addEventListener("focus", () => {
    void checkForUpdate();
  });

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    },
  );
}

export default function PwaUpdatePrompt() {
  const {
    offlineReady: [
      offlineReady,
      setOfflineReady,
    ],
    needRefresh: [
      needRefresh,
      setNeedRefresh,
    ],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,

    onRegisteredSW(swUrl, registration) {
      startUpdateChecks(
        swUrl,
        registration,
      );
    },

    onRegisterError(error) {
      console.error(
        "Service worker registration error:",
        error,
      );
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className="pwa-update"
      role="status"
      aria-live="polite"
    >
      <div className="pwa-update__content">
        <strong>
          {needRefresh
            ? "\u064a\u062a\u0648\u0641\u0631 \u062a\u062d\u062f\u064a\u062b \u062c\u062f\u064a\u062f"
            : "\u0623\u0645\u0627\u0646\u0643 \u0627\u0644\u0631\u0642\u0645\u064a \u062c\u0627\u0647\u0632 \u0644\u0644\u0639\u0645\u0644 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644"}
        </strong>

        <p>
          {needRefresh
            ? "A new version of Amanak Alraqami is ready."
            : "The application is ready for offline use."}
        </p>
      </div>

      <div className="pwa-update__actions">
        {needRefresh && (
          <button
            type="button"
            className="pwa-update__primary"
            onClick={() =>
              updateServiceWorker(true)
            }
          >
            {"\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0622\u0646"}
          </button>
        )}

        <button
          type="button"
          className="pwa-update__secondary"
          onClick={close}
        >
          {"\u0644\u0627\u062d\u0642\u0627\u064b"}
        </button>
      </div>
    </div>
  );
}
