import {getUserProgress,} from "../Model/progress.Model.js";

export const getMyProgressController = async (req, res) => {
  try {
    const progress = await getUserProgress(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Progress fetched successfully",
      progress,
    });

  } catch (error) {
    console.error(
      "Get progress error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};