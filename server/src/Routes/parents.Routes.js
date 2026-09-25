import express from "express";
import {parentRegisterController,parentLoginController,parentTwoFactorChallengeController,parentRefreshController,parentLogoutController,parentMeController} from "../Controller/parents.Controller.js";
import {parentForgotPasswordController,parentResetPasswordController} from "../Controller/passwordReset.Controller.js";
import {generateLinkCodeController,linkChildToParentController,getLinkedChildrenController} from "../Controller/parentLink.Controller.js";
import {verifyParentEmailController,resendParentVerificationCodeController} from "../Controller/parentEmailVerification.Controller.js";
import {parentTwoFactorStatusController,parentTwoFactorSetupController,parentTwoFactorConfirmController} from "../Controller/twoFactor.Controller.js";
import {parentRegisterValidation,parentLoginValidation} from "../Validation/parents.Validation.js";
import { linkCodeValidation } from "../Validation/parentLink.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { protectParent } from "../Middleware/parents.Middleware.js";
import { protect } from "../Middleware/auth.Middleware.js";
import { validateIdParam } from "../Middleware/idParam.Middleware.js";
import { getParentChildDashboardController } from "../Controller/parentDashboard.Controller.js";
import {parentLoginLimiter,parentRegisterLimiter,parentLinkCodeLimiter,parentLinkAttemptLimiter,parentForgotPasswordLimiter,parentResetPasswordLimiter,parentEmailVerificationAttemptLimiter,parentEmailVerificationResendLimiter,parentTwoFactorSetupLimiter,parentTwoFactorConfirmLimiter,parentTwoFactorChallengeLimiter} from "../Middleware/rateLimit.Middleware.js";

const route = express.Router();

route.post(
  "/parent/register",
  parentRegisterLimiter,
  validate(parentRegisterValidation),
  parentRegisterController,
);

route.post(
  "/parent/login",
  parentLoginLimiter,
  validate(parentLoginValidation),
  parentLoginController,
);

route.post(
  "/parent/2fa/challenge",
  parentTwoFactorChallengeLimiter,
  parentTwoFactorChallengeController,
);

route.post(
  "/parent/verify-email",
  parentEmailVerificationAttemptLimiter,
  verifyParentEmailController,
);

route.post(
  "/parent/resend-verification-code",
  parentEmailVerificationResendLimiter,
  resendParentVerificationCodeController,
);

route.get("/parent/2fa/status", protectParent, parentTwoFactorStatusController);

route.post(
  "/parent/2fa/setup",
  protectParent,
  parentTwoFactorSetupLimiter,
  parentTwoFactorSetupController,
);

route.post(
  "/parent/2fa/confirm",
  protectParent,
  parentTwoFactorConfirmLimiter,
  parentTwoFactorConfirmController,
);

route.post(
  "/parent/forgot-password",
  parentForgotPasswordLimiter,
  parentForgotPasswordController,
);

route.post(
  "/parent/reset-password",
  parentResetPasswordLimiter,
  parentResetPasswordController,
);

route.post("/parent/logout", parentLogoutController);

route.get("/parent/me", protectParent, parentMeController);

route.post("/parent/refresh", parentRefreshController);

route.post(
  "/parent/link-code",
  protectParent,
  parentLinkCodeLimiter,
  generateLinkCodeController,
);

route.post(
  "/parent/link",
  protect,
  parentLinkAttemptLimiter,
  validate(linkCodeValidation),
  linkChildToParentController,
);

route.get("/parent/children", protectParent, getLinkedChildrenController);

route.get(
  "/parent/children/:childId/dashboard",
  protectParent,
  validateIdParam("childId", "child ID"),
  getParentChildDashboardController,
);

export default route;
