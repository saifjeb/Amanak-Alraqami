import { emailTransporter, emailFrom } from "../config/email.js";

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const sendParentEmailVerificationCode = async ({
  email,
  name,
  code,
}) => {
  const safeName = escapeHtml(name?.trim() || "Amanak Parent");
  const safeCode = escapeHtml(code);
  const subject = "Verify your Amanak Parent account";
  const text = `
Hello ${name?.trim() || "Amanak Parent"},

Welcome to Amanak Alraqami.

Your email verification code is:

${code}

This code will expire in 10 minutes and can only be used once.

If you did not create this account, you can ignore this email.

Amanak Alraqami
`.trim();

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        color: #1f2937;
      "
    >
      <div
        style="
          padding: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        "
      >
        <h2
          style="
            margin-top: 0;
            color: #0f172a;
          "
        >
          Verify your email
        </h2>

        <p>
          Hello ${safeName},
        </p>

        <p>
          Welcome to Amanak Alraqami.
          Use the verification code below
          to verify your Parent account.
        </p>

        <div
          style="
            margin: 28px 0;
            padding: 18px;
            background: #f1f5f9;
            border-radius: 12px;
            text-align: center;
          "
        >
          <div
            style="
              font-size: 32px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #0f172a;
            "
          >
            ${safeCode}
          </div>
        </div>

        <p>
          This code will expire in
          <strong>10 minutes</strong>
          and can only be used once.
        </p>

        <p>
          If you did not create this account,
          you can safely ignore this email.
        </p>

        <hr
          style="
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
          "
        />

        <p
          style="
            font-size: 13px;
            color: #6b7280;
          "
        >
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


