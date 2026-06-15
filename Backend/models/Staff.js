const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "Waiter"
    },
    phone: String,
    shift: String,
    status: {
      type: String,
      default: "Active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);