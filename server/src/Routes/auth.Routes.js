import express from "express";
import { registerController } from "../Controller/auth.Controller.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { registerValidation } from "../Validation/auth.Validation.js";
const route = express.Router()

route.post("/auth/register", validate(registerValidation), registerController);

export default route