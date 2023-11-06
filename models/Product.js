const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Admin",
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 5,
    },
    sales: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 1,
    },
    thumbNail: {
      type: String,
      required: true,
    },
    screenshots: [
      {
        filePath: {
          type: String,
          required: true,
        },
      },
    ],
    fileLink: {
      type: String,
      required: true,
    },
    reviews: {
      type: String,
      default: 0,
    },
    flashSale: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: String,
      required: true,
    },
    released: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: false,
    },
    operatingSystem: {
      type: String,
      required: true,
    },
    documentation: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    technology: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
