const mongoose = require("mongoose");

const subscribedUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubscribedUser", subscribedUserSchema);
