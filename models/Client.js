const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: [
      {
        type: String,
        default: "Client",
      },
    ],
    imgUrl: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      default: "Active",
    },
    isEmailVerified: { type: Boolean, default: false },

    refreshToken: String,
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", userSchema);
