const axios = require('axios');
const Voucher = require('../models/Voucher');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// PayTM Configuration
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE;
const PAYTM_CALLBACK_URL = process.env.PAYTM_CALLBACK_URL;

// Amazon Pay Configuration
const AMAZON_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const AMAZON_SELLER_ID = process.env.AMAZON_SELLER_ID;
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;

exports.initiatePayment = async (req, res) => {
  try {
    const { voucherId, paymentMethod } = req.body;
    const voucher = await Voucher.findById(voucherId);
    
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.status !== 'available') {
      return res.status(400).json({ error: 'Voucher is not available for purchase' });
    }

    const orderId = uuidv4();
    let paymentData;

    if (paymentMethod === 'paytm') {
      paymentData = {
        MID: PAYTM_MERCHANT_ID,
        WEBSITE: PAYTM_WEBSITE,
        ORDER_ID: orderId,
        TXN_AMOUNT: voucher.amount.toString(),
        CUST_ID: req.user._id.toString(),
        CALLBACK_URL: PAYTM_CALLBACK_URL,
        INDUSTRY_TYPE_ID: 'Retail',
        CHANNEL_ID: 'WEB'
      };

      // Generate checksum
      const checksum = generatePaytmChecksum(paymentData, PAYTM_MERCHANT_KEY);
      paymentData.CHECKSUMHASH = checksum;

    } else if (paymentMethod === 'amazonpay') {
      paymentData = {
        sellerOrderId: orderId,
        storeName: 'Voucher Marketplace',
        amount: voucher.amount.toString(),
        currencyCode: 'INR',
        customInformation: JSON.stringify({
          voucherId: voucher._id,
          userId: req.user._id
        })
      };
    }

    // Save transaction record
    const transaction = new Transaction({
      orderId,
      amount: voucher.amount,
      paymentMethod,
      status: 'initiated',
      voucher: voucher._id,
      user: req.user._id
    });
    await transaction.save();

    // Update voucher status
    voucher.status = 'pending';
    voucher.transactionId = transaction._id;
    await voucher.save();

    return res.json({
      paymentData,
      paymentMethod
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const transaction = await Transaction.findOne({ orderId });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    let verificationResult;
    if (paymentMethod === 'paytm') {
      verificationResult = await verifyPaytmPayment(orderId);
    } else if (paymentMethod === 'amazonpay') {
      verificationResult = await verifyAmazonPayment(orderId);
    }

    if (verificationResult.success) {
      transaction.status = 'completed';
      await transaction.save();

      const voucher = await Voucher.findById(transaction.voucher);
      voucher.status = 'sold';
      voucher.buyer = transaction.user;
      voucher.soldAt = new Date();
      await voucher.save();

      return res.json({ success: true });
    } else {
      transaction.status = 'failed';
      await transaction.save();

      const voucher = await Voucher.findById(transaction.voucher);
      voucher.status = 'available';
      await voucher.save();

      return res.status(400).json({ error: 'Payment verification failed' });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

// Helper functions
function generatePaytmChecksum(params, key) {
  // Implementation for PayTM checksum generation
  // This would use the PayTM checksum generation library
  return 'generated_checksum_value';
}

async function verifyPaytmPayment(orderId) {
  // Implementation for PayTM payment verification
  return { success: true };
}

async function verifyAmazonPayment(orderId) {
  // Implementation for Amazon Pay payment verification
  return { success: true };
}