const express = require("express");
const router = express.Router();
const { promotionAdd, promotionGet, promotionDelete } = require("../controller/promotion.controller.js");

// Add promotion (sirf email)
router.post("/", promotionAdd);

// Get all promotions
router.get("/", promotionGet);

// Delete promotion by ID
router.delete("/:id", promotionDelete);

module.exports = router;
