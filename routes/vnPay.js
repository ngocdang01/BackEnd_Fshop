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
// Tạo link thanh toán VNPay 
router.get('/create_payment', (req, res) => {
   const { orderCode, amount } = req.query;

  const tmnCode = "6P2DR0XB"; // Lấy từ cấu hình VNPAY
  const secretKey = "GET28K94GCVBQOGQO95ANEG9FF6PR4YL";
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = `${process.env.API_URL_CONFIG}:${process.env.PORT}/vnpay/payment-result`;

  const ipAddr = req.ip;
  const orderId = orderCode || moment().format("YYYYMMDDHHmmss");
  const bankCode = req.query.bankCode || "NCB";
  const createDate = moment().format("YYYYMMDDHHmmss");
  const orderInfo = `Thanh_toan_don_hang_${orderCode}`;
  const locale = req.query.language || "vn";
  const currCode = "VND";

  // Tạo tham số thanh toán
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params);
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);
  res.json({ paymentUrl });
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
