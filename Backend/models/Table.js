const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNo: {
      type: Number,
      required: true,
      unique: true
    },
    busy: {
      type: Boolean,
      default: false
    },
    customerName: String,
    guests: Number,
    waiter: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);