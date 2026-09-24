import { setStudentEnabledStatus } from "../Model/adminStudentManagement.Model.js";

import {
  getUserById,
  permanentlyDeleteDisabledUser,
} from "../Model/user.Model.js";

const getStudentId = (req) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const cleanString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export const disableStudentController = async (req, res, next) => {
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
    return next(error);
  }
};

export const enableStudentController = async (req, res, next) => {
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
    return next(error);
  }
};

export const permanentlyDeleteStudentController = async (req, res, next) => {
  try {
    const studentId = getStudentId(req);

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const nickname = cleanString(req.body?.nickname);

    const confirmation = cleanString(req.body?.confirmation);

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: "Student nickname is required",
      });
    }

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: 'Type "DELETE" exactly to permanently delete this student',
      });
    }

    const student = await getUserById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.is_enabled === true) {
      return res.status(409).json({
        success: false,
        message: "Disable the student account before permanently deleting it",
      });
    }

    if (nickname !== student.nickname) {
      return res.status(400).json({
        success: false,
        message: "Nickname does not match the student account",
      });
    }

    const deletedStudent = await permanentlyDeleteDisabledUser(studentId);

    if (!deletedStudent) {
      return res.status(409).json({
        success: false,
        message:
          "Student could not be deleted. The account may have been enabled again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student permanently deleted successfully",
      student: {
        id: deletedStudent.id,
        nickname: deletedStudent.nickname,
        age_group: deletedStudent.age_group,
      },
    });
  } catch (error) {
    return next(error);
  }
};
