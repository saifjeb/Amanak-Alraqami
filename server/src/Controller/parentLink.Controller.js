import crypto from "crypto";
import {createLinkCode,useLinkCode,getLinkedChildren} from "../Model/parentLink.Model.js";

export const generateLinkCodeController = async (req, res, next) => {
  try {
    const parentId = req.parent.id;
    let linkCode = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
      try {
        linkCode = await createLinkCode(parentId, code);
        break;
      } catch (error) {
        if (error.code !== "23505") {
          throw error;
        }
      }
    }

    if (!linkCode) {
      const error = new Error("Unable to generate unique link code");
      return next(error);
    }

    return res.status(201).json({
      success: true,
      message: "Link code generated successfully",

      link_code: {
        code: linkCode.code,

        expires_at: linkCode.expires_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const linkChildToParentController = async (req, res, next) => {
  try {
    const { code } = req.body;

    const result = await useLinkCode(code, req.user.id);

    if (!result.success) {
      if (result.reason === "not_found") {
        return res.status(404).json({
          success: false,
          message: "Link code not found",
        });
      }

      if (result.reason === "used") {
        return res.status(409).json({
          success: false,
          message: "Link code has already been used",
        });
      }

      if (result.reason === "expired") {
        return res.status(410).json({
          success: false,
          message: "Link code has expired",
        });
      }

      const error = new Error("Unexpected link-code result");

      return next(error);
    }

    return res.status(200).json({
      success: true,

      message: result.alreadyLinked
        ? "Child is already linked to this parent"
        : "Child linked to parent successfully",

      already_linked: result.alreadyLinked,
    });
  } catch (error) {
    return next(error);
  }
};

export const getLinkedChildrenController = async (req, res, next) => {
  try {
    const children = await getLinkedChildren(req.parent.id);

    return res.status(200).json({
      success: true,
      children,
    });
  } catch (error) {
    return next(error);
  }
};
