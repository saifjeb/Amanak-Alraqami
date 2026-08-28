import express from "express";
import {parentRegisterController,parentLoginController,parentRefreshController,parentLogoutController,parentMeController,} from "../Controller/parents.Controller.js";
import {generateLinkCodeController,linkChildToParentController,getLinkedChildrenController,} from "../Controller/parentLink.Controller.js";
import {parentRegisterValidation,parentLoginValidation,} from "../Validation/parents.Validation.js";
import { linkCodeValidation } from "../Validation/parentLink.Validation.js";
import { validate } from "../Middleware/validate.Middleware.js";
import { protectParent } from "../Middleware/parents.Middleware.js";
import { protect } from "../Middleware/auth.Middleware.js";

const route = express.Router();
route.post("/parent/register",validate(parentRegisterValidation),parentRegisterController,);
route.post("/parent/login",validate(parentLoginValidation),parentLoginController,);
route.post("/parent/logout", parentLogoutController);
route.get("/parent/me", protectParent, parentMeController);
route.post("/parent/refresh", parentRefreshController);
route.post("/parent/link-code", protectParent, generateLinkCodeController);
route.post("/parent/link",protect,validate(linkCodeValidation),linkChildToParentController,);
route.get("/parent/children", protectParent, getLinkedChildrenController);

export default route;
