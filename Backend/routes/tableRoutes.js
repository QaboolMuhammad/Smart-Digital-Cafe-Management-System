const express = require("express");
const Table = require("../models/Table");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    let tables = await Table.find().sort({ tableNo: 1 });

    if (tables.length === 0) {
      const defaultTables = [];

      for (let i = 1; i <= 10; i++) {
        defaultTables.push({ tableNo: i });
      }

      await Table.insertMany(defaultTables);
      tables = await Table.find().sort({ tableNo: 1 });
    }

    res.json(tables);
  } catch {
    res.status(500).json({ message: "Tables not found" });
  }
});

router.post("/checkin", authMiddleware, async (req, res) => {
  try {
    const { tableNo, customerName, guests, waiter } = req.body;

    const table = await Table.findOneAndUpdate(
      { tableNo },
      {
        busy: true,
        customerName,
        guests,
        waiter
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Customer checked-in successfully", table });
  } catch {
    res.status(500).json({ message: "Check-in failed" });
  }
});

router.put("/reset/:tableNo", authMiddleware, async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { tableNo: req.params.tableNo },
      {
        busy: false,
        customerName: "",
        guests: 0,
        waiter: ""
      },
      { new: true }
    );

    res.json({ message: "Table reset successfully", table });
  } catch {
    res.status(500).json({ message: "Table reset failed" });
  }
});

router.put("/reset-all", authMiddleware, async (req, res) => {
  try {
    await Table.updateMany({}, {
      busy: false,
      customerName: "",
      guests: 0,
      waiter: ""
    });

    res.json({ message: "All tables reset successfully" });
  } catch {
    res.status(500).json({ message: "Reset failed" });
  }
});

module.exports = router;