const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['paytm', 'amazonpay']
  },
  status: {
    type: String,
    required: true,
    enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'],
    default: 'initiated'
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failureReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ voucher: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: 1 });

// Virtual for transaction status
TransactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Pre-save hook to update timestamps
TransactionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);