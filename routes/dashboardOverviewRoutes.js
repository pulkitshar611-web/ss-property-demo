const express = require('express');
const { getDashboardOverview, getDashboardSeller } = require('../controller/dashboardOverview');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');


const router = express.Router();


router.get('/getDashboardOverview', getDashboardOverview);
router.get('/getDashboardSeller/:sellerId', getDashboardSeller);


module.exports = router;    
