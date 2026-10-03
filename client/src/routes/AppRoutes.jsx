import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage.jsx";








import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

const ChildLogin = lazy(() => import("../pages/auth/child/ChildLogin.jsx"));
const ChildRegister = lazy(() => import("../pages/auth/child/ChildRegister.jsx"));
const ParentLogin = lazy(() => import("../pages/auth/parent/ParentLogin.jsx"));
const ParentTwoFactor = lazy(() => import("../pages/auth/parent/ParentTwoFactor.jsx"));
const ParentRegister = lazy(() => import("../pages/auth/parent/ParentRegister.jsx"));
const ParentForgotPassword = lazy(() => import("../pages/auth/parent/ParentForgotPassword.jsx"));
const ParentResetPassword = lazy(() => import("../pages/auth/parent/ParentResetPassword.jsx"));
const ParentVerifyEmail = lazy(() => import("../pages/auth/parent/ParentVerifyEmail.jsx"));
const AdminLogin = lazy(() => import("../pages/auth/admin/AdminLogin.jsx"));
const AdminTwoFactor = lazy(() => import("../pages/auth/admin/AdminTwoFactor.jsx"));
const AdminForgotPassword = lazy(() => import("../pages/auth/admin/AdminForgotPassword.jsx"));
const AdminResetPassword = lazy(() => import("../pages/auth/admin/AdminResetPassword.jsx"));
const TestAdminRegister = lazy(() => import("../pages/auth/admin/TestAdminRegister.jsx"));
const ChildDashboard = lazy(() => import("../pages/child/ChildDashboard.jsx"));
const Adventures = lazy(() => import("../pages/child/Adventures.jsx"));
const AdventureDetails = lazy(() => import("../pages/child/AdventureDetails.jsx"));
const QuestionPage = lazy(() => import("../pages/child/QuestionPage.jsx"));
const Badges = lazy(() => import("../pages/child/Badges.jsx"));
const Assessment = lazy(() => import("../pages/child/Assessment.jsx"));
const Profile = lazy(() => import("../pages/child/Profile.jsx"));
const LinkParent = lazy(() => import("../pages/child/LinkParent.jsx"));
const ParentDashboard = lazy(() => import("../pages/parent/ParentDashboard.jsx"));
const ChildProgress = lazy(() => import("../pages/parent/ChildProgress.jsx"));
const ParentSecurity = lazy(() => import("../pages/parent/ParentSecurity.jsx"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.jsx"));
const Students = lazy(() => import("../pages/admin/Students.jsx"));
const StudentDetails = lazy(() => import("../pages/admin/StudentDetails.jsx"));
const AdventureManagement = lazy(() => import("../pages/admin/AdventureManagement.jsx"));
const QuestionManagement = lazy(() => import("../pages/admin/QuestionManagement.jsx"));
const MediaManagement = lazy(() => import("../pages/admin/MediaManagement.jsx"));
const AdminAnalytics = lazy(() => import("../pages/admin/AdminAnalytics.jsx"));
const AdminSecurity = lazy(() => import("../pages/admin/AdminSecurity.jsx"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings.jsx"));
const TestAdminAccess = lazy(() => import("../pages/admin/TestAdminAccess.jsx"));
const LegalPage = lazy(() => import("../pages/legal/LegalPage.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));


function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "40vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      Loading...
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/privacy" element={<LegalPage page="privacy" />} />
      <Route path="/terms" element={<LegalPage page="terms" />} />
      <Route
        path="/child-privacy"
        element={<LegalPage page="childPrivacy" />}
      />
      <Route
        path="/account-deletion"
        element={<LegalPage page="accountDeletion" />}
      />

      {/* Child authentication */}
      <Route path="/child/login" element={<ChildLogin />} />

      <Route path="/child/register" element={<ChildRegister />} />

      {/* Parent authentication */}
      <Route path="/parent/login" element={<ParentLogin />} />

      <Route path="/parent/2fa" element={<ParentTwoFactor />} />

      <Route path="/parent/register" element={<ParentRegister />} />

      <Route path="/parent/verify-email" element={<ParentVerifyEmail />} />

      <Route
        path="/parent/forgot-password"
        element={<ParentForgotPassword />}
      />

      <Route path="/parent/reset-password" element={<ParentResetPassword />} />

      {/* Admin authentication */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin/2fa" element={<AdminTwoFactor />} />

      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      <Route
        path="/test-admin/register"
        element={<TestAdminRegister />}
      />

      {/* Parent protected routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parent/security"
        element={
          <ProtectedRoute allowedRole="parent">
            <ParentSecurity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parent/children/:childId"
        element={
          <ProtectedRoute allowedRole="parent">
            <ChildProgress />
          </ProtectedRoute>
        }
      />

      {/* Admin protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRole="admin">
            <Students />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute allowedRole="admin">
            <StudentDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/adventures"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdventureManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute allowedRole="admin">
            <QuestionManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/media"
        element={
          <ProtectedRoute allowedRole="admin">
            <MediaManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/security"
        element={
          <ProtectedRoute
            allowedRole="admin"
            requireFullAdmin
          >
            <AdminSecurity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute
            allowedRole="admin"
            requireFullAdmin
          >
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/test-access"
        element={
          <ProtectedRoute
            allowedRole="admin"
            requireFullAdmin
          >
            <TestAdminAccess />
          </ProtectedRoute>
        }
      />

      {/* Child protected routes */}
      <Route
        path="/child/dashboard"
        element={
          <ProtectedRoute allowedRole="child">
            <ChildDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/adventures"
        element={
          <ProtectedRoute allowedRole="child">
            <Adventures />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/adventures/:adventureId"
        element={
          <ProtectedRoute allowedRole="child">
            <AdventureDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/adventures/:adventureId/play"
        element={
          <ProtectedRoute allowedRole="child">
            <QuestionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/badges"
        element={
          <ProtectedRoute allowedRole="child">
            <Badges />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/assessment/:testType"
        element={
          <ProtectedRoute allowedRole="child">
            <Assessment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/profile"
        element={
          <ProtectedRoute allowedRole="child">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/child/link-parent"
        element={
          <ProtectedRoute allowedRole="child">
            <LinkParent />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
