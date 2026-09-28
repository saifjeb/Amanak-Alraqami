import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";
import { logger, serializeError } from "./Utils/logger.js";
import { requestLogging } from "./Middleware/requestLogging.Middleware.js";

import authRoutes from "./Routes/auth.Routes.js";
import parentRoutes from "./Routes/parents.Routes.js";
import userRoutes from "./Routes/user.Routes.js";
import adventureRoutes from "./Routes/adventure.Routes.js";
import questionRoutes from "./Routes/question.Routes.js";
import progressRoutes from "./Routes/progress.Routes.js";
import badgeRoutes from "./Routes/badge.Routes.js";
import assessmentRoutes from "./Routes/assessment.Routes.js";
import adminRoutes from "./Routes/admin.Routes.js";
import mediaRoutes from "./Routes/media.Routes.js";

const app = express();
const isTest = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
let clientOrigin;

try {
  clientOrigin = new URL(clientUrl).origin;
} catch {
  throw new Error("CLIENT_URL must be a valid URL");
}

if (isProd) {
  app.set("trust proxy", 1);
}

app.use(requestLogging);

app.use(helmet());

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
app.use((req, res, next) => {
  if (!isProd || isTest || !unsafeMethods.has(req.method)) {
    return next();
  }

  const requestOrigin = req.get("origin");

  if (!requestOrigin || requestOrigin !== clientOrigin) {
    return res.status(403).json({
      success: false,
      message: "Invalid request origin",
    });
  }

  return next();
});

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

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
  });
});

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

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large",
    });
  }

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

  const statusCode = Number(err.status || err.statusCode) || 500;

  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: "Request failed",
    });
  }

  logger.error("http.unhandled_error", {
    request_id: req.requestId || null,
    method: req.method,
    path: (req.originalUrl || req.url || "/").split("?")[0],
    error: serializeError(err),
  });

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;
