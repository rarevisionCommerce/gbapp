const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    projectType: [{
      type: String,
      required: false,
    }],
    description: {
      type: String,
      required: false,
    },
    budget: {
      type: String,
      required: false,
    },
    timeline: {
      type: String,
      required: false,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);
