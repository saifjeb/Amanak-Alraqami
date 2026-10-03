
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Clipboard,
  Link as LinkIcon,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import {
  api,
} from "../../api/api.js";

import AdminNav from "../../components/admin/AdminNav.jsx";

import "./TestAdminAccess.css";

function formatDate(
  value,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString();
}

function accountStatus(
  account,
) {
  if (
    account.is_expired
  ) {
    return "Expired";
  }

  if (
    account.is_enabled !==
    true
  ) {
    return "Disabled";
  }

  return "Active";
}

function TestAdminAccess() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingRegistration,
    setSavingRegistration,
  ] =
    useState(false);

  const [
    workingId,
    setWorkingId,
  ] =
    useState(null);

  const [
    registrationEnabled,
    setRegistrationEnabled,
  ] =
    useState(false);

  const [
    accounts,
    setAccounts,
  ] =
    useState([]);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const registrationUrl =
    useMemo(
      () =>
        `${window.location.origin}/test-admin/register`,
      [],
    );

  const loadData =
    useCallback(
      async () => {
        try {
          setError("");

          const response =
            await api.get(
              "/admin/test-access",
            );

          setRegistrationEnabled(
            response.data
              ?.registration_enabled ===
              true,
          );

          setAccounts(
            Array.isArray(
              response.data
                ?.accounts,
            )
              ? response.data
                  .accounts
              : [],
          );
        } catch (err) {
          setError(
            err.response?.data
              ?.message ||
              "Could not load test administrator access.",
          );
        }
      },
      [],
    );

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        await loadData();
      } finally {
        if (active) {
          setLoading(
            false,
          );
        }
      }
    }

    start();

    return () => {
      active = false;
    };
  }, [loadData]);

  async function toggleRegistration() {
    try {
      setSavingRegistration(
        true,
      );

      setError("");
      setSuccess("");

      const response =
        await api.patch(
          "/admin/test-access/registration",
          {
            enabled:
              !registrationEnabled,
          },
        );

      setRegistrationEnabled(
        response.data
          ?.registration_enabled ===
          true,
      );

      setSuccess(
        response.data
          ?.registration_enabled
          ? "Test registration enabled."
          : "Test registration disabled.",
      );
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          "Could not change registration status.",
      );
    } finally {
      setSavingRegistration(
        false,
      );
    }
  }

  async function changeAccountState(
    account,
  ) {
    const nextAction =
      account.is_enabled
        ? "disable"
        : "enable";

    const confirmed =
      window.confirm(
        `${
          nextAction === "disable"
            ? "Disable"
            : "Enable"
        } test access for ${account.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(
        account.id,
      );

      setError("");
      setSuccess("");

      await api.patch(
        `/admin/test-access/accounts/${account.id}/${nextAction}`,
      );

      setSuccess(
        nextAction ===
          "disable"
          ? "Test account disabled."
          : "Test account enabled.",
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          "Could not update the test account.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function copyLink() {
    try {
      await navigator
        .clipboard
        .writeText(
          registrationUrl,
        );

      setCopied(true);

      setTimeout(
        () => {
          setCopied(false);
        },
        2000,
      );
    } catch {
      setError(
        "Could not copy the registration link automatically.",
      );
    }
  }

  const activeAccounts =
    accounts.filter(
      (account) =>
        account.is_enabled &&
        !account.is_expired,
    ).length;

  const expiredAccounts =
    accounts.filter(
      (account) =>
        account.is_expired,
    ).length;

  if (loading) {
    return (
      <main className="test-access-page">
        <AdminNav />

        <div className="test-access-loading">
          <div className="test-access-spinner" />

          <h2>
            Loading Test Admin Access...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="test-access-page">
      <AdminNav />

      <div className="test-access-container">
        <section className="test-access-hero">
          <div>
            <span>
              FULL ADMIN CONTROL
            </span>

            <h1>
              Test Admin Access
            </h1>

            <p>
              Control the reusable tester
              registration link and manage
              temporary 30-day accounts.
            </p>
          </div>

          <ShieldCheck
            size={58}
          />
        </section>

        {
          error && (
            <div
              className="test-access-message error"
              role="alert"
            >
              {error}
            </div>
          )
        }

        {
          success && (
            <div
              className="test-access-message success"
              role="status"
            >
              {success}
            </div>
          )
        }

        <section className="test-access-stats">
          <article>
            <strong>
              {
                accounts.length
              }
            </strong>

            <span>
              Test Accounts
            </span>
          </article>

          <article>
            <strong>
              {
                activeAccounts
              }
            </strong>

            <span>
              Active
            </span>
          </article>

          <article>
            <strong>
              {
                expiredAccounts
              }
            </strong>

            <span>
              Expired
            </span>
          </article>
        </section>

        <section className="test-access-registration">
          <div className="test-access-section-head">
            <div>
              <span>
                REGISTRATION LINK
              </span>

              <h2>
                Reusable Tester Registration
              </h2>

              <p>
                This link has no automatic
                expiration. Every new account
                receives 30 days of access.
              </p>
            </div>

            <span
              className={
                registrationEnabled
                  ? "test-access-status enabled"
                  : "test-access-status disabled"
              }
            >
              {
                registrationEnabled
                  ? "Enabled"
                  : "Disabled"
              }
            </span>
          </div>

          <div className="test-access-link-row">
            <LinkIcon
              size={20}
            />

            <code>
              {
                registrationUrl
              }
            </code>

            <button
              type="button"
              onClick={
                copyLink
              }
            >
              {
                copied
                  ? (
                    <>
                      <Check
                        size={17}
                      />
                      Copied
                    </>
                  )
                  : (
                    <>
                      <Clipboard
                        size={17}
                      />
                      Copy Link
                    </>
                  )
              }
            </button>
          </div>

          <button
            type="button"
            className={
              registrationEnabled
                ? "test-access-toggle danger"
                : "test-access-toggle enable"
            }
            disabled={
              savingRegistration
            }
            onClick={
              toggleRegistration
            }
          >
            {
              savingRegistration
                ? "Saving..."
                : registrationEnabled
                  ? "Disable New Registrations"
                  : "Enable New Registrations"
            }
          </button>
        </section>

        <section className="test-access-accounts">
          <div className="test-access-section-head">
            <div>
              <span>
                TEST ACCOUNTS
              </span>

              <h2>
                Registered Test Administrators
              </h2>
            </div>

            <button
              type="button"
              className="test-access-refresh"
              onClick={
                loadData
              }
            >
              <RefreshCw
                size={17}
              />

              Refresh
            </button>
          </div>

          {
            accounts.length ===
            0
              ? (
                <div className="test-access-empty">
                  No test accounts
                  have been created yet.
                </div>
              )
              : (
                <div className="test-access-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Name
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Created
                        </th>

                        <th>
                          Expires
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        accounts.map(
                          (account) => {
                            const status =
                              accountStatus(
                                account,
                              );

                            return (
                              <tr
                                key={
                                  account.id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      account.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    account.email
                                  }
                                </td>

                                <td>
                                  <span
                                    className={
                                      `test-account-status ${status.toLowerCase()}`
                                    }
                                  >
                                    {
                                      status
                                    }
                                  </span>
                                </td>

                                <td>
                                  {
                                    formatDate(
                                      account.created_at,
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    formatDate(
                                      account.access_expires_at,
                                    )
                                  }
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className={
                                      account.is_enabled
                                        ? "account-disable"
                                        : "account-enable"
                                    }
                                    disabled={
                                      workingId ===
                                        account.id ||
                                      (
                                        account.is_expired &&
                                        !account.is_enabled
                                      )
                                    }
                                    onClick={() =>
                                      changeAccountState(
                                        account,
                                      )
                                    }
                                  >
                                    {
                                      account.is_expired &&
                                      !account.is_enabled
                                        ? (
                                          <>
                                            <UserRoundX
                                              size={16}
                                            />
                                            Expired
                                          </>
                                        )
                                        : account.is_enabled
                                          ? (
                                            <>
                                              <UserRoundX
                                                size={16}
                                              />
                                              Disable
                                            </>
                                          )
                                          : (
                                            <>
                                              <UserRoundCheck
                                                size={16}
                                              />
                                              Enable
                                            </>
                                          )
                                    }
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )
                      }
                    </tbody>
                  </table>
                </div>
              )
          }
        </section>
      </div>
    </main>
  );
}

export default TestAdminAccess;
