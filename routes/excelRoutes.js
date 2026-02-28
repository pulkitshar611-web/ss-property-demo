const express = require('express');
const{ importProductsFromExcel, deleteExcelProducts } = require('../controller/excel'); // adjust path
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const router = express.Router();





router.post("/importProductsFromExcel", importProductsFromExcel);
router.delete("/deleteExcelProducts", deleteExcelProducts);

module.exports = router;




