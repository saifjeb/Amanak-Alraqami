import {getAllUsers,getUserById,deleteUser,updateUser} from "../Model/user.Model.js";

export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users yet",
        users: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const userId = req.params.id;
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
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateMyProfileController = async (req, res) => {
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
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Nickname already exists",
      });
    }

    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteMyAccountController = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteUser(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};