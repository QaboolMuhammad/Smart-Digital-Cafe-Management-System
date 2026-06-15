const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({
      message: "Order saved successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: "Order not saved" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Orders not found" });
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find();

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.grandTotal, 0);

    res.json({
      totalOrders,
      totalSales
    });
  } catch (error) {
    res.status(500).json({ message: "Stats error" });
  }
});

module.exports = router;