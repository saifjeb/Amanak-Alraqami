import { setStudentEnabledStatus } from "../Model/adminStudentManagement.Model.js";

const getStudentId = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

export const disableStudentController = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await setStudentEnabledStatus(studentId, false);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Student account disabled successfully",
      student,
    });
  } catch (error) {
    console.error("Disable student error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const enableStudentController = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }
    const student = await setStudentEnabledStatus(studentId, true);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Student account enabled successfully",
      student,
    });
  } catch (error) {
    console.error("Enable student error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
