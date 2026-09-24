import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>

        <p style={styles.loadingText}>Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    const loginRoutes = {
      child: "/child/login",
      parent: "/parent/login",
      admin: "/admin/login",
    };

    return (
      <Navigate
        to={loginRoutes[allowedRole] || "/"}
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7fbff",
  },
  spinner: {
    width: "45px",
    height: "45px",
    border: "5px solid #dbeafe",
    borderTop: "5px solid #1677ff",
    borderRadius: "50%",
    animation: "amanak-spin 0.8s linear infinite",
  },
  loadingText: {
    marginTop: "15px",
    color: "#123a6d",
    fontWeight: "600",
  },
};
export default ProtectedRoute;