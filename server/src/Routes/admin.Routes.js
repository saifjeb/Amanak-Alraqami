import express from "express";

import {
  adminLoginController,
  adminTwoFactorChallengeController,
  adminMeController,
  adminLogoutController,
} from "../Controller/admin.Controller.js";

import {
  adminForgotPasswordController,
  adminResetPasswordController,
} from "../Controller/passwordReset.Controller.js";

import {
  adminTwoFactorSetupController,
  adminTwoFactorConfirmController,
  adminRegenerateRecoveryCodesController,
} from "../Controller/twoFactor.Controller.js";

import { getAdminDashboardController } from "../Controller/adminDashboard.Controller.js";

import { getAdminAnalyticsController } from "../Controller/adminAnalytics.Controller.js";

import { getAdminAuditLogsController } from "../Controller/adminAudit.Controller.js";

import { adminLoginValidation } from "../Validation/admin.Validation.js";

import { validate } from "../Middleware/validate.Middleware.js";

import { validateIdParam } from "../Middleware/idParam.Middleware.js";

import { protectAdmin } from "../Middleware/adminonly.Middleware.js";

import { auditAdminAction } from "../Middleware/adminAudit.Middleware.js";

import {
  adminGetAdventuresController,
  adminCreateAdventureController,
  adminUpdateAdventureController,
  adminTrashAdventureController,
  adminGetAdventureTrashController,
  adminRestoreAdventureController,
  adminPermanentDeleteAdventureController,
  adminSetAdventureImageController,
} from "../Controller/adventure.Controller.js";

import {
  createAdventureValidation,
  updateAdventureValidation,
} from "../Validation/adventure.Validation.js";

import {
  adminGetQuestionsController,
  adminCreateQuestionController,
  adminUpdateQuestionController,
  adminTrashQuestionController,
  adminGetQuestionTrashController,
  adminRestoreQuestionController,
  adminPermanentDeleteQuestionController,
  adminSetQuestionImageController,
} from "../Controller/question.Controller.js";

import {
  createQuestionValidation,
  updateQuestionValidation,
} from "../Validation/question.Validation.js";

import {
  getAdminStudentStatusesController,
  getAdminStudentDetailsController,
} from "../Controller/adminStudentStatus.Controller.js";

import {
  disableStudentController,
  enableStudentController,
  permanentlyDeleteStudentController,
} from "../Controller/adminStudentManagement.Controller.js";

import {
  adminLoginLimiter,
  adminForgotPasswordLimiter,
  adminResetPasswordLimiter,
  adminTwoFactorChallengeLimiter,
  adminTwoFactorSetupLimiter,
  adminTwoFactorConfirmLimiter,
  adminTwoFactorRecoveryLimiter,
} from "../Middleware/rateLimit.Middleware.js";

import {
  adminUploadMediaController,
  adminGetMediaController,
  adminGetMediaTrashController,
  adminTrashMediaController,
  adminRestoreMediaController,
  adminPermanentDeleteMediaController,
} from "../Controller/media.Controller.js";

import { uploadMediaImage } from "../Middleware/mediaUpload.Middleware.js";

const router = express.Router();

router.post(
  "/login",
  adminLoginLimiter,
  validate(adminLoginValidation),
  adminLoginController,
);

router.post(
  "/forgot-password",
  adminForgotPasswordLimiter,
  adminForgotPasswordController,
);

router.post(
  "/reset-password",
  adminResetPasswordLimiter,
  adminResetPasswordController,
);

router.post(
  "/2fa/challenge",
  adminTwoFactorChallengeLimiter,
  adminTwoFactorChallengeController,
);

router.use(auditAdminAction);

router.get("/me", protectAdmin, adminMeController);

router.post("/logout", protectAdmin, adminLogoutController);

router.post(
  "/2fa/setup",
  protectAdmin,
  adminTwoFactorSetupLimiter,
  adminTwoFactorSetupController,
);

router.post(
  "/2fa/confirm",
  protectAdmin,
  adminTwoFactorConfirmLimiter,
  adminTwoFactorConfirmController,
);

