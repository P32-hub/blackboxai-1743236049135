const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Voucher code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Voucher amount is required'],
    min: [50, 'Minimum voucher amount is ₹50']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'sold', 'expired'],
    default: 'available'
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Expiry date must be in the future'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  soldAt: Date,
  paymentMethod: {
    type: String,
    enum: ['paytm', 'amazonpay']
  },
  transactionId: String
});

// Indexes for better query performance
VoucherSchema.index({ status: 1 });
VoucherSchema.index({ seller: 1 });
VoucherSchema.index({ buyer: 1 });
VoucherSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Voucher', VoucherSchema);