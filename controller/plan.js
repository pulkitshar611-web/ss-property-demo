const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');

// CREATE PLAN
const createPlan = async (req, res) => {
  try {
    const { name, price, billingCycle, features, description, status } = req.body;

    const [result] = await db.query(`
      INSERT INTO plans (name, price, billingCycle, features, description, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      price,
      billingCycle,
      JSON.stringify(features),
      description,
      status
    ]);

    const [rows] = await db.query(`SELECT * FROM plans WHERE id = ?`, [result.insertId]);
    const createdPlan = rows[0];
    createdPlan.features = JSON.parse(createdPlan.features);

    res.status(201).json({
      status: true,
      message: 'Plan created successfully',
      data: createdPlan
    });
  } catch (error) {
    console.error('Create Plan Error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// GET ALL PLANS
const getAllPlans = async (req, res) => {
  try {
    const [plans] = await db.query(`SELECT * FROM plans`);
    const result = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features || '[]')
    }));

    res.status(200).json({ status: true, message: "Reterived All data", data: result });
  } catch (error) {
    console.error('Get All Plans Error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// GET PLAN BY ID
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM plans WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: false, message: 'Plan not found' });
    }

    const plan = rows[0];
    plan.features = JSON.parse(plan.features || '[]');

    res.status(200).json({ status: true, message: "Single data", data: plan });
  } catch (error) {
    console.error('Get Plan By ID Error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// UPDATE PLAN
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, billingCycle, features, description, status } = req.body;

    await db.query(`
      UPDATE plans 
      SET name = ?, price = ?, billingCycle = ?, features = ?, description = ?, status = ?
      WHERE id = ?
    `, [
      name,
      price,
      billingCycle,
      JSON.stringify(features),
      description,
      status,
      id
    ]);

    const [rows] = await db.query(`SELECT * FROM plans WHERE id = ?`, [id]);
    const updatedPlan = rows[0];
    updatedPlan.features = JSON.parse(updatedPlan.features || '[]');

    res.status(200).json({ status: true, message: 'Plan updated successfully', data: updatedPlan });
  } catch (error) {
    console.error('Update Plan Error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// DELETE PLAN
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`SELECT * FROM plans WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: false, message: 'Plan not found' });
    }

    await db.query(`DELETE FROM plans WHERE id = ?`, [id]);

    res.status(200).json({ status: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete Plan Error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan
};



