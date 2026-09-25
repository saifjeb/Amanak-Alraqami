import { Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage.jsx";

import ChildLogin from "../pages/auth/child/ChildLogin.jsx";
import ChildRegister from "../pages/auth/child/ChildRegister.jsx";

import ParentLogin from "../pages/auth/parent/ParentLogin.jsx";
import ParentTwoFactor from "../pages/auth/parent/ParentTwoFactor.jsx";
import ParentRegister from "../pages/auth/parent/ParentRegister.jsx";
import ParentForgotPassword from "../pages/auth/parent/ParentForgotPassword.jsx";
import ParentResetPassword from "../pages/auth/parent/ParentResetPassword.jsx";
import ParentVerifyEmail from "../pages/auth/parent/ParentVerifyEmail.jsx";

import AdminLogin from "../pages/auth/admin/AdminLogin.jsx";
import AdminTwoFactor from "../pages/auth/admin/AdminTwoFactor.jsx";
import AdminForgotPassword from "../pages/auth/admin/AdminForgotPassword.jsx";
import AdminResetPassword from "../pages/auth/admin/AdminResetPassword.jsx";

import ChildDashboard from "../pages/child/ChildDashboard.jsx";
import Adventures from "../pages/child/Adventures.jsx";
import AdventureDetails from "../pages/child/AdventureDetails.jsx";
import QuestionPage from "../pages/child/QuestionPage.jsx";
import Badges from "../pages/child/Badges.jsx";
import Assessment from "../pages/child/Assessment.jsx";
import Profile from "../pages/child/Profile.jsx";
import LinkParent from "../pages/child/LinkParent.jsx";

import ParentDashboard from "../pages/parent/ParentDashboard.jsx";
import ChildProgress from "../pages/parent/ChildProgress.jsx";
import ParentSecurity from "../pages/parent/ParentSecurity.jsx";

import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import Students from "../pages/admin/Students.jsx";
import StudentDetails from "../pages/admin/StudentDetails.jsx";
import AdventureManagement from "../pages/admin/AdventureManagement.jsx";
import QuestionManagement from "../pages/admin/QuestionManagement.jsx";
import MediaManagement from "../pages/admin/MediaManagement.jsx";
import AdminAnalytics from "../pages/admin/AdminAnalytics.jsx";
import AdminSecurity from "../pages/admin/AdminSecurity.jsx";
import AdminSettings from "../pages/admin/AdminSettings.jsx";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

import NotFound from "../pages/NotFound.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

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
          <ProtectedRoute allowedRole="admin">
            <AdminSecurity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminSettings />
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
  );
}

export default AppRoutes;
