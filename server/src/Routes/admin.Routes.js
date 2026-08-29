import express from "express";
import {adminLoginController,adminMeController,adminLogoutController,} from "../Controller/admin.Controller.js";
import { getAdminDashboardController } from "../Controller/adminDashboard.Controller.js";
import { adminLoginValidation } from "../Validation/admin.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { protectAdmin } from "../Middleware/adminonly.Middleware.js";

const router = express.Router();
router.post("/login", validate(adminLoginValidation), adminLoginController);
router.get("/me", protectAdmin, adminMeController);
router.post("/logout", protectAdmin, adminLogoutController);
router.get("/dashboard", protectAdmin, getAdminDashboardController);
export default router;
