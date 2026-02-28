const express = require('express');
const { createPlan, getAllPlans, updatePlan, deletePlan, getPlanById } = require('../controller/plan');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');


const router = express.Router();

router.post('/createPlan', createPlan);
router.get('/getAllPlans', getAllPlans);
router.get('/getPlanById/:id', getPlanById);
router.patch('/updatePlan/:id', updatePlan);
router.delete('/deletePlan/:id', deletePlan);



module.exports = router;  





