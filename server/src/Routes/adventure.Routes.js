import express from "express";
import {getAllAdventuresController,getAdventureByIdController} from "../Controller/adventure.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";

const route = express.Router();
route.get("/",protect,getAllAdventuresController);
route.get("/:id",protect,getAdventureByIdController);
export default route;