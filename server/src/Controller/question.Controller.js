import {getQuestionsByAdventure,getQuestionById,getQuestionForAnswer,getAllQuestionsAdmin,createQuestion,updateQuestion,moveQuestionToTrash,getTrashedQuestions,restoreQuestion,questionHasAttempts,permanentlyDeleteQuestion,setQuestionImage} from "../Model/question.Model.js";
import {getUserById} from "../Model/user.Model.js";
import {getAdventureById} from "../Model/adventure.Model.js";
import {recordQuestionAttempt} from "../Model/questionAttempt.Model.js";
import {syncAdventureProgress} from "../Model/progress.Model.js";
import {unlockAdventureBadge,unlockCyberHeroBadge} from "../Model/badge.Model.js";
import {getMediaById} from "../Model/media.Model.js";

const handleQuestionConflict = (error,res,next) => {
  if (error.code !== "23505") {
    return next(error);
  }
  if (
    error.constraint ===
    "uq_active_adventure_question_position"
  ) {
    return res.status(409).json({
      success: false,
      message:
        "Question display order already exists for this adventure and age group",
    });
  }
  if (
    error.constraint ===
    "uq_active_assessment_question_position"
  ) {
    return res.status(409).json({
      success: false,
      message:
        "Question display order already exists for this assessment and age group",
    });
  }

  return res.status(409).json({
    success: false,
    message:
      "Question already exists",
  });
};

