import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const brevoApiKey = String(
  process.env.BREVO_API_KEY || "",
).trim();

const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailFrom = {
  name:
    process.env.EMAIL_FROM_NAME ||
    "Amanak Alraqami",
  address:
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.SMTP_USER,
};

function normalizeAddress(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return { email: value.trim() };
  }

  if (
    typeof value === "object" &&
    typeof value.address === "string"
  ) {
    return {
      email: value.address.trim(),
      ...(value.name
        ? { name: String(value.name) }
        : {}),
    };
  }

  return null;
}

function normalizeRecipients(value) {
  const values = Array.isArray(value)
    ? value
    : [value];

  return values
    .flatMap((entry) => {
      if (
        typeof entry === "string" &&
        entry.includes(",")
      ) {
        return entry.split(",");
      }

      return [entry];
    })
    .map(normalizeAddress)
    .filter((entry) => entry?.email);
}

async function sendWithBrevo(options) {
  const sender = normalizeAddress(
    options.from || emailFrom,
  );

  const recipients = normalizeRecipients(
    options.to,
  );

  if (!sender?.email) {
    throw new Error(
      "Brevo sender email is not configured.",
    );
  }

  if (recipients.length === 0) {
    throw new Error(
      "Brevo recipient email is missing.",
    );
  }

  const payload = {
    sender,
    to: recipients,
    subject: String(options.subject || ""),
  };

  if (options.html) {
    payload.htmlContent = String(options.html);
  }

  if (options.text) {
    payload.textContent = String(options.text);
  }

  if (!payload.htmlContent && !payload.textContent) {
    throw new Error("Email content is missing.");
  }

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    },
  );

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const message =
      result?.message ||
      "Brevo transactional email request failed.";

    const error = new Error(
      "Brevo API error " +
        response.status +
        ": " +
        message,
    );

    error.code = "BREVO_API_ERROR";
    error.status = response.status;

    throw error;
  }

  return {
    messageId: result?.messageId || null,
    response: "Brevo API " + response.status,
  };
}

export const emailTransporter = {
  async verify() {
    if (brevoApiKey) {
      return true;
    }

    return smtpTransporter.verify();
  },

  async sendMail(options) {
    if (brevoApiKey) {
      return sendWithBrevo(options);
    }

    return smtpTransporter.sendMail(options);
  },
};
