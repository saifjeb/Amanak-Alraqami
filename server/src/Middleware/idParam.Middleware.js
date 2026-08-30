export const validateIdParam = (paramName = "id",label = "ID") => {
  return (req, res, next) => {
    const rawValue = req.params[paramName];
    if (
      typeof rawValue !== "string" ||
      !/^[1-9]\d*$/.test(rawValue)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${label}`,
      });
    }
    const value = Number(rawValue);
    if (!Number.isSafeInteger(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${label}`,
      });
    }
    next();
  };
};