import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
});

pool.query("SELECT NOW()")
  .then(() => {
    console.log("db is connected");
  })
  .catch((error) => {
    console.error("db error:", error.message);
  });
export default pool;