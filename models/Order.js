const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId,
     required: true,
      ref: "Client"
     },
     
    package: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    websiteUrl: {
      type: String,
      required: false,
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
