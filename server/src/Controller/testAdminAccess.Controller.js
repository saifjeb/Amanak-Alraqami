
import bcrypt from "bcrypt";

import {
  getTestAdminRegistrationSetting,
  setTestAdminRegistrationEnabled,
  createTestAdmin,
  listTestAdmins,
  getTestAdminById,
  setTestAdminEnabled,
} from "../Model/testAdminAccess.Model.js";

const publicTestAdmin =
  (admin) => ({
    id:
      admin.id,

    name:
      admin.name,

    email:
      admin.email,

    role:
      admin.role,

    is_enabled:
      admin.is_enabled,

    access_expires_at:
      admin.access_expires_at ||
      null,

    created_at:
      admin.created_at ||
      null,
  });

export const getTestAdminRegistrationStatusController =
  async (
    req,
    res,
    next,
  ) => {
    try {
      const setting =
        await getTestAdminRegistrationSetting();

      return res
        .status(200)
        .json({
          success: true,

          registration_enabled:
            setting
              ?.registration_enabled ===
            true,
        });
    } catch (error) {
      return next(error);
    }
  };

export const registerTestAdminController =
  async (
    req,
    res,
    next,
  ) => {
    try {
      const setting =
        await getTestAdminRegistrationSetting();

      if (
        setting
          ?.registration_enabled !==
        true
      ) {
        return res
          .status(403)
          .json({
            success: false,

            code:
              "TEST_ADMIN_REGISTRATION_DISABLED",

            message:
              "Test account registration is currently disabled.",
          });
      }

      const {
        name,
        email,
        password,
      } =
        req.body;

      const hashedPassword =
        await bcrypt.hash(
          password,
          12,
        );

      let admin;

      try {
        admin =
          await createTestAdmin({
            name:
              name.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            hashedPassword,
          });
      } catch (error) {
        if (
          error?.code ===
          "23505"
        ) {
          return res
            .status(409)
            .json({
              success: false,

              code:
                "TEST_ADMIN_EMAIL_UNAVAILABLE",

              message:
                "A test account cannot be created with this email address.",
            });
        }

        throw error;
      }

      if (!admin) {
        return res
          .status(403)
          .json({
            success: false,

            code:
              "TEST_ADMIN_REGISTRATION_DISABLED",

            message:
              "Test account registration is currently disabled.",
          });
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Test account created successfully.",

          admin:
            publicTestAdmin(
              admin,
            ),
        });
    } catch (error) {
      return next(error);
    }
  };

export const getTestAdminAccessController =
  async (
    req,
    res,
    next,
  ) => {
    try {
      const [
        setting,
        accounts,
      ] =
        await Promise.all([
          getTestAdminRegistrationSetting(),
          listTestAdmins(),
        ]);

      return res
        .status(200)
        .json({
          success: true,

          registration_enabled:
            setting
              ?.registration_enabled ===
            true,

          registration_updated_at:
            setting?.updated_at ||
            null,

          accounts,
        });
    } catch (error) {
      return next(error);
    }
  };

export const updateTestAdminRegistrationController =
  async (
    req,
    res,
    next,
  ) => {
    try {
      const setting =
        await setTestAdminRegistrationEnabled(
          req.body.enabled,
        );

      return res
        .status(200)
        .json({
          success: true,

          registration_enabled:
            setting
              .registration_enabled,

          updated_at:
            setting
              .updated_at,
        });
    } catch (error) {
      return next(error);
    }
  };

const updateTestAdminAccountState =
  async ({
    req,
    res,
    next,
    enabled,
  }) => {
    try {
      const existing =
        await getTestAdminById(
          req.params.id,
        );

      if (!existing) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              "TEST_ADMIN_NOT_FOUND",

            message:
              "Test administrator account not found.",
          });
      }

      if (
        enabled &&
        existing.is_expired
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              "TEST_ADMIN_ACCESS_EXPIRED",

            message:
              "Expired test access cannot be re-enabled.",
          });
      }

      const admin =
        await setTestAdminEnabled(
          req.params.id,
          enabled,
        );

      if (!admin) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              "TEST_ADMIN_STATE_NOT_CHANGED",

            message:
              "The test administrator state could not be changed.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          admin:
            publicTestAdmin(
              admin,
            ),
        });
    } catch (error) {
      return next(error);
    }
  };

export const disableTestAdminController =
  async (
    req,
    res,
    next,
  ) => {
    return updateTestAdminAccountState({
      req,
      res,
      next,
      enabled: false,
    });
  };

export const enableTestAdminController =
  async (
    req,
    res,
    next,
  ) => {
    return updateTestAdminAccountState({
      req,
      res,
      next,
      enabled: true,
    });
  };
