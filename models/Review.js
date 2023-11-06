const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },

    reviews: [
      {
        review: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
      },
    ],

    refreshToken: String,
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);
