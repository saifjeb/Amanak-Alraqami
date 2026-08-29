import { getAdminStudentStatuses } from "../Model/adminStudentStatus.Model.js";

export const getAdminStudentStatusesController = async (req, res) => {
  try {
    const students = await getAdminStudentStatuses();
    const summary = {
      total_students: students.length,
      online: students.filter((student) => student.is_online === true).length,
      offline: students.filter((student) => student.is_online === false).length,
      active: students.filter((student) => student.activity_status === "active").length,
      inactive: students.filter(
        (student) => student.activity_status === "inactive",).length,
      disabled: students.filter(
        (student) => student.account_status === "disabled",).length,
      completed: students.filter(
        (student) => student.learning_status === "completed",).length,
      in_progress: students.filter(
        (student) => student.learning_status === "in_progress",).length,
      not_started: students.filter(
        (student) => student.learning_status === "not_started",).length,
    };
    return res.status(200).json({
      success: true,
      summary,
      students,
    });
  } catch (error) {
    console.error("Admin student status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
