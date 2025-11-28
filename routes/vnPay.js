const { Router } = require('express');
const crypto = require('crypto');
const qs = require('querystring');
const moment = require('moment');
const Order = require('../model/model_order');


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
           return res.status(code).json(data);
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

    // Tạo link thanh toán VNPay
    const finalTotal = orderData.finalTotal;

    const tmnCode = "6P2DR0XB";
    const secretKey = "GET28K94GCVBQOGQO95ANEG9FF6PR4YL";
    const returnUrl = `${process.env.API_URL_CONFIG}:${process.env.PORT}/vnpay/payment-result`;
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    const ipAddr = req.ip;
    const orderId = order_code || orderData.order_code;
    const bankCode = req.body.bankCode || "NCB";
    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderInfo = `Thanh_toan_don_hang_${orderId}`;
    const locale = req.body.language || "vn";
    const currCode = "VND";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "billpayment",
      vnp_Amount: finalTotal * 100,
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
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);

    console.log("✅ Tạo link thanh toán thành công cho đơn hàng:", orderId);

    return res.json({
      success: true,
      message: "Tạo đơn hàng và link thanh toán thành công",
      order: orderData,
      paymentUrl: paymentUrl
    });

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
router.get('/payment-result', async  (req, res) => {
  const query = req.query;

  //  Check dữ liệu rỗng
  if (!query.vnp_ResponseCode || Object.keys(query).length === 0) {
    console.log("⚠️ Không có dữ liệu callback, có thể là fallback từ deeplink");
     // Trả về JSON thay vì redirect để FE có thể xử lý
    return res.json({
      success: false,
      status: "no_data",
      message: "Không có dữ liệu callback",
      data: null
    });
  }

  //  Validate chữ ký
  const secretKey = "GET28K94GCVBQOGQO95ANEG9FF6PR4YL";
  const vnp_SecureHash = query.vnp_SecureHash;

  delete query.vnp_SecureHash;

  const signData = qs.stringify(query);
  const checkSum = crypto.createHmac("sha512", secretKey).update(signData).digest("hex");
  console.log("VNPay callback data:", query);

    if (vnp_SecureHash === checkSum) {

  const orderCode = query.vnp_OrderInfo.replace("Thanh_toan_don_hang_", "");
  console.log("🔍 Tìm kiếm đơn hàng với order_code:", orderCode);
  
  // Kiểm tra đơn hàng có tồn tại không
  const existingOrder = await Order.findOne({ order_code: orderCode });
  if (!existingOrder) {
    console.error("❌ Không tìm thấy đơn hàng với order_code:", orderCode);
    const allOrders = await Order.find({}, { order_code: 1, createdAt: 1 }).limit(10);
    console.log(allOrders);

    return res.redirect(`coolmate://payment-result?status=failed&message=OrderNotFound&orderId=${orderCode}`);
  }

  console.log("✅ Tìm thấy đơn hàng:", existingOrder.order_code, "Status:", existingOrder.status);

  if (query.vnp_ResponseCode === "00") {

    try {
      // Cập nhật đơn hàng
      const updatedOrder = await Order.findOneAndUpdate(
        { order_code: orderCode },
        {
          status: 'confirmed',
          updated_at: new Date(),
          paymentStatus: 'completed',
          paymentMethod: 'vnpay',
          paymentDetails: {
            transactionId: query.vnp_TransactionNo,
            bankCode: query.vnp_BankCode,
            paymentTime: query.vnp_PayDate,
            amount: query.vnp_Amount / 100
          }
        },
        { new: true }
      );

      console.log("✅ Cập nhật đơn hàng thành công:", orderCode);

      // Cập nhật tồn kho
      const orderController = require('../controller/controller_order');
      for (const item of updatedOrder.items) {
        const success = await orderController.updateProductStock(item, 'decrease', 'VNPay');
        if (!success) console.error(`❌ Không thể cập nhật tồn kho cho sản phẩm ID: ${item.id_product}`);
      }

      // Emit socket
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(updatedOrder.userId.toString()).emit('orderStatusUpdated', {
            orderId: updatedOrder._id,
            status: 'confirmed',
            message: 'Thanh toán thành công'
          });
        }
      } catch (socketError) {
        console.log("Socket notification error:", socketError.message);
      }

      // Lưu vào cache
      const amount = query.vnp_Amount / 100;
      const paymentResult = {
        status: 'success',
        orderId: orderCode,
        amount,
        transactionId: query.vnp_TransactionNo,
        timestamp: new Date().toISOString()
      };

      if (!global.paymentResults) global.paymentResults = {};
      global.paymentResults[orderCode] = paymentResult;

      // Trả HTML
      return res.send(`
        <html><body style="font-family:sans-serif;text-align:center;margin-top:50px">
          <h1 style="color:#16a34a; font-size: 36px;">✅ Thanh toán thành công!</h1>
          <p style="font-size: 24px;">Đơn hàng #${orderCode} - Số tiền: ${amount.toLocaleString()} VND</p>
          <a href="coolmate://payment-result?status=success&orderId=${orderCode}&amount=${amount}"
          style="padding:12px 20px; background:#0f766e; color:#fff; border-radius:6px; text-decoration:none;">
          Quay lại ứng dụng</a>
        </body></html>
      `);

    } catch (updateError) {
      console.error("❌ Lỗi cập nhật đơn hàng:", updateError);
      return res.redirect(`coolmate://payment-result?status=failed&message=UpdateError&orderId=${orderCode}`);
    }

  } 

  else {

    try {
      await Order.findOneAndUpdate(
        { order_code: orderCode },
        {
          status: 'Thanh toán thất bại',
          updated_at: new Date(),
          paymentStatus: 'failed',
          paymentDetails: {
            errorCode: query.vnp_ResponseCode,
            errorMessage: query.vnp_Message || 'Thanh toán thất bại'
          }
        }
      );
    } catch (updateError) {
      console.error("❌ Lỗi cập nhật trạng thái thất bại:", updateError);
    }

    const paymentResult = {
      status: 'failed',
      orderId: orderCode,
      errorCode: query.vnp_ResponseCode,
      errorMessage: query.vnp_Message || 'Thanh toán thất bại',
      timestamp: new Date().toISOString()
    };

    if (!global.paymentResults) global.paymentResults = {};
    global.paymentResults[orderCode] = paymentResult;

    return res.redirect(
      `coolmate://payment-result?status=failed&orderId=${orderCode}&errorCode=${query.vnp_ResponseCode}&errorMessage=${query.vnp_Message || 'Thanh toán thất bại'}`
    );
  }

}

else {
  return res.redirect(`coolmate://payment-result?status=failed&message=InvalidHash`);
}

});
// API kiểm tra trạng thái đơn hàng 
router.get('/check_order_status', async (req, res) => {
 try {
    const { order_code } = req.query;
    
    if (!order_code) {
      return res.status(400).json({
        success: false,
        message: "Thiếu order_code"
      });
    }

    const order = await Order.findOne({ order_code });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
        order_code: order_code
      });
    }

    res.json({
      success: true,
      order: {
        order_code: order.order_code,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        finalTotal: order.finalTotal,
        createdAt: order.createdAt,
        updated_at: order.updated_at,
        paymentDetails: order.paymentDetails
      }
    });

  } catch (error) {
    console.error("❌ check_order_status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái đơn hàng",
      error: error.message
    });
  }
});


module.exports = router;
