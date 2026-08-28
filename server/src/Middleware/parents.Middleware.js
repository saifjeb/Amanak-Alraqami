import jwt from "jsonwebtoken";

export function protectParent(req,res,next) {
  try {
    const token =
      req.cookies.parentAccessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.PARENT_JWT_SECRET
      );
    if (decoded.type !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    req.parent = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
}