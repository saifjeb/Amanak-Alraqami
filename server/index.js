import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";
import authRoutes from "./src/Routes/auth.Routes.js";
import parentRoutes from "./src/Routes/parents.Routes.js";
import userRoutes from "./src/Routes/user.Routes.js";
import adventureRoutes from "./src/Routes/adventure.Routes.js";
import questionRoutes from "./src/Routes/question.Routes.js";
import progressRoutes from "./src/Routes/progress.Routes.js";
import badgeRoutes from "./src/Routes/badge.Routes.js";
import assessmentRoutes from "./src/Routes/assessment.Routes.js";
import adminRoutes from "./src/Routes/admin.Routes.js";
import mediaRoutes from "./src/Routes/media.Routes.js";

const app = express();

// SECURITY
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// BODY PARSERS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({extended: true,limit: "1mb"}),);
app.use(cookieParser());

// ROUTES
app.use("/api", authRoutes);
app.use("/api", parentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/media", mediaRoutes);

// 404
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Unhandled error:",err);
  if (res.headersSent) {
    return next(err);
  }

  // Invalid JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  // Request body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large",
    });
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Image must not exceed 5 MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one image can be uploaded",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected upload field",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid file upload",
    });
  }

  // PostgreSQL errors
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
  }
  if (err.code === "23503") {
    return res.status(409).json({
      success: false,
      message: "Operation conflicts with related data",
    });
  }
  if (err.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Invalid data",
    });
  }
  if (err.code === "23502") {
    return res.status(400).json({
      success: false,
      message: "Required data is missing",
    });
  }
  if (err.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid parameter",
    });
  }

  if (err.code === "22001") {
    return res.status(400).json({
      success: false,
      message: "Value is too long",
    });
  }

  // Explicit application errors
  const statusCode = Number(err.status || err.statusCode) || 500;
  if (statusCode >= 400 && statusCode < 500) {
    return res
      .status(statusCode)
      .json({
        success: false,
        message: err.message || "Request failed",
      });
  }

  // Unexpected server errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});