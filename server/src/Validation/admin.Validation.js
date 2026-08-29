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