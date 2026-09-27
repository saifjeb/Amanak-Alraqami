import { useRegisterSW } from "virtual:pwa-register/react";
import "./PwaUpdatePrompt.css";

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
            ? "يتوفر تحديث جديد"
            : "أمانك الرقمي جاهز للعمل دون اتصال"}
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
            تحديث الآن
          </button>
        )}

        <button
          type="button"
          className="pwa-update__secondary"
          onClick={close}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}