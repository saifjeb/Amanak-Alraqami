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

export const createQuestionValidation = Joi.object({
  adventure_id: Joi.number().integer().positive().allow(null).optional(),

  question_type: Joi.string()
    .valid("adventure", "pre_test", "post_test")
    .required(),
  age_group: Joi.string().valid("8-10", "11-14").required(),
  story_text_ar: Joi.string().allow("").optional(),
  story_text_en: Joi.string().allow("").optional(),
  question_ar: Joi.string().trim().required(),
  question_en: Joi.string().allow("").optional(),
  option_a_ar: Joi.string().trim().required(),
  option_a_en: Joi.string().allow("").optional(),
  option_b_ar: Joi.string().trim().required(),
  option_b_en: Joi.string().allow("").optional(),
  option_c_ar: Joi.string().trim().required(),
  option_c_en: Joi.string().allow("").optional(),
  correct_answer: Joi.string().uppercase().valid("A", "B", "C").required(),
  feedback_correct_ar: Joi.string().allow("").optional(),
  feedback_correct_en: Joi.string().allow("").optional(),
  feedback_wrong_ar: Joi.string().allow("").optional(),
  feedback_wrong_en: Joi.string().allow("").optional(),
  points: Joi.number().integer().min(0).default(10),
  display_order: Joi.number().integer().min(1).required(),
});

export const updateQuestionValidation = Joi.object({
  adventure_id: Joi.number().integer().positive(),
  question_type: Joi.string().valid("adventure", "pre_test", "post_test"),
  age_group: Joi.string().valid("8-10", "11-14"),
  story_text_ar: Joi.string().allow(""),
  story_text_en: Joi.string().allow(""),
  question_ar: Joi.string().trim(),
  question_en: Joi.string().allow(""),
  option_a_ar: Joi.string().trim(),
  option_a_en: Joi.string().allow(""),
  option_b_ar: Joi.string().trim(),
  option_b_en: Joi.string().allow(""),
  option_c_ar: Joi.string().trim(),
  option_c_en: Joi.string().allow(""),
  correct_answer: Joi.string().uppercase().valid("A", "B", "C"),
  feedback_correct_ar: Joi.string().allow(""),
  feedback_correct_en: Joi.string().allow(""),
  feedback_wrong_ar: Joi.string().allow(""),
  feedback_wrong_en: Joi.string().allow(""),
  points: Joi.number().integer().min(0),
  display_order: Joi.number().integer().min(1),
}).min(1);
