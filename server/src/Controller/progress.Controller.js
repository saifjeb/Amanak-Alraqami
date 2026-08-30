import {getUserProgress} from "../Model/progress.Model.js";

export const getMyProgressController =
  async (req, res, next) => {
    try {
      const progress =await getUserProgress(req.user.id);
      return res.status(200).json({
        success: true,
        message:"Progress fetched successfully",
        progress
      });
    } catch (error) {
      return next(error);
    }
  };