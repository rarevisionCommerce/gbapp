const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
      required: false,
    },
    roles: [
      {
        type: String,
        default: "Admin",
      },
    ],
    status: {
      type: String,
      default: "Active",
    },

    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    refreshToken: String,
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", userSchema);
