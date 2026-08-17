import Joi from "joi";

export const registerValidation = Joi.object({
  nickname: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Nickname is required",
      "string.min": "Nickname must be at least 3 characters",
      "string.max": "Nickname cannot exceed 50 characters",
      "any.required": "Nickname is required",
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 72 characters",
      "any.required": "Password is required",
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .strip()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password is required",
      "any.required": "Confirm password is required",
    }),

  age_group: Joi.string()
    .valid("8-10", "11-14")
    .required()
    .messages({
      "any.only": "Age group must be either 8-10 or 11-14",
      "any.required": "Age group is required",
      "string.empty": "Age group is required",
    }),

  avatar: Joi.string()
    .trim()
    .max(100)
    .default("avatar1"),
});