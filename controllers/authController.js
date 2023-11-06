const Admin = require("../models/Admin");
const Client = require("../models/Client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

const userMap = {
  client: Client,
  admin: Admin,
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const trimmedemail = email.trim().toLowerCase();

  let foundUser = await Admin.findOne({ email: trimmedemail }).exec();

  if (!foundUser) {
    foundUser = await Client.findOne({ email: trimmedemail }).exec();
  }

  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized, No user found" });
  }
  if (foundUser.status === "Inactive") {
    return res.status(401).json({ message: "Inactive" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res.status(401).json({
      message: "Unauthorized, No user found matching username and password",
    });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.email,
        roles: foundUser.roles,
        userName: foundUser.userName,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "10m" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Saving refreshToken with current user
  foundUser.refreshToken = refreshToken;
  await foundUser.save();

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and roles
  const roles = foundUser.roles;
  const user_Id = foundUser._id;
  const imgUrl = foundUser.imgUrl;
  const userName = foundUser.userName;


  res.json({ accessToken, roles, user_Id, email: foundUser.email, imgUrl, userName });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = async (req, res) => {
  const { userId } = req.params;

  function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  if (!userId || !isValidObjectId(userId)) return res.status(401).json({ message: "Unauthorized" });

  try {
    let foundUser = await Admin.findById(userId).exec();

    if (!foundUser) {
      foundUser = await Client.findById(userId).exec();
    }

    if (!foundUser || foundUser.status === "Inactive") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const refreshToken = foundUser.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });

        const email = decoded.username;

        if (foundUser.email === email) {
          const accessToken = jwt.sign(
            {
              UserInfo: {
                username: foundUser.email,
                roles: foundUser.roles,
              },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
          );

          const roles = foundUser.roles;
          const email = foundUser.email;
          const user_Id = foundUser._id;
          const imgUrl = foundUser.imgUrl;
          const userName = foundUser.userName;

          res.json({
            accessToken,
            roles,
            email,
            user_Id,
            imgUrl,
            userName
          });
        } else return res.status(401).json({ message: "Unauthorized" });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

const updateProfilePicture = async (req, res) => {
  const { userType, userId } = req.params;

  if (!userType || !userId )
    return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await userMap[userType].findById(userId).exec();

    if (!user) return res.status(404).json({ message: "No user found" });

    user.imgUrl = `${process.env.API_DOMAIN}/${req.file.path}` || "";

    await user.save();
    res.status(200).json({ message: "Profile picture updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong!!" });
  }
};

const updateUserStatus = async (req, res) => {
  const { userType, userId, status } = req.body;

  if (!userType || !userMap[userType] || !userId || !status)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await userMap[userType].findById(userId).exec();
    if (!user) return res.status(404).json({ message: "No user found" });

    user.status = status;

    await user.save();

    res.status(200).json({ message: "User updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong!!" });
  }
};

const changePassword = async (req, res) => {
  const { password, userType, userId } = req.body;

  if (!userId || !userType || !userMap[userType])
    return res.status(400).json({ message: "user id is required" });

  try {
    // Does the user exist to update?
    const user = await userMap[userType].findById(userId).exec();

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10); // salt rounds
    await user.save();

    res.json({ message: `Your password has been updated` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  updateProfilePicture,
  updateUserStatus,
  changePassword,
};
