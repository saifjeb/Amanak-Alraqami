import {getAllUsers,getUserById,deleteUser,updateUser} from "../Model/user.Model.js";

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

const publicUser = (user) => {
  if (!user) {
    return user;
  }
  return {
    id: user.id,
    nickname: user.nickname,
    age_group: user.age_group,
    avatar: user.avatar,
    total_points: user.total_points,
    current_level: user.current_level,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    last_active_at: user.last_active_at,
    is_enabled: user.is_enabled,
  };
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

export const getAllUsersController = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    const safeUsers = users.map(publicUser);
    if (safeUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users yet",
        users: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: safeUsers,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserByIdController = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userInfo = {
      nickname: req.body.nickname ?? existingUser.nickname,
      age_group: req.body.age_group ?? existingUser.age_group,
      avatar: req.body.avatar ?? existingUser.avatar,
    };

    const updatedUser = await updateUser(userId, userInfo);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: publicUser(updatedUser),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Nickname already exists",
      });
    }

    return next(error);
  }
};

export const deleteMyAccountController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteUser(userId);
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};
