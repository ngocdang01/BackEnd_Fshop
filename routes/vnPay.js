const { Router } = require('express');
const crypto = require('crypto');
const qs = require('querystring');
const moment = require('moment');

const router = Router();

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

// ✅ [GET] /vnpay/create_payment
// Tạo link thanh toán VNPay từ orderCode
router.get('/create_payment', (req, res) => {
  try {
    const { orderCode, amount } = req.query;

    if (!orderCode || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderCode hoặc amount',
      });
    }

    res.json({
      success: true,
      message: 'API tạo link thanh toán đang phát triển',
      received: { orderCode, amount },
    });
  } catch (error) {
    console.error('❌ create_payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi khởi tạo thanh toán',
      error: error.message,
    });
  }
});

// ✅ [GET] /vnpay/payment-result
// Trang callback khi thanh toán xong 
router.get('/payment-result', (req, res) => {
  res.send('<h2>Trang kết quả thanh toán VNPay đang phát triển...</h2>');
});

// ✅ [GET] /vnpay/check_order_status
// Kiểm tra trạng thái đơn hàng 
router.get('/check_order_status', (req, res) => {
  res.json({
    success: true,
    message: 'API kiểm tra trạng thái đơn hàng đang phát triển',
  });
});

module.exports = router;
