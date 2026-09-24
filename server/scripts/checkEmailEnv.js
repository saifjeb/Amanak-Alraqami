import "dotenv/config";

const user = String(process.env.SMTP_USER || "").trim();
const rawPass = String(process.env.SMTP_PASS || "");
const cleanPass = rawPass.replace(/\s+/g, "").replace(/^["']|["']$/g, "");
console.log("SMTP_HOST:", process.env.SMTP_HOST || "MISSING");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "MISSING");
console.log("SMTP_USER:", user || "MISSING");
console.log("SMTP_PASS exists:", Boolean(rawPass));
console.log("SMTP_PASS normalized length:", cleanPass.length);
console.log("SMTP_PASS contains spaces:",/\s/.test(rawPass));
console.log("SMTP_PASS contains surrounding quotes:",/^["'].*["']$/.test(rawPass));
console.log("EMAIL_FROM_ADDRESS:",process.env.EMAIL_FROM_ADDRESS || "MISSING");