router.post(
  "/2fa/recovery-codes/regenerate",
  protectAdmin,
  adminTwoFactorRecoveryLimiter,
  adminRegenerateRecoveryCodesController,
);

router.get("/dashboard", protectAdmin, getAdminDashboardController);

router.get("/analytics", protectAdmin, getAdminAnalyticsController);

router.get("/security/audit", protectAdmin, getAdminAuditLogsController);

router.get("/students/status", protectAdmin, getAdminStudentStatusesController);

router.get(
  "/students/:id",
  protectAdmin,
  validateIdParam("id", "student ID"),
  getAdminStudentDetailsController,
);

router.patch(
  "/students/:id/disable",
  protectAdmin,
  validateIdParam("id", "student ID"),
  disableStudentController,
);

router.patch(
  "/students/:id/enable",
  protectAdmin,
  validateIdParam("id", "student ID"),
  enableStudentController,
);

router.delete(
  "/students/:id/permanent",
  protectAdmin,
  validateIdParam("id", "student ID"),
  permanentlyDeleteStudentController,
);

router.get("/adventures", protectAdmin, adminGetAdventuresController);

router.post(
  "/adventures",
  protectAdmin,
  validate(createAdventureValidation),
  adminCreateAdventureController,
);

router.put(
  "/adventures/:id",
  protectAdmin,
  validateIdParam("id", "adventure ID"),
  validate(updateAdventureValidation),
  adminUpdateAdventureController,
);

router.delete(
  "/adventures/:id",
  protectAdmin,
  validateIdParam("id", "adventure ID"),
  adminTrashAdventureController,
);

router.patch(
  "/adventures/:id/image",
  protectAdmin,
  validateIdParam("id", "adventure ID"),
  adminSetAdventureImageController,
);

router.get("/trash/adventures", protectAdmin, adminGetAdventureTrashController);

router.patch(
  "/trash/adventures/:id/restore",
  protectAdmin,
  validateIdParam("id", "adventure ID"),
  adminRestoreAdventureController,
);

router.delete(
  "/trash/adventures/:id/permanent",
  protectAdmin,
  validateIdParam("id", "adventure ID"),
  adminPermanentDeleteAdventureController,
);

router.get("/questions", protectAdmin, adminGetQuestionsController);

router.post(
  "/questions",
  protectAdmin,
  validate(createQuestionValidation),
  adminCreateQuestionController,
);

router.put(
  "/questions/:id",
  protectAdmin,
  validateIdParam("id", "question ID"),
  validate(updateQuestionValidation),
  adminUpdateQuestionController,
);

router.delete(
  "/questions/:id",
  protectAdmin,
  validateIdParam("id", "question ID"),
  adminTrashQuestionController,
);

router.patch(
  "/questions/:id/image",
  protectAdmin,
  validateIdParam("id", "question ID"),
  adminSetQuestionImageController,
);

router.get("/trash/questions", protectAdmin, adminGetQuestionTrashController);

router.patch(
  "/trash/questions/:id/restore",
  protectAdmin,
  validateIdParam("id", "question ID"),
  adminRestoreQuestionController,
);

router.delete(
  "/trash/questions/:id/permanent",
  protectAdmin,
  validateIdParam("id", "question ID"),
  adminPermanentDeleteQuestionController,
);

router.post(
  "/media/upload",
  protectAdmin,
  uploadMediaImage,
  adminUploadMediaController,
);

router.get("/media", protectAdmin, adminGetMediaController);

router.delete(
  "/media/:id",
  protectAdmin,
  validateIdParam("id", "media ID"),
  adminTrashMediaController,
);

router.get("/trash/media", protectAdmin, adminGetMediaTrashController);

router.patch(
  "/trash/media/:id/restore",
  protectAdmin,
  validateIdParam("id", "media ID"),
  adminRestoreMediaController,
);

router.delete(
  "/trash/media/:id/permanent",
  protectAdmin,
  validateIdParam("id", "media ID"),
  adminPermanentDeleteMediaController,
);

export default router;
