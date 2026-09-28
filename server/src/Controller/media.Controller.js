import { logger, serializeError } from "../Utils/logger.js";
import path from "node:path";

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
  sanitizeImageBuffer,
  detectMp4Type,
  generateStoredName,
} from "../Utils/media.Utils.js";

import {
  saveMediaObject,
  deleteMediaObject,
  getMediaStoragePath,
} from "../Storage/mediaStorage.js";

const parseMediaId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

export const adminUploadMediaController = async (req, res, next) => {
  let storedName = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media file is required",
      });
    }

    const IMAGE_MIME_TYPES = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);

    const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

    let preparedMedia;
    let mediaKind;

    if (IMAGE_MIME_TYPES.has(req.file.mimetype)) {
      if (req.file.size > MAX_IMAGE_FILE_SIZE) {
        return res.status(413).json({
          success: false,
          message: "Image must not exceed 5 MB",
        });
      }

      let sanitizedImage;

      try {
        sanitizedImage =
          await sanitizeImageBuffer(req.file.buffer);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid or corrupted image file",
        });
      }

      preparedMedia = sanitizedImage;
      mediaKind = "image";
    } else if (req.file.mimetype === "video/mp4") {
      if (req.file.size > MAX_VIDEO_FILE_SIZE) {
        return res.status(413).json({
          success: false,
          message: "Video must not exceed 50 MB",
        });
      }

      const detectedVideo =
        detectMp4Type(req.file.buffer);

      if (!detectedVideo) {
        return res.status(400).json({
          success: false,
          message: "Invalid or corrupted MP4 video file",
        });
      }

      preparedMedia = {
        buffer: req.file.buffer,
        mimeType: detectedVideo.mimeType,
        extension: detectedVideo.extension,
      };

      mediaKind = "video";
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Only PNG, JPEG, WEBP images and MP4 videos are allowed",
      });
    }

    storedName =
      generateStoredName(preparedMedia.extension);

    await saveMediaObject(
      preparedMedia.buffer,
      storedName,
    );

    const relativeFilePath =
      getMediaStoragePath(storedName);

    const originalName = path
      .basename(req.file.originalname)
      .replace(/[\x00-\x1F\x7F]/g, "")
      .slice(0, 255);

    const media = await createMedia({
      originalName:
        originalName ||
        `${mediaKind}${preparedMedia.extension}`,
      storedName,
      mimeType: preparedMedia.mimeType,
      fileSize: preparedMedia.buffer.length,
      filePath: relativeFilePath,
      adminId: req.admin.id,
    });

    return res.status(201).json({
      success: true,
      message:
        mediaKind === "video"
          ? "Video uploaded successfully"
          : "Image uploaded successfully",
      media: {
        id: media.id,
        original_name: media.original_name,
        stored_name: media.stored_name,
        mime_type: media.mime_type,
        file_size: media.file_size,
        uploaded_by_admin_id:
          media.uploaded_by_admin_id,
        created_at: media.created_at,
      },
    });
  } catch (error) {
    if (storedName) {
      try {
        await deleteMediaObject(storedName);
      } catch (cleanupError) {
        logger.error("media.cleanup_error", {
          request_id: req.requestId || null,
          error: serializeError(cleanupError),
        });
      }
    }

    return next(error);
  }
};
export const adminGetMediaController = async (
  req,
  res,
  next,
) => {
  try {
    const media = await getActiveMedia();

    return res.status(200).json({
      success: true,
      total: media.length,
      media,
    });
  } catch (error) {
    return next(error);
  }
};

export const adminGetMediaTrashController = async (
  req,
  res,
  next,
) => {
  try {
    const media = await getTrashedMedia();

    return res.status(200).json({
      success: true,
      total: media.length,
      media,
    });
  } catch (error) {
    return next(error);
  }
};

export const adminTrashMediaController = async (
  req,
  res,
  next,
) => {
  try {
    const mediaId = parseMediaId(req.params.id);

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    const existingMedia =
      await getMediaById(mediaId);

    if (!existingMedia) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (existingMedia.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Media is already in trash",
      });
    }

    const media = await trashMedia(mediaId);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
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

export const adminRestoreMediaController = async (
  req,
  res,
  next,
) => {
  try {
    const mediaId = parseMediaId(req.params.id);

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    const existingMedia =
      await getMediaById(mediaId);

    if (!existingMedia) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (!existingMedia.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Media is not in trash",
      });
    }

    const media =
      await restoreMedia(mediaId);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
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
        parseMediaId(req.params.id);

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          message: "Invalid media ID",
        });
      }

      const existingMedia =
        await getMediaById(mediaId);

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message: "Media not found",
        });
      }

      if (!existingMedia.deleted_at) {
        return res.status(409).json({
          success: false,
          message:
            "Media must be moved to trash before permanent deletion",
        });
      }

      const deletedMedia =
        await permanentDeleteMedia(mediaId);

      if (!deletedMedia) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found in trash",
        });
      }

      await deleteMediaObject(
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
