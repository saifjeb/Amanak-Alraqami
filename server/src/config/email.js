import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT) || 587;

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailFrom = {
  name: process.env.EMAIL_FROM_NAME || "Amanak Alraqami",
  address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
};