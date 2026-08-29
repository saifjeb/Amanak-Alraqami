import express from "express";
import {registerController,loginController,refreshTokenController,meController,} from "../Controller/auth.Controller.js";
import {registerValidation,loginValidation,} from "../Validation/auth.Validation.js";
import {validate,} from "../Middleware/validate.Middleware.js";
import {protect,} from "../Middleware/auth.Middleware.js";
import {childLoginLimiter,childRegisterLimiter,} from "../Middleware/rateLimit.Middleware.js";

const route = express.Router();
route.post("/auth/register",childRegisterLimiter,validate(registerValidation),registerController);
route.post("/auth/login",childLoginLimiter,validate(loginValidation),loginController);
route.post("/auth/refresh",refreshTokenController);
route.get("/auth/me",protect,meController);
export default route;