import { getAdminAnalytics } from "../Model/adminAnalytics.Model.js";

export const getAdminAnalyticsController = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    const analytics = await getAdminAnalytics();

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load admin analytics.",
    });
  }
};