import {
  emailTransporter,
  emailFrom,
} from "../config/email.js";

const getClientUrl = () => {
  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:5173";

  return clientUrl.replace(/\/+$/, "");
};

export const sendPasswordResetEmail = async ({
  email,
  name,
  token,
  accountType,
}) => {
  const clientUrl = getClientUrl();

  const resetPath =
    accountType === "admin"
      ? "/admin/reset-password"
      : "/parent/reset-password";

  const resetUrl =
    `${clientUrl}${resetPath}?token=${encodeURIComponent(token)}`;

  const accountLabel =
    accountType === "admin"
      ? "administrator"
      : "parent";

  const safeName = name?.trim() || "Amanak user";

  const subject =
    accountType === "admin"
      ? "Reset your Amanak Admin password"
      : "Reset your Amanak Parent password";

  const text = `
Hello ${safeName},

We received a request to reset the password for your Amanak ${accountLabel} account.

Use the following link to set a new password:

${resetUrl}

This link will expire in 15 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.

Amanak Alraqami
`.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
        <h2 style="margin-top: 0; color: #0f172a;">
          Reset your password
        </h2>

        <p>
          Hello ${safeName},
        </p>

        <p>
          We received a request to reset the password for your
          Amanak ${accountLabel} account.
        </p>

        <p style="margin: 28px 0;">
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background: #0b6cf2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 700;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in 15 minutes and can only be used once.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <hr
          style="
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
          "
        />

        <p style="font-size: 13px; color: #6b7280;">
          Amanak Alraqami
        </p>
      </div>
    </div>
  `;

  const info = await emailTransporter.sendMail({
    from: emailFrom,
    to: email,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
  };
};