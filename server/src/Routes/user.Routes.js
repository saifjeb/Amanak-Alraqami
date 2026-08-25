import express from "express";
import {getAllUsersController,getUserByIdController,deleteMyAccountController,updateMyProfileController} from "../Controller/user.Controller.js";
import {protect} from "../Middleware/auth.Middleware.js";
import {validate} from "../Middleware/validate.Middleware.js";
import {updateUserValidation} from "../Validation/user.Validation.js";
import { adminOnly } from "../Middleware/adminonly.Middleware.js";
const route = express.Router();

route.get("/all-users",protect,getAllUsersController);
route.get("/user-id/:id",protect,getUserByIdController);
route.put("/me",protect,validate(updateUserValidation),updateMyProfileController);
route.delete("/me",protect,deleteMyAccountController);
export default route;