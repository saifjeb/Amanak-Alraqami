import express from "express";
import {adminLoginController,adminMeController,adminLogoutController,} from "../Controller/admin.Controller.js";
import { getAdminDashboardController } from "../Controller/adminDashboard.Controller.js";
import { adminLoginValidation } from "../Validation/admin.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { protectAdmin } from "../Middleware/adminonly.Middleware.js";
import {adminGetAdventuresController,adminCreateAdventureController,adminUpdateAdventureController,adminTrashAdventureController,adminGetAdventureTrashController,adminRestoreAdventureController,adminPermanentDeleteAdventureController,} from "../Controller/adventure.Controller.js";
import {createAdventureValidation,updateAdventureValidation,} from "../Validation/adventure.Validation.js";


const router = express.Router();
router.post("/login", validate(adminLoginValidation), adminLoginController);
router.get("/me", protectAdmin, adminMeController);
router.post("/logout", protectAdmin, adminLogoutController);
router.get("/dashboard", protectAdmin, getAdminDashboardController);
router.get("/adventures",protectAdmin,adminGetAdventuresController);
router.post("/adventures",protectAdmin,validate(createAdventureValidation),adminCreateAdventureController);
router.put("/adventures/:id",protectAdmin,validate(updateAdventureValidation),adminUpdateAdventureController);
router.delete("/adventures/:id",protectAdmin,adminTrashAdventureController);
router.get("/trash/adventures",protectAdmin,adminGetAdventureTrashController);
router.patch("/trash/adventures/:id/restore",protectAdmin,adminRestoreAdventureController);
router.delete("/trash/adventures/:id/permanent",protectAdmin,adminPermanentDeleteAdventureController);
export default router;