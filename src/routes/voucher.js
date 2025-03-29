const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const Transaction = require('../models/Transaction');

// Create a new voucher
router.post('/create', async (req, res) => {
  try {
    const { code, amount, expiryDate } = req.body;
    const voucher = new Voucher({
      code,
      amount,
      expiryDate,
      seller: req.user._id
    });
    await voucher.save();
    res.status(201).json({ message: 'Voucher created successfully', voucher });
  } catch (error) {
    res.status(400).json({ error: 'Error creating voucher', details: error.message });
  }
});

// Get all vouchers
router.get('/', async (req, res) => {
  try {
    const vouchers = await Voucher.find({ status: 'available' });
    res.status(200).json(vouchers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vouchers', details: error.message });
  }
});

// Get a specific voucher
router.get('/:id', async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching voucher', details: error.message });
  }
});

// Update voucher status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    res.status(200).json({ message: 'Voucher status updated', voucher });
  } catch (error) {
    res.status(400).json({ error: 'Error updating voucher status', details: error.message });
  }
});

module.exports = router;