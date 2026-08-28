import {getUserBadges,} from "../Model/badge.Model.js";

export const getMyBadgesController = async (req, res) => {
  try {
    const badges = await getUserBadges(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Badges fetched successfully",
      badges,
    });

  } catch (error) {
    console.error("Get badges error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};