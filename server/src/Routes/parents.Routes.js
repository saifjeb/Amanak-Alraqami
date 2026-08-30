import express from "express";
import {parentRegisterController,parentLoginController,parentRefreshController,parentLogoutController,parentMeController} from "../Controller/parents.Controller.js";
import {generateLinkCodeController,linkChildToParentController,getLinkedChildrenController} from "../Controller/parentLink.Controller.js";
import {parentRegisterValidation,parentLoginValidation} from "../Validation/parents.Validation.js";
import {linkCodeValidation} from "../Validation/parentLink.Validation.js";
import {validate} from "../Middleware/validate.Middleware.js";
import {protectParent} from "../Middleware/parents.Middleware.js";
import {protect} from "../Middleware/auth.Middleware.js";
import {validateIdParam} from "../Middleware/idParam.Middleware.js";
import {getParentChildDashboardController} from "../Controller/parentDashboard.Controller.js";
import {parentLoginLimiter,parentRegisterLimiter,parentLinkCodeLimiter,parentLinkAttemptLimiter} from "../Middleware/rateLimit.Middleware.js";

const route = express.Router();
// PARENT AUTH
route.post("/parent/register",parentRegisterLimiter,validate(parentRegisterValidation),parentRegisterController);
route.post("/parent/login",parentLoginLimiter,validate(parentLoginValidation),parentLoginController);
route.post("/parent/logout",parentLogoutController);
route.get("/parent/me",protectParent,parentMeController);
route.post("/parent/refresh",parentRefreshController);

// PARENT / CHILD LINKING
route.post("/parent/link-code",protectParent,parentLinkCodeLimiter,generateLinkCodeController);
route.post("/parent/link",protect,parentLinkAttemptLimiter,validate(linkCodeValidation),linkChildToParentController);

//PARENT CHILDREN
route.get("/parent/children",protectParent,getLinkedChildrenController);
route.get("/parent/children/:childId/dashboard",protectParent,validateIdParam("childId","child ID"),getParentChildDashboardController);
export default route;