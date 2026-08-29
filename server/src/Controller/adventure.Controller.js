import {getAllAdventures,getAdventureById,getAllAdventuresAdmin,createAdventure,updateAdventure,moveAdventureToTrash,getTrashedAdventures,restoreAdventure,permanentlyDeleteAdventure,} from "../Model/adventure.Model.js";

export const getAllAdventuresController = async (req, res) => {
  try {
    const adventures = await getAllAdventures();

    return res.status(200).json({
      success: true,
      message: "Adventures fetched successfully",
      adventures,
    });
  } catch (error) {
    console.error("Get adventures error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const getAdventureByIdController = async (req, res) => {
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
    console.error("Get adventure error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const adminGetAdventuresController = async (req, res) => {
  try {
    const adventures = await getAllAdventuresAdmin();

    return res.status(200).json({
      success: true,
      adventures,
    });
  } catch (error) {
    console.error("Admin get adventures error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const adminCreateAdventureController = async (req, res) => {
  try {
    const adventure = await createAdventure({
      titleAr: req.body.title_ar,
      titleEn: req.body.title_en,
      descriptionAr: req.body.description_ar,
      descriptionEn: req.body.description_en,
      icon: req.body.icon,
      badgeName: req.body.badge_name,
      completionPoints: req.body.completion_points,
      displayOrder: req.body.display_order,
      isActive: req.body.is_active,
    });

    return res.status(201).json({
      success: true,
      message: "Adventure created successfully",
      adventure,
    });
  } catch (error) {
    console.error("Create adventure error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Adventure title already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const adminUpdateAdventureController = async (req, res) => {
  try {
    const { id } = req.params;
    const adventure = await updateAdventure(id, {
      titleAr: req.body.title_ar,
      titleEn: req.body.title_en,
      descriptionAr: req.body.description_ar,
      descriptionEn: req.body.description_en,
      icon: req.body.icon,
      badgeName: req.body.badge_name,
      completionPoints: req.body.completion_points,
      displayOrder: req.body.display_order,
      isActive: req.body.is_active,
    });

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
    console.error("Update adventure error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Adventure title already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const adminTrashAdventureController = async (req, res) => {
  try {
    const adventure = await moveAdventureToTrash(req.params.id);

    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: "Adventure not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Adventure moved to trash",
      adventure,
    });
  } catch (error) {
    console.error("Trash adventure error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const adminGetAdventureTrashController = async (req, res) => {
  try {
    const adventures = await getTrashedAdventures();

    return res.status(200).json({
      success: true,
      adventures,
    });
  } catch (error) {
    console.error("Get adventure trash error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const adminRestoreAdventureController = async (req, res) => {
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
    console.error("Restore adventure error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const adminPermanentDeleteAdventureController = async (req, res) => {
  try {
    const adventure = await permanentlyDeleteAdventure(req.params.id);

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
    console.error("Permanent delete adventure error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
