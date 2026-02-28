const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const logActivity = require('../utils/logActivity')
const XLSX = require("xlsx");



cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

function safeParseJSON(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value; // already array
    if (typeof value !== 'string') return [];

    try {
        return JSON.parse(value);
    } catch {
        // If comma-separated string → convert to array
        if (value.includes(',')) {
            return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        // Single string value → wrap in array
        return value.trim() ? [value.trim()] : [];
    }
}


const importProductsFromExcel = async (req, res) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) {
      return res.status(400).json({ message: "Please provide sellerId in the body" });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    // 📄 Read Excel file
    const excelFile = req.files.file;
    const workbook = XLSX.readFile(excelFile.tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of rows) {
      let images = [];
      let catalogs = [];

      // 📷 Upload product images
      if (req.files && req.files.image) {
        const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "products",
            resource_type: "image",
          });
          images.push(result.secure_url);
        }
      }

      // 📂 Upload catalog images
      if (req.files && req.files.catalog) {
        const files = Array.isArray(req.files.catalog) ? req.files.catalog : [req.files.catalog];
        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "catalogs",
            resource_type: "image",
          });
          catalogs.push(result.secure_url);
        }
      }

      // 📝 Parse JSON/CSV fields from Excel (⚠️ lowercase keys as in Excel file)
      const brandsJson = JSON.stringify(safeParseJSON(row.brands));
      const colorsJson = JSON.stringify(safeParseJSON(row.colors));
      const sizePriceJson = JSON.stringify(safeParseJSON(row.size_price));

      // 💾 Insert into DB
      await db.query(
        `INSERT INTO product 
        (sellerId, name, price, sku, categoryId, stockQuantity, description, modelNo, code, material, image, brands, colors, size_price, catalog) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sellerId,
          row.name || "",
          row.price || 0,
          row.sku || "",
          row.categoryId || null,
          row.stockQuantity || 0,
          row.description || "",
          row.modelNo || "",
          row.code || "",
          row.material || "",
          JSON.stringify(images),
          brandsJson,
          colorsJson,
          sizePriceJson,
          JSON.stringify(catalogs),
        ]
      );
    }

    // ✅ Preview first row with parsed values
    const previewData = {
      ...rows[0],
      image: safeParseJSON(rows[0].image),
      brands: safeParseJSON(rows[0].brands),
      colors: safeParseJSON(rows[0].colors),
      size_price: safeParseJSON(rows[0].size_price),
      catalog: safeParseJSON(rows[0].catalog),
    };

    res.json({
      success: true,
      message: "Products imported successfully!",
      preview: previewData,
    });
  } catch (error) {
    console.error("❌ Excel import error:", error);
    res.status(500).json({ success: false, message: "Error importing products" });
  }
};

// ✅ Delete Multiple Products API
const deleteExcelProducts = async (req, res) => {
  try {
    const { productIds } = req.body; // Expect array of productIds

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide productIds array",
      });
    }

    // 🔑 Delete products in one query
    const [result] = await db.query(
      `DELETE FROM product WHERE id IN (?)`,
      [productIds]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} products deleted successfully`,
      deletedIds: productIds,
    });
  } catch (error) {
    console.error("❌ Delete products error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting products",
    });
  }
};



module.exports = {importProductsFromExcel, deleteExcelProducts};