export const getQuestionsByAdventureController =
  async (req, res, next) => {
    try {
      const {
        adventureId,
      } = req.params;

      const adventure =
        await getAdventureById(
          adventureId,
        );

      if (!adventure) {
        return res.status(404).json({
          success: false,
          message:
            "Adventure not found",
        });
      }

      const user =
        await getUserById(
          req.user.id,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const questions =
        await getQuestionsByAdventure(
          adventureId,
          user.age_group,
        );

      return res.status(200).json({
        success: true,
        message:
          "Questions fetched successfully",
        questions,
      });
    } catch (error) {
      return next(error);
    }
  };

export const getQuestionByIdController =
  async (req, res, next) => {
    try {
      const {
        id,
      } = req.params;

      const user =
        await getUserById(
          req.user.id,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const question =
        await getQuestionById(
          id,
          user.age_group,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question fetched successfully",
        question,
      });
    } catch (error) {
      return next(error);
    }
  };

export const submitAnswerController =
  async (req, res, next) => {
    try {
      const {
        id,
      } = req.params;

      const {
        answer,
      } = req.body;

      const user =
        await getUserById(
          req.user.id,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const question =
        await getQuestionForAnswer(
          id,
          user.age_group,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found",
        });
      }

      const isCorrect =
        answer ===
        question.correct_answer;

      const result =
        await recordQuestionAttempt({
          userId: user.id,
          questionId:
            question.id,
          selectedAnswer:
            answer,
          isCorrect,
          questionPoints:
            question.points,
        });

      const progress =
        await syncAdventureProgress(
          user.id,
          question.adventure_id,
          user.age_group,
        );

      let unlockedBadge = null;
      let cyberHeroBadge = null;

      if (progress.completed) {
        unlockedBadge =
          await unlockAdventureBadge(
            user.id,
            question.adventure_id,
          );

        cyberHeroBadge =
          await unlockCyberHeroBadge(
            user.id,
          );
      }

      return res.status(200).json({
        success: true,
        correct: isCorrect,

        feedback_ar:
          isCorrect
            ? question
                .feedback_correct_ar
            : question
                .feedback_wrong_ar,

        feedback_en:
          isCorrect
            ? question
                .feedback_correct_en
            : question
                .feedback_wrong_en,

        points:
          result.attempt
            .points_awarded,

        total_points:
          result.totalPoints,

        current_level:
          result.currentLevel,

        attempt_id:
          result.attempt.id,

        progress: {
          adventure_id:
            progress.adventure_id,
          score:
            progress.score,
          earned_points:
            progress.earned_points,
          completed:
            progress.completed,
          completed_at:
            progress.completed_at,
        },

        new_badges: [
          unlockedBadge,
          cyberHeroBadge,
        ].filter(Boolean),
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminGetQuestionsController =
  async (req, res, next) => {
    try {
      const questions =
        await getAllQuestionsAdmin();

      return res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminCreateQuestionController =
  async (req, res, next) => {
    try {
      const type =
        req.body.question_type;

      const adventureId =
        type === "adventure"
          ? req.body.adventure_id
          : null;

      if (
        type === "adventure" &&
        !adventureId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Adventure questions require adventure_id",
        });
      }

      const question =
        await createQuestion({
          adventureId,
          questionType:
            req.body.question_type,
          ageGroup:
            req.body.age_group,
          storyTextAr:
            req.body.story_text_ar,
          storyTextEn:
            req.body.story_text_en,
          questionAr:
            req.body.question_ar,
          questionEn:
            req.body.question_en,
          optionAAr:
            req.body.option_a_ar,
          optionAEn:
            req.body.option_a_en,
          optionBAr:
            req.body.option_b_ar,
          optionBEn:
            req.body.option_b_en,
          optionCAr:
            req.body.option_c_ar,
          optionCEn:
            req.body.option_c_en,
          correctAnswer:
            req.body.correct_answer,
          feedbackCorrectAr:
            req.body
              .feedback_correct_ar,
          feedbackCorrectEn:
            req.body
              .feedback_correct_en,
          feedbackWrongAr:
            req.body
              .feedback_wrong_ar,
          feedbackWrongEn:
            req.body
              .feedback_wrong_en,
          points:
            req.body.points,
          displayOrder:
            req.body.display_order,
        });

      return res.status(201).json({
        success: true,
        message:
          "Question created successfully",
        question,
      });
    } catch (error) {
      return handleQuestionConflict(
        error,
        res,
        next,
      );
    }
  };

export const adminUpdateQuestionController =
  async (req, res, next) => {
    try {
      const question =
        await updateQuestion(
          req.params.id,
          {
            adventureId:
              req.body.adventure_id,
            questionType:
              req.body
                .question_type,
            ageGroup:
              req.body.age_group,
            storyTextAr:
              req.body.story_text_ar,
            storyTextEn:
              req.body.story_text_en,
            questionAr:
              req.body.question_ar,
            questionEn:
              req.body.question_en,
            optionAAr:
              req.body.option_a_ar,
            optionAEn:
              req.body.option_a_en,
            optionBAr:
              req.body.option_b_ar,
            optionBEn:
              req.body.option_b_en,
            optionCAr:
              req.body.option_c_ar,
            optionCEn:
              req.body.option_c_en,
            correctAnswer:
              req.body
                .correct_answer,
            feedbackCorrectAr:
              req.body
                .feedback_correct_ar,
            feedbackCorrectEn:
              req.body
                .feedback_correct_en,
            feedbackWrongAr:
              req.body
                .feedback_wrong_ar,
            feedbackWrongEn:
              req.body
                .feedback_wrong_en,
            points:
              req.body.points,
            displayOrder:
              req.body.display_order,
          },
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question updated successfully",
        question,
      });
    } catch (error) {
      return handleQuestionConflict(
        error,
        res,
        next,
      );
    }
  };

export const adminTrashQuestionController =
  async (req, res, next) => {
    try {
      const question =
        await moveQuestionToTrash(
          req.params.id,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question moved to trash",
        question,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminGetQuestionTrashController =
  async (req, res, next) => {
    try {
      const questions =
        await getTrashedQuestions();

      return res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminRestoreQuestionController =
  async (req, res, next) => {
    try {
      const question =
        await restoreQuestion(
          req.params.id,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found in trash",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question restored successfully",
        question,
      });
    } catch (error) {
      return handleQuestionConflict(
        error,
        res,
        next,
      );
    }
  };

export const adminPermanentDeleteQuestionController =
  async (req, res, next) => {
    try {
      const id =
        req.params.id;

      const hasAttempts =
        await questionHasAttempts(
          id,
        );

      if (hasAttempts) {
        return res.status(409).json({
          success: false,
          message:
            "Question has user attempts and cannot be permanently deleted",
        });
      }

      const question =
        await permanentlyDeleteQuestion(
          id,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found in trash",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question permanently deleted",
        question,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminSetQuestionImageController =
  async (req, res, next) => {
    try {
      const questionId =
        Number(req.params.id);

      const mediaId =
        Number(req.body.media_id);

      if (
        !Number.isInteger(
          questionId,
        ) ||
        questionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid question ID",
        });
      }

      if (
        !Number.isInteger(mediaId) ||
        mediaId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media ID",
        });
      }

      const media =
        await getMediaById(
          mediaId,
        );

      if (!media) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      if (media.deleted_at) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot attach media that is in trash",
        });
      }

      const question =
        await setQuestionImage(
          questionId,
          mediaId,
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Question image updated successfully",

        question: {
          ...question,
          image_url:
            `/api/media/${mediaId}`,
        },
      });
    } catch (error) {
      return next(error);
    }
  };