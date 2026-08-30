import express from "express";
import {getAssessmentController,submitAssessmentController,getMyAssessmentResultsController} from "../Controller/assessment.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";

const router = express.Router();
router.get("/results/me",protect,getMyAssessmentResultsController);
router.get("/:testType",protect,getAssessmentController);
router.post("/:testType/submit",protect,submitAssessmentController);
export default router;