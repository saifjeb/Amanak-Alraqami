
import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import {
  api,
} from "../../../api/api.js";

import logo from "../../../assets/amanak-logo.svg";

import "./TestAdminRegister.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function TestAdminRegister() {
  const [
    form,
    setForm,
  ] =
    useState(
      initialForm,
    );

  const [
    loadingStatus,
    setLoadingStatus,
  ] =
    useState(true);

  const [
    registrationEnabled,
    setRegistrationEnabled,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    createdAccount,
    setCreatedAccount,
  ] =
    useState(null);

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response =
          await api.get(
            "/admin/test-registration/status",
          );

        if (!active) {
          return;
        }

        setRegistrationEnabled(
          response.data
            ?.registration_enabled ===
            true,
        );
      } catch {
        if (active) {
          setError(
            "Test account registration is currently unavailable.",
          );
        }
      } finally {
        if (active) {
          setLoadingStatus(
            false,
          );
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(
    event,
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      }),
    );

    setError("");
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response =
        await api.post(
          "/admin/test-registration",
          {
            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            password:
              form.password,

            confirmPassword:
              form.confirmPassword,
          },
        );

      setCreatedAccount(
        response.data?.admin ||
          null,
      );

      setForm(
        initialForm,
      );
    } catch (err) {
      if (
        err.response?.status ===
        403 &&
        err.response?.data?.code ===
          "TEST_ADMIN_REGISTRATION_DISABLED"
      ) {
        setRegistrationEnabled(
          false,
        );
      }

      setError(
        err.response?.data
          ?.message ||
          "Could not create the test account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingStatus) {
    return (
      <main className="test-register-page">
        <section className="test-register-card test-register-loading">
          <div className="test-register-spinner" />

          <p>
            Checking registration availability...
          </p>
        </section>
      </main>
    );
  }

  if (createdAccount) {
    return (
      <main className="test-register-page">
        <section className="test-register-card">
          <div className="test-register-brand">
            <img
              src={logo}
              alt=""
            />

            <span>
              Amanak Alraqami
            </span>
          </div>

          <div className="test-register-success-icon">
            ✓
          </div>

          <h1>
            Test Account Created
          </h1>

          <p className="test-register-lead">
            Your account is ready.
            You can now sign in to the
            administration platform.
          </p>

          <div className="test-register-summary">
            <div>
              <span>
                Name
              </span>

              <strong>
                {
                  createdAccount.name
                }
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {
                  createdAccount.email
                }
              </strong>
            </div>

            <div>
              <span>
                Access
              </span>

              <strong>
                Test Administrator
              </strong>
            </div>

            <div>
              <span>
                Expires
              </span>

              <strong>
                {
                  createdAccount
                    .access_expires_at
                    ? new Date(
                        createdAccount
                          .access_expires_at,
                      ).toLocaleString()
                    : "30 days"
                }
              </strong>
            </div>
          </div>

          <Link
            className="test-register-primary"
            to="/admin/login"
          >
            Continue to Admin Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="test-register-page">
      <section className="test-register-card">
        <div className="test-register-brand">
          <img
            src={logo}
            alt=""
          />

          <span>
            Amanak Alraqami
          </span>
        </div>

        <div className="test-register-icon">
          <ShieldCheck
            size={32}
          />
        </div>

        <h1>
          Create Test Account
        </h1>

        <p className="test-register-lead">
          Create your own credentials
          for temporary access to the
          Amanak administration platform.
        </p>

        <div className="test-register-notice">
          Test access remains active
          for 30 days from registration.
        </div>

        {!registrationEnabled ? (
          <div className="test-register-disabled">
            <strong>
              Registration is currently disabled.
            </strong>

            <p>
              Please contact the Amanak
              administrator.
            </p>
          </div>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
          >
            <label>
              Full Name

              <input
                name="name"
                type="text"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email Address

              <input
                name="email"
                type="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password

              <div className="test-register-password">
                <input
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {
                    showPassword
                      ? (
                        <EyeOff
                          size={18}
                        />
                      )
                      : (
                        <Eye
                          size={18}
                        />
                      )
                  }
                </button>
              </div>
            </label>

            <label>
              Confirm Password

              <div className="test-register-password">
                <input
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.confirmPassword
                  }
                  onChange={
                    handleChange
                  }
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) =>
                        !value,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {
                    showConfirmPassword
                      ? (
                        <EyeOff
                          size={18}
                        />
                      )
                      : (
                        <Eye
                          size={18}
                        />
                      )
                  }
                </button>
              </div>
            </label>

            {
              error && (
                <div
                  className="test-register-error"
                  role="alert"
                >
                  {error}
                </div>
              )
            }

            <button
              className="test-register-primary"
              type="submit"
              disabled={
                submitting
              }
            >
              {
                submitting
                  ? "Creating Account..."
                  : "Create Test Account"
              }
            </button>
          </form>
        )}

        <div className="test-register-footer">
          Already have an account?{" "}

          <Link
            to="/admin/login"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

export default TestAdminRegister;
