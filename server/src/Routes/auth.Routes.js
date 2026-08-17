import express from "express";
import {registerController,loginController,} from "../Controller/auth.Controller.js";
import {registerValidation,loginValidation,} from "../Validation/auth.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
const route = express.Router();

route.post("/auth/register", validate(registerValidation), registerController);
route.post("/auth/login", validate(loginValidation), loginController);
export default route;