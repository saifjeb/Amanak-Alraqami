import express from "express";
import {adminLoginController,adminMeController,adminLogoutController} from "../Controller/admin.Controller.js";
import { getAdminDashboardController } from "../Controller/adminDashboard.Controller.js";
import { adminLoginValidation } from "../Validation/admin.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { validateIdParam } from "../Middleware/idParam.Middleware.js";
import { protectAdmin } from "../Middleware/adminonly.Middleware.js";
import {adminGetAdventuresController,adminCreateAdventureController,adminUpdateAdventureController,adminTrashAdventureController,adminGetAdventureTrashController,adminRestoreAdventureController,adminPermanentDeleteAdventureController,adminSetAdventureImageController} from "../Controller/adventure.Controller.js";
import {createAdventureValidation,updateAdventureValidation} from "../Validation/adventure.Validation.js";
import {adminGetQuestionsController,adminCreateQuestionController,adminUpdateQuestionController,adminTrashQuestionController,adminGetQuestionTrashController,adminRestoreQuestionController,adminPermanentDeleteQuestionController,adminSetQuestionImageController} from "../Controller/question.Controller.js";
import {createQuestionValidation,updateQuestionValidation} from "../Validation/question.Validation.js";
import {getAdminStudentStatusesController,getAdminStudentDetailsController} from "../Controller/adminStudentStatus.Controller.js";
import {disableStudentController,enableStudentController} from "../Controller/adminStudentManagement.Controller.js";
import { adminLoginLimiter } from "../Middleware/rateLimit.Middleware.js";
import {adminUploadMediaController,adminGetMediaController,adminGetMediaTrashController,adminTrashMediaController,adminRestoreMediaController,adminPermanentDeleteMediaController} from "../Controller/media.Controller.js";
import { uploadMediaImage } from "../Middleware/mediaUpload.Middleware.js";

const router = express.Router();
// ADMIN AUTH
router.post("/login",adminLoginLimiter,validate(adminLoginValidation),adminLoginController);
router.get("/me", protectAdmin, adminMeController);
router.post("/logout", protectAdmin, adminLogoutController);

//DASHBOARD
router.get("/dashboard", protectAdmin, getAdminDashboardController);

// STUDENTS
router.get("/students/status", protectAdmin, getAdminStudentStatusesController);
router.get("/students/:id",protectAdmin,validateIdParam("id", "student ID"),getAdminStudentDetailsController);
router.patch("/students/:id/disable",protectAdmin,validateIdParam("id", "student ID"),disableStudentController);
router.patch("/students/:id/enable",protectAdmin,validateIdParam("id", "student ID"),enableStudentController);

// ADVENTURES
router.get("/adventures", protectAdmin, adminGetAdventuresController);
router.post("/adventures",protectAdmin,validate(createAdventureValidation),adminCreateAdventureController);
router.put("/adventures/:id",protectAdmin,validateIdParam("id", "adventure ID"),validate(updateAdventureValidation),adminUpdateAdventureController);
router.delete("/adventures/:id",protectAdmin,validateIdParam("id", "adventure ID"),adminTrashAdventureController);
router.patch("/adventures/:id/image",protectAdmin,validateIdParam("id", "adventure ID"),adminSetAdventureImageController);

//ADVENTURE TRASH
router.get("/trash/adventures", protectAdmin, adminGetAdventureTrashController);
router.patch("/trash/adventures/:id/restore",protectAdmin,validateIdParam("id", "adventure ID"),adminRestoreAdventureController);
router.delete("/trash/adventures/:id/permanent",protectAdmin,validateIdParam("id", "adventure ID"),adminPermanentDeleteAdventureController);

//QUESTIONS
router.get("/questions", protectAdmin, adminGetQuestionsController);
router.post("/questions",protectAdmin,validate(createQuestionValidation),adminCreateQuestionController);
router.put("/questions/:id",protectAdmin,validateIdParam("id", "question ID"),validate(updateQuestionValidation),adminUpdateQuestionController);
router.delete("/questions/:id",protectAdmin,validateIdParam("id", "question ID"),adminTrashQuestionController);
router.patch("/questions/:id/image",protectAdmin,validateIdParam("id", "question ID"),adminSetQuestionImageController);

// QUESTION TRASH
router.get("/trash/questions", protectAdmin, adminGetQuestionTrashController);
router.patch("/trash/questions/:id/restore",protectAdmin,validateIdParam("id", "question ID"),adminRestoreQuestionController);
router.delete("/trash/questions/:id/permanent",protectAdmin,validateIdParam("id", "question ID"),adminPermanentDeleteQuestionController);

// MEDIA
router.post("/media/upload",protectAdmin,uploadMediaImage,adminUploadMediaController);
router.get("/media", protectAdmin, adminGetMediaController);
router.delete("/media/:id",protectAdmin,validateIdParam("id", "media ID"),adminTrashMediaController);

// MEDIA TRASH
router.get("/trash/media", protectAdmin, adminGetMediaTrashController);
router.patch("/trash/media/:id/restore",protectAdmin,validateIdParam("id", "media ID"),adminRestoreMediaController);
router.delete("/trash/media/:id/permanent",protectAdmin,validateIdParam("id", "media ID"),adminPermanentDeleteMediaController);
export default router;