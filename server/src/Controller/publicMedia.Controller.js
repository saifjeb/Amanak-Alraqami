import {
  getMediaById,
} from "../Model/media.Model.js";

import {
  readMediaObject,
  readMediaRange,
} from "../Storage/mediaStorage.js";

function parseRange(rangeHeader, fileSize) {
  if (
    typeof rangeHeader !== "string" ||
    !rangeHeader.startsWith("bytes=")
  ) {
    return null;
  }

  const rawRange =
    rangeHeader.slice(6).trim();

  if (
    !rawRange ||
    rawRange.includes(",")
  ) {
    return null;
  }

  const [startText, endText] =
    rawRange.split("-");

  if (
    startText === undefined ||
    endText === undefined
  ) {
    return null;
  }

  let start;
  let end;

  if (startText === "") {
    const suffixLength =
      Number(endText);

    if (
      !Number.isSafeInteger(suffixLength) ||
      suffixLength <= 0
    ) {
      return null;
    }

    const effectiveLength =
      Math.min(
        suffixLength,
        fileSize,
      );

    start =
      fileSize - effectiveLength;

    end =
      fileSize - 1;
  } else {
    start =
      Number(startText);

    if (
      !Number.isSafeInteger(start) ||
      start < 0
    ) {
      return null;
    }

    if (endText === "") {
      end =
        fileSize - 1;
    } else {
      end =
        Number(endText);

      if (
        !Number.isSafeInteger(end) ||
        end < start
      ) {
        return null;
      }
    }
  }

  if (
    start >= fileSize ||
    fileSize <= 0
  ) {
    return {
      unsatisfiable: true,
    };
  }

  end =
    Math.min(
      end,
      fileSize - 1,
    );

  return {
    start,
    end,
  };
}

export const getPublicMediaController = async (
  req,
  res,
  next,
) => {
  try {
    const mediaId =
      Number(req.params.id);

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

    const fileSize =
      Number(media.file_size);

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

    const isVideo =
      media.mime_type === "video/mp4";

    if (isVideo) {
      res.setHeader(
        "Accept-Ranges",
        "bytes",
      );
    }

    const rangeHeader =
      isVideo
        ? req.headers.range
        : null;

    if (
      rangeHeader &&
      Number.isSafeInteger(fileSize) &&
      fileSize > 0
    ) {
      const range =
        parseRange(
          rangeHeader,
          fileSize,
        );

      if (
        !range ||
        range.unsatisfiable
      ) {
        res.setHeader(
          "Content-Range",
          `bytes */${fileSize}`,
        );

        return res.status(416).end();
      }

      const result =
        await readMediaRange(
          media.stored_name,
          range.start,
          range.end,
        );

      if (!result?.buffer) {
        return res.status(404).json({
          success: false,
          message:
            "Media file not found",
        });
      }

      const contentLength =
        result.buffer.length;

      res.setHeader(
        "Content-Range",
        `bytes ${range.start}-${range.start + contentLength - 1}/${fileSize}`,
      );

      res.setHeader(
        "Content-Length",
        contentLength,
      );

      return res
        .status(206)
        .send(result.buffer);
    }

    const mediaBuffer =
      await readMediaObject(
        media.stored_name,
      );

    if (!mediaBuffer) {
      return res.status(404).json({
        success: false,
        message:
          "Media file not found",
      });
    }

    res.setHeader(
      "Content-Length",
      mediaBuffer.length,
    );

    return res.send(mediaBuffer);
  } catch (error) {
    return next(error);
  }
};
