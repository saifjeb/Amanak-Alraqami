import pool from "../config/db.js";

export const getQuestionsByAdventure = async (adventureId,ageGroup) => {const result = await pool.query(`SELECT id,adventure_id,question_type,age_group,story_text_ar,story_text_en,question_ar,question_en,option_a_ar,option_a_en,option_b_ar,option_b_en,option_c_ar,option_c_en,points,display_order
    FROM questions WHERE adventure_id = $1 AND age_group = $2 AND question_type = 'adventure'ORDER BY display_order ASC;`,[adventureId, ageGroup]);
    return result.rows;};

export const getQuestionById = async (id,ageGroup) => {const result = await pool.query(`SELECT id,adventure_id,question_type,age_group,story_text_ar,story_text_en,question_ar,question_en,option_a_ar,option_a_en,option_b_ar,option_b_en,option_c_ar,option_c_en,points,display_order
    FROM questions WHERE id = $1 AND age_group = $2 AND question_type = 'adventure' LIMIT 1;`,[id, ageGroup]);
    return result.rows[0];};

export const getQuestionForAnswer = async (id,ageGroup) => {const result = await pool.query(`SELECT id,adventure_id,question_type,age_group,correct_answer,feedback_correct_ar,feedback_correct_en,feedback_wrong_ar,feedback_wrong_en,points
    FROM questions WHERE id = $1 AND age_group = $2 AND question_type = 'adventure' LIMIT 1;`,[id, ageGroup]);
    return result.rows[0];};