import express from "express";
import {getQuestionsByAdventureController,getQuestionByIdController,submitAnswerController} from "../Controller/question.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";
import {validate} from "../Middleware/validate.Middleware.js";
import {validateIdParam} from "../Middleware/idParam.Middleware.js";
import {answerValidation} from "../Validation/question.Validation.js";

const route = express.Router();
route.get("/adventure/:adventureId",protect,validateIdParam("adventureId","adventure ID"),getQuestionsByAdventureController);
route.post("/:id/answer",protect,validateIdParam("id","question ID"),validate(answerValidation),submitAnswerController);
route.get("/:id",protect,validateIdParam("id","question ID"),getQuestionByIdController);
export default route;