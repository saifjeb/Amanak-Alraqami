import express from "express";

import {
  parentRegisterController,
  parentLoginController,
  parentRefreshController,
  parentLogoutController,
  parentMeController,
} from "../Controller/parents.Controller.js";
import {
  parentRegisterValidation,
  parentLoginValidation,
} from "../Validation/parents.Validation.js";

import {
  validate,
} from "../Middleware/validate.Middleware.js";

import {
  protectParent,
} from "../Middleware/parents.Middleware.js";

const route = express.Router();


// REGISTER
route.post(
  "/parent/register",
  validate(parentRegisterValidation),
  parentRegisterController
);


// LOGIN
route.post(
  "/parent/login",
  validate(parentLoginValidation),
  parentLoginController
);


// LOGOUT
route.post(
  "/parent/logout",
  parentLogoutController
);


// CURRENT PARENT
route.get(
  "/parent/me",
  protectParent,
  parentMeController
);

route.post(
  "/parent/refresh",
  parentRefreshController
);

export default route;