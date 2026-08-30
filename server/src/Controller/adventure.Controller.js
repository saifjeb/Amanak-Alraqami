import {getAllAdventures,getAdventureById,getAllAdventuresAdmin,createAdventure,updateAdventure,moveAdventureToTrash,getTrashedAdventures,restoreAdventure,permanentlyDeleteAdventure,setAdventureImage} from "../Model/adventure.Model.js";
import {getMediaById} from "../Model/media.Model.js";
const handleAdventureConflict = (error,res,next) => {
  if (error.code !== "23505") {
    return next(error);
  }
  if (
    error.constraint ===
    "adventures_title_en_key"
  ) {
    return res.status(409).json({
      success: false,
      message:"Adventure title already exists",
    });
  }
  if (
    error.constraint === "uq_active_adventure_display_order"
  ) {
    return res.status(409).json({
      success: false,
      message: "Adventure display order is already in use",
    });
  }
  return res.status(409).json({
    success: false,
    message: "Adventure already exists",
  });
};

export const getAllAdventuresController =
  async (req, res, next) => {
    try {
      const adventures = await getAllAdventures();
      return res.status(200).json({
        success: true,
        message: "Adventures fetched successfully",
        adventures,
      });
    } catch (error) {
      return next(error);
    }
  };

export const getAdventureByIdController =
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const adventure = await getAdventureById(id);
      if (!adventure) {
        return res.status(404).json({
          success: false,
          message: "Adventure not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Adventure fetched successfully",
        adventure,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminGetAdventuresController =
  async (req, res, next) => {
    try {
      const adventures = await getAllAdventuresAdmin();
      return res.status(200).json({
        success: true,
        adventures,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminCreateAdventureController =
  async (req, res, next) => {
    try {
      const adventure =
        await createAdventure({
          titleAr:
            req.body.title_ar,
          titleEn:
            req.body.title_en,
          descriptionAr:
            req.body
              .description_ar,
          descriptionEn:
            req.body
              .description_en,
          icon:
            req.body.icon,
          badgeName:
            req.body.badge_name,
          completionPoints:
            req.body
              .completion_points,
          displayOrder:
            req.body
              .display_order,
          isActive:
            req.body.is_active,
        });

      return res.status(201).json({
        success: true,
        message:"Adventure created successfully",
        adventure,
      });
    } catch (error) {
      return handleAdventureConflict(error,res,next);
    }
  };

export const adminUpdateAdventureController =
  async (req, res, next) => {
    try {
      const adventure =
        await updateAdventure(
          req.params.id,
          {
            titleAr:
              req.body.title_ar,
            titleEn:
              req.body.title_en,
            descriptionAr:
              req.body
                .description_ar,
            descriptionEn:
              req.body
                .description_en,
            icon:
              req.body.icon,
            badgeName:
              req.body.badge_name,
            completionPoints:
              req.body
                .completion_points,
            displayOrder:
              req.body
                .display_order,
            isActive:
              req.body.is_active,
          },
        );

      if (!adventure) {
        return res.status(404).json({
          success: false,
          message: "Adventure not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Adventure updated successfully",
        adventure,
      });
    } catch (error) {
      return handleAdventureConflict(error,res,next);
    }
  };

export const adminTrashAdventureController =
  async (req, res, next) => {
    try {
      const adventure = await moveAdventureToTrash(req.params.id);
      if (!adventure) {
        return res.status(404).json({
          success: false,
          message:"Adventure not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Adventure moved to trash",
        adventure,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminGetAdventureTrashController =
  async (req, res, next) => {
    try {
      const adventures =
        await getTrashedAdventures();
      return res.status(200).json({
        success: true,
        adventures,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminRestoreAdventureController =
  async (req, res, next) => {
    try {
      const adventure = await restoreAdventure(req.params.id);

      if (!adventure) {
        return res.status(404).json({
          success: false,
          message: "Adventure not found in trash",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Adventure restored successfully",
        adventure,
      });
    } catch (error) {
      return handleAdventureConflict(error,res,next);
    }
  };

export const adminPermanentDeleteAdventureController =
  async (req, res, next) => {
    try {
      const adventure =
        await permanentlyDeleteAdventure(req.params.id);
      if (!adventure) {
        return res.status(404).json({
          success: false,
          message: "Adventure not found in trash",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Adventure permanently deleted",
        adventure,
      });
    } catch (error) {
      return next(error);
    }
  };

export const adminSetAdventureImageController =
  async (req, res, next) => {
    try {
      const adventureId = Number(req.params.id);
      const mediaId = Number(req.body.media_id);

      if (!Number.isInteger(adventureId,) ||adventureId <= 0) 
        {
        return res.status(400).json({
          success: false,
          message:
            "Invalid adventure ID",
        });
      }

      if (
        !Number.isInteger(mediaId) ||
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

      if (!media) {
        return res.status(404).json({
          success: false,
          message:
            "Media not found",
        });
      }

      if (media.deleted_at) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot attach media that is in trash",
        });
      }

      const adventure =
        await setAdventureImage(
          adventureId,
          mediaId,
        );

      if (!adventure) {
        return res.status(404).json({
          success: false,
          message:
            "Adventure not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Adventure image updated successfully",
        adventure: {
          ...adventure,
          image_url:
            `/api/media/${mediaId}`,
        },
      });
    } catch (error) {
      return next(error);
    }
  };