import Joi from "joi";

export const adminLoginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please enter a valid email",
      "any.required": "Email is required",
      "string.empty": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
      "string.empty": "Password is required",
    }),
});

export const testAdminRegistrationValidation =
  Joi.object({
    name:
      Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
          "string.min":
            "Name must contain at least 2 characters",

          "string.max":
            "Name must not exceed 100 characters",

          "any.required":
            "Name is required",

          "string.empty":
            "Name is required",
        }),

    email:
      Joi.string()
        .trim()
        .email()
        .max(254)
        .required()
        .messages({
          "string.email":
            "Please enter a valid email",

          "any.required":
            "Email is required",

          "string.empty":
            "Email is required",
        }),

    password:
      Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
          "string.min":
            "Password must be at least 8 characters",

          "string.max":
            "Password must not exceed 100 characters",

          "any.required":
            "Password is required",

          "string.empty":
            "Password is required",
        }),

    confirmPassword:
      Joi.any()
        .valid(
          Joi.ref(
            "password",
          ),
        )
        .required()
        .messages({
          "any.only":
            "Passwords do not match",

          "any.required":
            "Password confirmation is required",
        }),
  })
  .unknown(false);

export const testAdminRegistrationToggleValidation =
  Joi.object({
    enabled:
      Joi.boolean()
        .strict()
        .required(),
  })
  .unknown(false);
