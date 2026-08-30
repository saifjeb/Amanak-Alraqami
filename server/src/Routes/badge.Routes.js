import express from "express"
import {getMyBadgesController} from "../Controller/badge.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";

const router = express.Router();
router.get("/me",protect,getMyBadgesController);
export default router;