import express from "express";
import {getAssessmentController,submitAssessmentController,getMyAssessmentResultsController,} from "../Controller/assessment.Controller.js";
import { protect } from "../Middleware/auth.Middleware.js";

const router = express.Router();

router.get("/:testType", protect, getAssessmentController);
router.post("/:testType/submit", protect, submitAssessmentController);
router.get("/results/me",protect,getMyAssessmentResultsController);
export default router;
