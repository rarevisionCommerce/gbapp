const Admin = require("../models/Admin");
const Client = require("../models/Client");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const SubscribedUser = require("../models/SubscribedUser");

const userMap = {
  client: Client,
  admin: Admin,
};

//get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const page = req?.query?.page || 1;
  const perPage = req?.query?.perPage || 20;
  const skip = (page - 1) * parseInt(perPage);
  const email = req?.query?.email;
  const userType = req?.query?.userType || "client";

  const filters = {
    email: { $regex: email, $options: "i" },
  };

  // Find all users with the specified role
  try {
    const [users, count] = await Promise.all([
      userMap[userType]
        .find(filters)
        .select("-password -refreshToken")
        .limit(parseInt(perPage))
        .skip(skip)
        .lean()
        .exec(),
      userMap[userType].countDocuments(filters),
    ]);
    if (!users?.length) {
      return res.status(200).json({ message: "No users found" });
    }

    res.json({ users, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Error getting users: ` });
  }
});

//create new user
const createNewUser = asyncHandler(async (req, res) => {
  const { email, password, roles, userType, userName } = req.body;

  //confirming required data
  if (!email || !userName || !password || !userMap[userType]) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    //checking duplicates

    const dupEmail = await userMap[userType]
      .findOne({
        email: { $regex: email, $options: "i" },
      })
      .lean()
      .exec();
    if (dupEmail) {
      return res
        .status(409)
        .json({ message: "A user with the same email already exists" });
    }

    //hash password
    const hashedPwd = await bcrypt.hash(password, 10);

    const userObject = {
      roles,
      email,
      userName,
      password: hashedPwd,
    };

    //create and store user
    const user = await userMap[userType].create(userObject);

    if (!user) res.status(400).json({ message: "Invalid user data received" });

    res.status(201).json({ message: `Account created successfully` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Something went wrong!!` });
  }
});

//getUser by ID
const getUserById = async (req, res) => {
  if (!req.params.userId || !req.params.userType)
    return res.status(400).json({ message: "id is required" });

  try {
    const user = await userMap[userType]
      .findById(req.params.userId)
      .select("-password -refreshToken")
      .lean()
      .exec();

    if (!user) {
      return res
        .status(204)
        .json({ message: `No user matches id: ${req.params.userId}` });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

//delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { userId, userType } = req.params;
  if (!userId || !userType)
    return res
      .status(400)
      .json({ message: "User id and user type are required" });

  try {
    const user = await userMap[userType].findById(userId).exec();

    if (!user)
      return res.status(400).json({
        message: "Something went wrong, refresh the page and try again",
      });

    await userMap[userType].findOneAndDelete({ _id: userId }).exec();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
});

const updateUserStatus = async (req, res) => {
  const { userId, status, userType } = req.params;

  if (!userId || !status || !userMap[userType])
    return res.status(400).json({ message: "All fiels are required" });

  try {
    const updates = {
      status: status,
    };
    const user = await userMap[userType].findByIdAndUpdate(userId, updates, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const addToSubscribedUsers = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const dupEmail = await SubscribedUser
      .findOne({
        email: { $regex: email, $options: "i" },
      })
      .lean()
      .exec();
    if (dupEmail)
      return res
        .status(409)
        .json({ message: "The email already exists to our subscribers list." });

    await SubscribedUser.create(req.body);

    res.status(201).json({message: "Thankyou, your email has been added to our subscribers list."})
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUserStatus,
  deleteUser,
  getUserById,
  addToSubscribedUsers
};
