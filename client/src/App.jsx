import AppRoutes from "./routes/AppRoutes.jsx";
import AutoTranslator from "./i18n/AutoTranslator.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";

function App() {
  return (
    <ErrorBoundary>
      <AutoTranslator />
      <ScrollToTop />
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
