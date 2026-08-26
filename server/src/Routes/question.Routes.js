import express from "express";
import {getQuestionsByAdventureController,getQuestionByIdController,submitAnswerController} from "../Controller/question.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";
import {validate} from "../Middleware/validate.Middleware.js";
import {answerValidation} from "../Validation/question.Validation.js";

const route = express.Router();
route.get("/adventure/:adventureId",protect,getQuestionsByAdventureController);
route.post("/:id/answer",protect,validate(answerValidation),submitAnswerController);
route.get("/:id",protect,getQuestionByIdController);

export default route;