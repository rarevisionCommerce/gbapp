const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messagesSchema);
