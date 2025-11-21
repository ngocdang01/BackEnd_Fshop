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
// Tạo link thanh toán từ order code 
// http://localhost:3002/vnpay/create_payment?orderCode=1234567899&amount=100000
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
// ✅ Tạo đơn hàng và link thanh toán VNPay 
router.post("/create_order_and_payment", async (req, res) => {
  try {
    const {
      userId,
      items,
      shippingFee = 0,
      voucher,
      paymentMethod,
      shippingAddress,
      order_code
    } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!userId || !items || !paymentMethod || !shippingAddress) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    console.log("🔄 Bắt đầu tạo đơn hàng với order_code:", order_code);

    // Chuẩn bị biến để lưu kết quả order
    const orderController = require('../controller/controller_order');
    const orderReq = { body: req.body };
    let orderData = null;
    let orderCreated = false;

    const orderRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 201) {
            orderData = data.data;
            orderCreated = true;
            console.log("✅ Đơn hàng đã được tạo thành công:", orderData.order_code);
          } else {
            console.error("❌ Lỗi tạo đơn hàng:", data);
            res.status(code).json(data);
          }
        }
      })
    };
    await orderController.createOrder(orderReq, orderRes);

    // Kiểm tra xem đơn hàng có được tạo thành công không
    if (!orderCreated || !orderData) {
      return res.status(500).json({
        success: false,
        message: "Không thể tạo đơn hàng"
      });
    }

    // Đảm bảo đơn hàng đã được lưu vào DB trước khi tạo link thanh toán
    const savedOrder = await Order.findOne({ order_code: orderData.order_code });

    if (!savedOrder) {
      console.error("❌ Đơn hàng chưa được lưu vào DB:", orderData.order_code);
      return res.status(500).json({
        success: false,
        message: "Đơn hàng chưa được lưu vào database"
      });
    }

    console.log("✅ Đơn hàng đã được lưu vào DB:", savedOrder.order_code);
  } catch (error) {
    console.error("❌ create_order_and_payment error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng và link thanh toán",
      error: error.message
    });
  }
});
// ✅ [GET] /vnpay/payment-result
// nhận callback khi thanh toán xong 
//http://localhost:3002/vnpay/payment-result
router.get('/payment-result', (req, res) => {
  res.send('<h2>Trang kết quả thanh toán VNPay đang phát triển...</h2>');
});
// ✅ API kiểm tra trạng thái đơn hàng 
router.get("/check_payment", (req, res) => {
  // Xác thực checksum, phản hồi "Thanh toán thành công" hoặc "Thất bại"
  res.json({ message: "Thanh toán thành công hoặc thất bại" });
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
