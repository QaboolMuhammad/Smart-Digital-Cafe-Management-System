const express = require("express");
const Staff = require("../models/Staff");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ message: "Staff added successfully", staff });
  } catch {
    res.status(500).json({ message: "Staff not added" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch {
    res.status(500).json({ message: "Staff not found" });
  }
});

module.exports = router;