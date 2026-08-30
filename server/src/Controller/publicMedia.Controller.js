import path from "path";
import fs from "fs/promises";
import {getMediaById} from "../Model/media.Model.js";
import {MEDIA_DIRECTORY} from "../Utils/media.Utils.js";

export const getPublicMediaController =
  async (req, res, next) => {
    try {
      const mediaId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          mediaId,
        ) ||
        mediaId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media ID",
        });
      }

      const media =
        await getMediaById(
          mediaId,
        );

      if (
        !media ||
        media.deleted_at
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      const safeStoredName =
        path.basename(
          media.stored_name,
        );

      const absolutePath =
        path.join(
          MEDIA_DIRECTORY,
          safeStoredName,
        );

      try {
        await fs.access(
          absolutePath,
        );
      } catch {
        return res.status(404).json({
          success: false,
          message:
            "Media file not found",
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

      return res.sendFile(
        absolutePath,
      );
    } catch (error) {
      return next(error);
    }
  };