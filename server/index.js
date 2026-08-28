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
const app = express();
app.use(helmet());
app.use(cors({origin: process.env.CLIENT_URL || "http://localhost:5173",credentials: true,}));
app.use(express.json());
app.use(express.urlencoded({extended: true,}));
app.use(cookieParser());
app.use("/api", authRoutes);
app.use("/api", parentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/assessments",assessmentRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});