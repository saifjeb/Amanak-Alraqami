import { getAdminDashboardStats } from "../Model/adminDashboard.Model.js";

export const getAdminDashboardController = async (req, res) => {
  try {
    const stats = await getAdminDashboardStats();

    return res.status(200).json({
      success: true,

      dashboard: {
        total_children: Number(stats.total_children),
        total_parents: Number(stats.total_parents),
        total_adventures: Number(stats.total_adventures),
        completed_adventures: Number(stats.completed_adventures),
        total_badges_awarded: Number(stats.total_badges_awarded),
        average_pre_test: Number(stats.average_pre_test),
        average_post_test: Number(stats.average_post_test),
        average_improvement: Number(stats.average_improvement),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
