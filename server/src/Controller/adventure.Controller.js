import {getAllAdventures,getAdventureById} from "../Model/adventure.Model.js";

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