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

const getDashboardOverview = async (req, res) => {
  try {
    // ✅ Total Products (all time)
    const [productResult] = await db.query(`SELECT COUNT(*) AS count FROM product`);

    const [lastProductResult] = await db.query(`
      SELECT COUNT(*) AS count FROM product
      WHERE createdAt < CURDATE() - INTERVAL 1 MONTH
    `);

    const totalProducts = productResult[0].count;
    const lastProducts = lastProductResult[0].count;
    const productGrowth =
      lastProducts === 0 ? 100 : (((totalProducts - lastProducts) / lastProducts) * 100).toFixed(1);

    // ✅ Total Users (all time)
    const [userResult] = await db.query(`SELECT COUNT(*) AS count FROM user`);

    const [lastUserResult] = await db.query(`
      SELECT COUNT(*) AS count FROM user
      WHERE createdAt < CURDATE() - INTERVAL 1 MONTH
    `);

    const totalUsers = userResult[0].count;
    const lastUsers = lastUserResult[0].count;
    const userGrowth =
      lastUsers === 0 ? 100 : (((totalUsers - lastUsers) / lastUsers) * 100).toFixed(1);

    // ✅ Stock Level Trend (Last 6 Months — keep as is)
    const [stockTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(MIN(createdAt), '%b %Y') AS month,
        COUNT(*) AS total
      FROM product
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY YEAR(createdAt), MONTH(createdAt)
    `);

    const stockLabels = stockTrend.map(row => row.month);
    const stockData = stockTrend.map(row => row.total);

    // ✅ Final Response
    return res.json({
      status: true,
      message: "Retrieved dashboard overview",
      totalProducts: {
        count: totalProducts,
        change: parseFloat(productGrowth)
      },
      totalUsers: {
        count: totalUsers,
        change: parseFloat(userGrowth)
      },
      stockLevelTrends: {
        labels: stockLabels,
        data: stockData
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};



const getDashboardSeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    if (!sellerId) {
      return res.status(400).json({
        status: false,
        message: "sellerId is required in params or query",
      });
    }

    // ✅ Total Categories by Seller
    const [categoryCountResult] = await db.query(
      `SELECT COUNT(*) AS count FROM category WHERE sellerId = ?`,
      [sellerId]
    );

    const [categoryListResult] = await db.query(
      `SELECT id, name FROM category WHERE sellerId = ?`,
      [sellerId]
    );

    // ✅ Total Products by Seller
    const [productCountResult] = await db.query(
      `SELECT COUNT(*) AS count FROM product WHERE sellerId = ?`,
      [sellerId]
    );

    const [productListResult] = await db.query(
      `SELECT id, name, price FROM product WHERE sellerId = ?`,
      [sellerId]
    );

    // ✅ Final Response
    return res.status(200).json({
      status: true,
      message: "Seller dashboard data retrieved successfully",
      totalCategories: {
        count: categoryCountResult[0].count,
        list: categoryListResult
      },
      totalProducts: {
        count: productCountResult[0].count,
        list: productListResult
      }
    });

  } catch (error) {
    console.error("Dashboard Seller Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

module.exports = { getDashboardOverview, getDashboardSeller };
