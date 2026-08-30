import {getParentChildDashboard} from "../Model/parentDashboard.Model.js";

export const getParentChildDashboardController =
  async (req, res, next) => {
    try {
      const parentId =req.parent.id;
      const childId = Number(req.params.childId);

      if (
        !Number.isInteger(childId) ||childId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid child ID",
        });
      }

      const dashboard = await getParentChildDashboard(parentId,childId);
      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: "Linked child not found",
        });
      }

      return res.status(200).json({
        success: true,
        dashboard
      });
    } catch (error) {
      return next(error);
    }
  };