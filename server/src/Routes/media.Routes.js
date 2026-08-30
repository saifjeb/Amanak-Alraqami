import express from "express";
import { getPublicMediaController } from "../Controller/publicMedia.Controller.js";
import { validateIdParam } from "../Middleware/idParam.Middleware.js";

const router = express.Router();
router.get("/:id", validateIdParam("id", "media ID"), getPublicMediaController);
export default router;
