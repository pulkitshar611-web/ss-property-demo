const db = require('../config');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (if not already done globally)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ===================== CREATE PRODUCT =====================
exports.createProduct = async (req, res) => {
  try {
    const { name, price, categoryId, description, location, address, bedrooms, bathrooms, area, propertyType, status } = req.body;
    let images = [];

    // Upload images if any
    if (req.files?.image) {
      const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'properties' });
        images.push(result.secure_url);
      }
    }

    const [insertResult] = await db.query(
      `INSERT INTO product 
       (name, price, categoryId, description, image, location, address, bedrooms, bathrooms, area, propertyType, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, price, categoryId, description,
        JSON.stringify(images),
        location, address, bedrooms, bathrooms, area, propertyType, status
      ]
    );

    const [rows] = await db.query(`SELECT * FROM product WHERE id = ?`, [insertResult.insertId]);
    res.status(201).json({ success: true, message: 'Property created successfully', data: rows[0] });

  } catch (err) {
    console.error("❌ Create property error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================== GET ALL PRODUCTS =====================
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*, 
        c.name AS categoryName
      FROM product p
      LEFT JOIN category c ON p.categoryId = c.id
      ORDER BY p.id DESC
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Get all properties error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================== GET PRODUCT BY ID =====================
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        p.*, 
        c.name AS categoryName
      FROM product p
      LEFT JOIN category c ON p.categoryId = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found' });

    res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error("❌ Get property by ID error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================== UPDATE PRODUCT =====================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId, description, location, address, bedrooms, bathrooms, area, propertyType, status } = req.body;

    let images = [];

    // Upload new images if provided
    if (req.files?.image) {
      const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'properties' });
        images.push(result.secure_url);
      }
    }

    // Update record
    await db.query(
      `UPDATE product 
       SET name=?, price=?, categoryId=?, description=?, 
           image=?, location=?, address=?, bedrooms=?, bathrooms=?, 
           area=?, propertyType=?, status=? 
       WHERE id=?`,
      [
        name, price, categoryId, description,
        JSON.stringify(images.length ? images : null),
        location, address, bedrooms, bathrooms, area, propertyType, status, id
      ]
    );

    const [rows] = await db.query(`SELECT * FROM product WHERE id = ?`, [id]);
    res.status(200).json({ success: true, message: 'Property updated successfully', data: rows[0] });

  } catch (err) {
    console.error("❌ Update property error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================== DELETE PRODUCT =====================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM product WHERE id = ?`, [id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found' });

    await db.query(`DELETE FROM product WHERE id = ?`, [id]);
    res.status(200).json({ success: true, message: 'Property deleted successfully' });

  } catch (err) {
    console.error("❌ Delete property error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
