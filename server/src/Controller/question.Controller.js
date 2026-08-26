import {getQuestionsByAdventure,getQuestionById,getQuestionForAnswer} from "../Model/question.Model.js";
import { getUserById } from "../Model/user.Model.js";
import { getAdventureById } from "../Model/adventure.Model.js";

export const getQuestionsByAdventureController = async (req, res) => {
  try {
    const { adventureId } = req.params;
    const adventure = await getAdventureById(adventureId);
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: "Adventure not found",
      });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const questions = await getQuestionsByAdventure(
      adventureId,
      user.age_group,
    );
    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getQuestionByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const question = await getQuestionById(id, user.age_group);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      question,
    });
  } catch (error) {
    console.error("Get question error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const submitAnswerController = async (req,res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    const question =await getQuestionForAnswer(id,user.age_group);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isCorrect =answer === question.correct_answer;
    return res.status(200).json({
      success: true,
      correct: isCorrect,

      feedback_ar: isCorrect
        ? question.feedback_correct_ar
        : question.feedback_wrong_ar,

      feedback_en: isCorrect
        ? question.feedback_correct_en
        : question.feedback_wrong_en,

      points: isCorrect
        ? question.points
        : 0,
    });
    } catch (error) {
    console.error(
      "Submit answer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};