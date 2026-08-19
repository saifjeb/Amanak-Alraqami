import jwt from "jsonwebtoken";

export const protect = (req,res,next) => {
  try {
    const accessToken =req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message:"Not authenticated",
      });
    }

    const decoded = jwt.verify(accessToken,process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message:"Invalid or expired access token",
    });
  }
};