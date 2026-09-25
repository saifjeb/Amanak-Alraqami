import {
  getTwoFactorSettings,
  saveTwoFactorSetupSecret,
  enableTwoFactorWithRecoveryCodes,
  rotateTwoFactorRecoveryCodes,
} from "../Model/twoFactor.Model.js";

import {
  createTwoFactorSetup,
  verifyTwoFactorToken,
  generateTwoFactorRecoveryCodes,
  hashTwoFactorRecoveryCode,
} from "../Utils/twoFactor.Utils.js";

function getAuthenticatedAccount(req, accountType) {
  if (accountType === "parent") {
    return req.parent || null;
  }

  if (accountType === "admin") {
    return req.admin || null;
  }

  return null;
}

async function startTwoFactorSetup(req, res, next, accountType) {
  try {
    const account = getAuthenticatedAccount(req, accountType);

    if (!account?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const settings = await getTwoFactorSettings(accountType, account.id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (settings.two_factor_enabled) {
      return res.status(409).json({
        success: false,
        code: "TWO_FACTOR_ALREADY_ENABLED",
        message: "Two-step verification is already enabled.",
      });
    }

    const setup = createTwoFactorSetup({
      email: settings.email,
      accountType,
    });

    const saved = await saveTwoFactorSetupSecret({
      accountType,
      accountId: account.id,
      encryptedSecret: setup.encryptedSecret,
    });

    if (!saved) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Two-step verification setup created.",
      setup: {
        otpauthUrl: setup.otpauthUrl,
        manualKey: setup.secret,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function confirmTwoFactorSetup(req, res, next, accountType) {
  try {
    const account = getAuthenticatedAccount(req, accountType);

    if (!account?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Authenticator code must contain exactly 6 digits.",
      });
    }

    const settings = await getTwoFactorSettings(accountType, account.id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (settings.two_factor_enabled) {
      return res.status(409).json({
        success: false,
        code: "TWO_FACTOR_ALREADY_ENABLED",
        message: "Two-step verification is already enabled.",
      });
    }

    if (!settings.two_factor_secret_encrypted) {
      return res.status(400).json({
        success: false,
        code: "TWO_FACTOR_SETUP_REQUIRED",
        message: "Start two-step verification setup first.",
      });
    }

    const verification = await verifyTwoFactorToken({
      encryptedSecret: settings.two_factor_secret_encrypted,
      token,
      lastUsedTimeStep: settings.two_factor_last_used_step,
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid authenticator code.",
      });
    }

    const recoveryCodes = generateTwoFactorRecoveryCodes(8);

    const recoveryCodeHashes = recoveryCodes.map((code) =>
      hashTwoFactorRecoveryCode({
        accountType,
        accountId: account.id,
        code,
      }),
    );

    const enabledAccount = await enableTwoFactorWithRecoveryCodes({
      accountType,
      accountId: account.id,
      timeStep: verification.timeStep,
      recoveryCodeHashes,
    });

    if (!enabledAccount) {
      return res.status(400).json({
        success: false,
        message: "Could not enable two-step verification.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Two-step verification enabled successfully.",
      twoFactorEnabled: true,
      recoveryCodes,
    });
  } catch (error) {
    return next(error);
  }
}

/*
 * Parent 2FA status
 *
 * Important:
 * This endpoint returns only whether 2FA is enabled.
 * It never returns the encrypted secret or manual key.
 */
export const parentTwoFactorStatusController = async (req, res, next) => {
  try {
    const parent = req.parent;

    if (!parent?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const settings = await getTwoFactorSettings("parent", parent.id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found",
      });
    }

    return res.status(200).json({
      success: true,
      twoFactorEnabled: Boolean(settings.two_factor_enabled),
      twoFactorEnabledAt: settings.two_factor_enabled_at || null,
    });
  } catch (error) {
    return next(error);
  }
};

export const parentTwoFactorSetupController = async (req, res, next) => {
  return startTwoFactorSetup(req, res, next, "parent");
};

export const parentTwoFactorConfirmController = async (req, res, next) => {
  return confirmTwoFactorSetup(req, res, next, "parent");
};

export const adminTwoFactorSetupController = async (req, res, next) => {
  return startTwoFactorSetup(req, res, next, "admin");
};

export const adminTwoFactorConfirmController = async (req, res, next) => {
  return confirmTwoFactorSetup(req, res, next, "admin");
};

export const adminRegenerateRecoveryCodesController = async (
  req,
  res,
  next,
) => {
  try {
    const admin = req.admin;

    if (!admin?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Authenticator code must contain exactly 6 digits.",
      });
    }

    const settings = await getTwoFactorSettings("admin", admin.id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    if (!settings.two_factor_enabled || !settings.two_factor_secret_encrypted) {
      return res.status(400).json({
        success: false,
        code: "TWO_FACTOR_NOT_ENABLED",
        message: "Two-step verification is not enabled.",
      });
    }

    const verification = await verifyTwoFactorToken({
      encryptedSecret: settings.two_factor_secret_encrypted,
      token,
      lastUsedTimeStep: settings.two_factor_last_used_step,
    });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used authenticator code.",
      });
    }

    const recoveryCodes = generateTwoFactorRecoveryCodes(8);

    const recoveryCodeHashes = recoveryCodes.map((code) =>
      hashTwoFactorRecoveryCode({
        accountType: "admin",
        accountId: admin.id,
        code,
      }),
    );

    const rotated = await rotateTwoFactorRecoveryCodes({
      accountType: "admin",
      accountId: admin.id,
      timeStep: verification.timeStep,
      recoveryCodeHashes,
    });

    if (!rotated) {
      return res.status(400).json({
        success: false,
        message:
          "Authenticator code was already used or recovery codes could not be regenerated.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recovery codes regenerated successfully.",
      recoveryCodes,
    });
  } catch (error) {
    return next(error);
  }
};
