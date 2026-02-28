const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});


const createCategory = async (req, res) => {
  try {
    const { sellerId, name, parentId, price, quantity, fastCode } = req.body;
    let imageUrl = null; // default if no image


     // ✅ Random fastCode generate (pure number)
    const finalFastCode = fastCode || Math.floor(100 + Math.random() * 9900); // e.g., 281, 9948  

   
    // ✅ If image is selected, upload to Cloudinary
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'categories',
        resource_type: 'image'
      });
      imageUrl = result.secure_url;
    }

    // ✅ Save to DB (can be null if no image)
    const [result] = await db.query('INSERT INTO category (sellerId, name, image, parentId, price, quantity, fastCode) VALUES (?, ?, ?, ?, ?, ?, ?)', [sellerId, name, imageUrl, parentId || null, price || null,
        quantity || null,
        finalFastCode]);
    const insertedId = result.insertId;

    res.status(201).json({
      status: "true",
      message: "Category added successfully",
      data: {
        id: insertedId,
        name,
        price: price || null,
        quantity: quantity || null,
        fastCode: finalFastCode,
        image: imageUrl ? [imageUrl] : [], // always return array
        parentId: parentId || null
       
      }
    });

  } catch (error) {
    console.error("Error while adding category:", error);
    res.status(500).json({
      status: "false",
      message: "Server error while adding category",
      data: []
    });
  }
};


const getAllCategories = async (req, res) => {
  try {
    console.log("Fetching all categories...");

    const [rows] = await db.query(`
      SELECT * FROM category 
    `);

    const formatted = rows.map(cat => ({
      id: cat.id,
      sellerId: cat.sellerId,
      name: cat.name,
      parentId: cat.parentId,
      price: cat.price,
      quantity: cat.quantity,
      fastCode: cat.fastCode,
      image: cat.image ? [cat.image] : [], // always return array
      createdAt: cat.createdAt
    }));

    res.status(200).json({
      status: "true",
      message: "Categories fetched successfully",
    //  total: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "false",
      message: "Server error while fetching categories",
      data: []
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { sellerId, name, parentId, price, quantity, fastCode } = req.body;
    const { id } = req.params;

    let imageUrl = null;

    // ✅ Upload new image if provided
    if (req.files && req.files.image) {
      const imageFile = Array.isArray(req.files.image)
        ? req.files.image[0]
        : req.files.image;

      const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
        folder: 'categories',
        resource_type: 'image'
      });

      imageUrl = result.secure_url;
    }

    // ✅ Get existing category
    const [existing] = await db.query('SELECT * FROM category WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ status: "false", message: "Category not found" });
    }

    const existingCategory = existing[0];

    // ✅ Use new image if uploaded, else keep old one
    const finalImage = imageUrl || existingCategory.image;
    const finalName = name || existingCategory.name;
    const finalSellerId = sellerId || existingCategory.sellerId;
    const finalParentId = parentId !== undefined ? parentId : existingCategory.parentId;
    const finalPrice = price !== undefined ? price : existingCategory.price;
    const finalQuantity = quantity !== undefined ? quantity : existingCategory.quantity;
    const finalFastCode = fastCode || existingCategory.fastCode;

   // ✅ Update category
    await db.query(
      `UPDATE category 
       SET sellerId = ?, name = ?, image = ?, parentId = ?, price = ?, quantity = ?, fastCode = ? 
       WHERE id = ?`,
      [finalSellerId, finalName, finalImage, finalParentId, finalPrice, finalQuantity, finalFastCode, id]
    );

    res.json({
      status: "true",
      message: "Category updated successfully",
      data: {
        id,
        name: finalName,
        price: finalPrice,
        quantity: finalQuantity,
        fastCode: finalFastCode,  
        image: finalImage ? [finalImage] : [],
        parentId: finalParentId  
      }
    });
  } catch (error) {
    console.error("Error while updating category:", error);
    res.status(500).json({
      status: "false",
      message: "Server error while updating category",
      data: []
    });
  }
};



const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM category WHERE id = ?`, [id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};




module.exports = { createCategory, getAllCategories, updateCategory, deleteCategory };
