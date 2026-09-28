import multer from "multer";

const MAX_MEDIA_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_MEDIA_FILE_SIZE,
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
          message: "Media file must not exceed 50 MB",
        });
      }

      if (
        error.code === "LIMIT_UNEXPECTED_FILE" ||
        error.code === "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          success: false,
          message: "Only one media file is allowed",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid media upload",
      });
    }

    return next(error);
  });
};
