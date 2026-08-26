import Joi from "joi";

export const answerValidation = Joi.object({
    answer: Joi.string()
    .trim()
    .uppercase()
    .valid("A", "B", "C")
    .required()
    .messages({
        "any.required": "Answer is required",
        "any.only": "Answer must be A, B, or C",
        "string.empty": "Answer is required",
        }),
});