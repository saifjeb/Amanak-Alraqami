import express from "express";
import {getAllAdventuresController,getAdventureByIdController,} from "../Controller/adventure.Controller.js";
import {protect,} from "../Middleware/auth.Middleware.js";
import {validateIdParam,} from "../Middleware/idParam.Middleware.js";

const route = express.Router();route.get("/",protect,getAllAdventuresController,);
route.get("/:id",protect,validateIdParam("id", "adventure ID"),getAdventureByIdController,);
export default route;