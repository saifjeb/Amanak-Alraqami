import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
}).single("image");

export const uploadMediaImage = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Image must not exceed 5 MB",
        });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Only one image file is allowed",
        });
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Only one image file is allowed",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid file upload",
      });
    }

    return next(error);
  });
};
