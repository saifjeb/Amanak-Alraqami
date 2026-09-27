import {
  getMediaById,
} from "../Model/media.Model.js";

import {
  readMediaObject,
} from "../Storage/mediaStorage.js";

export const getPublicMediaController = async (
  req,
  res,
  next,
) => {
  try {
    const mediaId = Number(req.params.id);

    if (
      !Number.isInteger(mediaId) ||
      mediaId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    const media =
      await getMediaById(mediaId);

    if (!media || media.deleted_at) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    const mediaBuffer =
      await readMediaObject(
        media.stored_name,
      );

    if (!mediaBuffer) {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    res.setHeader(
      "Content-Type",
      media.mime_type,
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=86400",
    );

    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin",
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*",
    );

    return res.send(mediaBuffer);
  } catch (error) {
    return next(error);
  }
};
