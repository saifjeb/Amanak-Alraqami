import express from "express";
import {getAllUsersController,getUserByIdController,deleteMyAccountController,updateMyProfileController,} from "../Controller/user.Controller.js";
import { protect } from "../Middleware/auth.Middleware.js";
import { protectAdmin } from "../Middleware/adminonly.Middleware.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { updateUserValidation } from "../Validation/user.Validation.js";

const route = express.Router();
route.get("/all-users", protectAdmin, getAllUsersController);
route.get("/user-id/:id", protectAdmin, getUserByIdController);
route.put("/me",protect,validate(updateUserValidation),updateMyProfileController,);
route.delete("/me", protect, deleteMyAccountController);
export default route;
