import {getUserBadges} from "../Model/badge.Model.js";

export const getMyBadgesController =
  async (req, res, next) => {
    try {const badges = await getUserBadges(req.user.id);
      return res.status(200).json({
        success: true,
        message:"Badges fetched successfully",
        badges
      });
    } catch (error) {
      return next(error);
    }
  };