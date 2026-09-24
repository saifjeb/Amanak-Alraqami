import "dotenv/config";
import { emailTransporter, emailFrom } from "../src/config/email.js";

async function testEmail() {
  try {
    await emailTransporter.verify();
    console.log("SMTP connection verified successfully.");
    const recipient = process.env.EMAIL_TEST_TO || process.env.SMTP_USER;
    if (!recipient) {
      throw new Error("EMAIL_TEST_TO or SMTP_USER is required.");
    }
    const info = await emailTransporter.sendMail({
      from: emailFrom,
      to: recipient,
      subject: "Amanak Alraqami Email Test",
      text: "Amanak Alraqami email configuration is working correctly.",
    });
    console.log("Test email sent successfully.");
    console.log(`Message ID: ${info.messageId}`);
    process.exit(0);
  } catch (error) {
    console.error("Email test failed:");
    console.error(error.message);
    process.exit(1);
  }
}

testEmail();
