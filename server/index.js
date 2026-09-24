import "dotenv/config";

import app from "./src/app.js";

const PORT =
  Number(process.env.PORT) || 3000;

const server = app.listen(
  PORT,
  (error) => {
    if (error) {
      console.error(
        "Server failed to start:",
        error
      );
      process.exit(1);
    }

    console.log(
      `Server running on ${PORT}`
    );
  }
);

export default server;