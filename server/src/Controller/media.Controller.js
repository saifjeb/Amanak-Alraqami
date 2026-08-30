import path from "path";

import {
  createMedia,
  getActiveMedia,
  getTrashedMedia,
  getMediaById,
  trashMedia,
  restoreMedia,
  permanentDeleteMedia,
} from "../Model/media.Model.js";

import {
  detectImageType,
  generateStoredName,
  saveImageBuffer,
  deleteImageFile,
} from "../Utils/media.Utils.js";

const parseMediaId = (
  value,
) => {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
};

export const adminUploadMediaController =
  async (req, res, next) => {
    let storedName = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Image file is required",
        });
      }

      const detectedType =
        detectImageType(
          req.file.buffer,
        );

      if (!detectedType) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image file",
        });
      }

      storedName =
        generateStoredName(
          detectedType.extension,
        );

      await saveImageBuffer(
        req.file.buffer,
        storedName,
      );

      const relativeFilePath =
        `uploads/media/${storedName}`;

      const originalName =
        path
          .basename(
            req.file
              .originalname,
          )
          .replace(
            /[\x00-\x1F\x7F]/g,
            "",
          )
          .slice(
            0,
            255,
          );

      const media =
        await createMedia({
          originalName:
            originalName ||
            `image${detectedType.extension}`,

          storedName,

          mimeType:
            detectedType.mimeType,

          fileSize:
            req.file.size,

          filePath:
            relativeFilePath,

          adminId:
            req.admin.id,
        });

      return res.status(201).json({
        success: true,
        message:
          "Image uploaded successfully",

        media: {
          id:
            media.id,

          original_name:
            media.original_name,

          stored_name:
            media.stored_name,

          mime_type:
            media.mime_type,

          file_size:
            media.file_size,

          uploaded_by_admin_id:
            media
              .uploaded_by_admin_id,

          created_at:
            media.created_at,
        },
      });
    } catch (error) {
      /*
       * If the physical file was
       * created but the database
       * operation failed, remove
       * the orphan file first.
       */
      if (storedName) {
        try {
          await deleteImageFile(
            storedName,
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Media cleanup error:",
            cleanupError,
          );
        }
      }

      return next(error);
    }
  };

export const adminGetMediaController =
  async (req, res, next) => {
    try {
      const media =
        await getActiveMedia();

      return res.status(200).json({
        success: true,
        total:
          media.length,
        media,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminGetMediaTrashController =
  async (req, res, next) => {
    try {
      const media =
        await getTrashedMedia();

      return res.status(200).json({
        success: true,
        total:
          media.length,
        media,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminTrashMediaController =
  async (req, res, next) => {
    try {
      const mediaId =
        parseMediaId(
          req.params.id,
        );

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media ID",
        });
      }

      const existingMedia =
        await getMediaById(
          mediaId,
        );

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      if (
        existingMedia.deleted_at
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Media is already in trash",
        });
      }

      const media =
        await trashMedia(
          mediaId,
        );

      if (!media) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Media moved to trash successfully",
        media,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminRestoreMediaController =
  async (req, res, next) => {
    try {
      const mediaId =
        parseMediaId(
          req.params.id,
        );

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media ID",
        });
      }

      const existingMedia =
        await getMediaById(
          mediaId,
        );

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      if (
        !existingMedia.deleted_at
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Media is not in trash",
        });
      }

      const media =
        await restoreMedia(
          mediaId,
        );

      if (!media) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Media restored successfully",
        media,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminPermanentDeleteMediaController =
  async (req, res, next) => {
    try {
      const mediaId =
        parseMediaId(
          req.params.id,
        );

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media ID",
        });
      }

      const existingMedia =
        await getMediaById(
          mediaId,
        );

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      if (
        !existingMedia.deleted_at
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Media must be moved to trash before permanent deletion",
        });
      }

      const deletedMedia =
        await permanentDeleteMedia(
          mediaId,
        );

      if (!deletedMedia) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found in trash",
        });
      }

      await deleteImageFile(
        deletedMedia.stored_name,
      );

      return res.status(200).json({
        success: true,
        message:
          "Media permanently deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  };