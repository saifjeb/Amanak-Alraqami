import Joi from "joi";

export const createAdventureValidation =
  Joi.object({
    title_ar: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    title_en: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    description_ar:
      Joi.string().allow("").optional(),

    description_en:
      Joi.string().allow("").optional(),

    icon: Joi.string()
      .trim()
      .max(50)
      .optional(),

    badge_name: Joi.string()
      .trim()
      .max(100)
      .optional(),

    completion_points: Joi.number()
      .integer()
      .min(0)
      .optional(),

    display_order: Joi.number()
      .integer()
      .min(1)
      .required(),

    is_active: Joi.boolean()
      .optional(),
  });


export const updateAdventureValidation =
  Joi.object({
    title_ar: Joi.string()
      .trim()
      .min(2)
      .max(150),

    title_en: Joi.string()
      .trim()
      .min(2)
      .max(150),

    description_ar:
      Joi.string().allow(""),

    description_en:
      Joi.string().allow(""),

    icon: Joi.string()
      .trim()
      .max(50),

    badge_name: Joi.string()
      .trim()
      .max(100),

    completion_points: Joi.number()
      .integer()
      .min(0),

    display_order: Joi.number()
      .integer()
      .min(1),

    is_active: Joi.boolean(),
  })
    .min(1);