import express from "express";
import {getMyProgressController,} from "../Controller/progress.Controller.js";
import {protect,} from "../Middleware/auth.Middleware.js";

const route = express.Router();
route.get("/me",protect,getMyProgressController);
export default route;