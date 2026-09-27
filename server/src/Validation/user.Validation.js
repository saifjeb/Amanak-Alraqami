import Joi from "joi";

export const updateUserValidation =
  Joi.object({

    nickname: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .optional()
      .messages({
        "string.min":
          "Nickname must be at least 3 characters",

        "string.max":
          "Nickname must not exceed 50 characters",
      }),


    age_group: Joi.string()
      .valid(
        "8-10",
        "11-14"
      )
      .optional()
      .messages({
        "any.only":
          "Age group must be 8-10 or 11-14",
      }),


    avatar: Joi.string()
      .trim()
      .max(100)
      .optional(),

  })
  .min(1)
  .messages({
    "object.min":
      "At least one field must be provided",
  });

export const deleteUserValidation =
  Joi.object({
    password: Joi.string()
      .max(72)
      .required()
      .messages({
        "string.empty":
          "Password is required",

        "string.max":
          "Password must not exceed 72 characters",

        "any.required":
          "Password is required",
      }),
  });
