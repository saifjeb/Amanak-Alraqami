import { getUserById } from "../Model/user.Model.js";
import {getAssessmentQuestions,getAssessmentQuestionsForScoring,getExistingAssessmentAttempt,createAssessmentAttempt,getUserAssessmentResults,} from "../Model/assessment.Model.js";

const validTestTypes = ["pre_test", "post_test"];
export const getAssessmentController = async (req, res) => {
  try {
    const { testType } = req.params;

    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment type",
      });
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const questions = await getAssessmentQuestions(testType, user.age_group);

    return res.status(200).json({
      success: true,
      test_type: testType,
      total_questions: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const submitAssessmentController = async (req, res) => {
  try {
    const { testType } = req.params;
    const { answers } = req.body;

    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment type",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array",
      });
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingAttempt = await getExistingAssessmentAttempt(
      user.id,
      testType,
    );

    if (existingAttempt) {
      return res.status(409).json({
        success: false,
        message: "Assessment already completed",
        attempt: existingAttempt,
      });
    }

    const questions = await getAssessmentQuestionsForScoring(
      testType,
      user.age_group,
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assessment questions found",
      });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `You must answer all ${questions.length} questions`,
      });
    }

    const questionMap = new Map(
      questions.map((question) => [
        Number(question.id),
        question.correct_answer,
      ]),
    );

    const submittedIds = new Set();
    let correctAnswers = 0;

    for (const item of answers) {
      const questionId = Number(item.question_id);

      const answer = String(item.answer || "")
        .trim()
        .toUpperCase();

      if (!questionMap.has(questionId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid question ID: ${questionId}`,
        });
      }

      if (submittedIds.has(questionId)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate question ID: ${questionId}`,
        });
      }

      if (!["A", "B", "C"].includes(answer)) {
        return res.status(400).json({
          success: false,
          message: "Answers must be A, B, or C",
        });
      }

      submittedIds.add(questionId);

      if (answer === questionMap.get(questionId)) {
        correctAnswers++;
      }
    }

    const totalQuestions = questions.length;

    const scorePercentage = Number(
      ((correctAnswers / totalQuestions) * 100).toFixed(2),
    );

    const attempt = await createAssessmentAttempt({
      userId: user.id,
      testType,
      correctAnswers,
      totalQuestions,
      scorePercentage,
    });

    return res.status(200).json({
      success: true,
      message: "Assessment completed successfully",

      result: {
        test_type: attempt.test_type,
        correct_answers: attempt.correct_answers,
        total_questions: attempt.total_questions,
        score_percentage: Number(attempt.score_percentage),
        completed_at: attempt.completed_at,
      },
    });
  } catch (error) {
    console.error("Submit assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getMyAssessmentResultsController = async (req, res) => {
  try {
    const result = await getUserAssessmentResults(req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Assessment results not found",
      });
    }

    return res.status(200).json({
      success: true,
      results: {
        pre_test_score:
          result.pre_test_score !== null ? Number(result.pre_test_score) : null,

        post_test_score:
          result.post_test_score !== null
            ? Number(result.post_test_score)
            : null,

        improvement:
          result.improvement !== null ? Number(result.improvement) : null,
      },
    });
  } catch (error) {
    console.error("Get assessment results error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
