import { rateLimit } from "express-rate-limit";

export const childLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many child login attempts. Please try again after 15 minutes.",
  },
});

export const parentLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many parent login attempts. Please try again after 15 minutes.",
  },
});

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many admin login attempts. Please try again after 15 minutes.",
  },
});

export const adminTwoFactorChallengeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many two-factor authentication attempts. Please try again after 10 minutes.",
  },
});

export const childRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many child registration attempts. Please try again later.",
  },
});

export const parentRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many parent registration attempts. Please try again later.",
  },
});

export const parentLinkCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `parent:${req.parent.id}`;
  },
  message: {
    success: false,
    message:
      "Too many link codes generated. Please wait before generating another code.",
  },
});

export const parentLinkAttemptLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `child:${req.user.id}`;
  },
  message: {
    success: false,
    message: "Too many link code attempts. Please try again after 10 minutes.",
  },
});

const createPasswordRecoveryLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        "Too many password recovery requests. Please try again after 15 minutes.",
    },
  });

export const parentForgotPasswordLimiter = createPasswordRecoveryLimiter();

export const parentResetPasswordLimiter = createPasswordRecoveryLimiter();

export const adminForgotPasswordLimiter = createPasswordRecoveryLimiter();

export const adminResetPasswordLimiter = createPasswordRecoveryLimiter();

export const parentEmailVerificationAttemptLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many verification attempts. Please try again after 10 minutes.",
  },
});

export const parentEmailVerificationResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many verification code requests. Please try again after 10 minutes.",
  },
});

export const parentTwoFactorSetupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `parent-2fa-setup:${req.parent.id}`;
  },
  message: {
    success: false,
    message:
      "Too many two-step verification setup requests. Please try again later.",
  },
});

export const parentTwoFactorConfirmLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `parent-2fa-confirm:${req.parent.id}`;
  },
  message: {
    success: false,
    message:
      "Too many authenticator code attempts. Please try again after 10 minutes.",
  },
});

export const adminTwoFactorSetupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `admin-2fa-setup:${req.admin.id}`;
  },
  message: {
    success: false,
    message:
      "Too many two-step verification setup requests. Please try again later.",
  },
});

export const adminTwoFactorConfirmLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `admin-2fa-confirm:${req.admin.id}`;
  },
  message: {
    success: false,
    message:
      "Too many authenticator code attempts. Please try again after 10 minutes.",
  },
});

export const adminTwoFactorRecoveryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `admin-2fa-recovery:${req.admin.id}`;
  },
  message: {
    success: false,
    message:
      "Too many recovery code regeneration attempts. Please try again after 10 minutes.",
  },
});


export const parentTwoFactorChallengeLimiter =
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message:
        "Too many two-factor authentication attempts. Please try again after 10 minutes.",
    },
  });