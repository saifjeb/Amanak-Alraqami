import Joi from "joi";

export const parentRegisterValidation =
  Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        "string.empty":
          "Name is required",

        "string.min":
          "Name must be at least 2 characters",

        "string.max":
          "Name must not exceed 100 characters",

        "any.required":
          "Name is required",
      }),


    email: Joi.string()
      .trim()
      .lowercase()
      .email({
        minDomainSegments: 2,
        tlds: {
          allow: false,
        },
      })
      .max(255)
      .required()
      .messages({
        "string.email":
          "Please enter a valid email address",

        "string.empty":
          "Email is required",

        "string.max":
          "Email is too long",

        "any.required":
          "Email is required",
      }),


    password: Joi.string()
      .min(8)
      .max(72)
      .required()
      .messages({
        "string.min":
          "Password must be at least 8 characters",

        "string.max":
          "Password must not exceed 72 characters",

        "string.empty":
          "Password is required",

        "any.required":
          "Password is required",
      }),


    confirm_password: Joi.string()
      .valid(
        Joi.ref("password")
      )
      .required()
      .strip()
      .messages({
        "any.only":
          "Passwords do not match",

        "any.required":
          "Please confirm your password",
      }),

  });

export const parentLoginValidation =
  Joi.object({

    email: Joi.string()
      .trim()
      .lowercase()
      .required()
      .messages({
        "string.empty":
          "Email is required",

        "any.required":
          "Email is required",
      }),


    password: Joi.string()
      .required()
      .messages({
        "string.empty":
          "Password is required",

        "any.required":
          "Password is required",
      }),

  });