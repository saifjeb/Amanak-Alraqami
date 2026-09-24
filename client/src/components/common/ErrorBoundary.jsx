import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Amanak UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isArabic = document.documentElement.dir === "rtl";

    return (
      <main className="amanak-fatal-error" dir={isArabic ? "rtl" : "ltr"}>
        <section>
          <div className="amanak-fatal-icon">🛡️</div>
          <h1>{isArabic ? "حدث خطأ غير متوقع" : "Something unexpected happened"}</h1>
          <p>
            {isArabic
              ? "لم نفقد بياناتك. أعد تحميل الصفحة، وإذا استمرت المشكلة ارجع إلى الصفحة الرئيسية."
              : "Your data has not been intentionally cleared. Reload the page, and if the issue continues return home."}
          </p>
          <div>
            <button type="button" onClick={() => window.location.reload()}>
              {isArabic ? "إعادة تحميل الصفحة" : "Reload page"}
            </button>
            <a href="/">{isArabic ? "العودة للرئيسية" : "Back home"}</a>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
