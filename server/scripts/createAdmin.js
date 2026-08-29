import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";
import { createAdmin, getAdminByEmail } from "../src/Model/admin.Model.js";

const run = async () => {
  try {
    const name = process.env.FIRST_ADMIN_NAME;
    const email = process.env.FIRST_ADMIN_EMAIL;
    const password = process.env.FIRST_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.error(
        "FIRST_ADMIN_NAME, FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD are required",
      );

      process.exit(1);
    }

    if (password.length < 8) {
      console.error("Admin password must be at least 8 characters");

      process.exit(1);
    }

    const existing = await getAdminByEmail(email);

    if (existing) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await createAdmin({
      name,
      email,
      hashedPassword,
    });

    console.log("Admin created successfully:", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    });
  } catch (error) {
    console.error("Create admin error:", error);
  } finally {
    await pool.end();
  }
};

run();
