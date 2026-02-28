const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');

// ➕ Add Promotion (sirf email save karna hai)
const promotionAdd = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "false", message: "Email is required" });
    }

    await db.query(
      "INSERT INTO promotion (email) VALUES (?)",
      [email]
    );

    res.status(201).json({ status: "true", message: "Promotion added successfully" });
  } catch (err) {
    console.error("Add promotion error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 📃 Get All Promotions
const promotionGet = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM promotion ORDER BY id DESC");
    res.status(200).json({ status: "true", data: rows });
  } catch (err) {
    console.error("Get promotion error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ❌ Delete Promotion
const promotionDelete = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM promotion WHERE id = ?", [id]);

    res.status(200).json({ status: "true", message: "Promotion deleted successfully" });
  } catch (err) {
    console.error("Delete promotion error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { promotionAdd, promotionGet, promotionDelete };
