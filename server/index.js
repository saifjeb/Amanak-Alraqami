import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./src/Routes/auth.Routes.js";
import parentRoutes from "./src/Routes/parents.Routes.js";
import userRoutes from "./src/Routes/user.Routes.js";
import adventureRoutes from "./src/Routes/adventure.Routes.js";
import questionRoutes from "./src/Routes/question.Routes.js";
import progressRoutes from "./src/Routes/progress.Routes.js";
import badgeRoutes from "./src/Routes/badge.Routes.js";
import assessmentRoutes from "./src/Routes/assessment.Routes.js";
import adminRoutes from "./src/Routes/admin.Routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());


app.use("/api", authRoutes);
app.use("/api", parentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large",
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Request failed",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});