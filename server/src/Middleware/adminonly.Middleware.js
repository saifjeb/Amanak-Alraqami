import jwt from "jsonwebtoken";
export const protectAdmin = (req, res, next) => {
  try {
    const token = req.cookies.adminAccessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin not authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }
};
