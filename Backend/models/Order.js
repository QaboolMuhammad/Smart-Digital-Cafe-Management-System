const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    invoiceNo: String,
    customerName: String,
    tableNo: String,
    waiter: String,
    items: [
      {
        name: String,
        category: String,
        price: Number,
        qty: Number,
        total: Number
      }
    ],
    subtotal: Number,
    tax: Number,
    grandTotal: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);