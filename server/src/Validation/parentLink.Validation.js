import Joi from "joi";

export const linkCodeValidation = Joi.object({
  code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "any.required": "Link code is required",
      "string.empty": "Link code is required",
      "string.pattern.base":
        "Link code must be 6 digits",
    }),
});