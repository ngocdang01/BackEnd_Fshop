const { Router } = require('express');
const crypto = require('crypto');
const qs = require('querystring');
const moment = require('moment');
const Order = require('../model/model_order');
const Product = require('../model/model_product');
const SaleProduct = require('../model/model_sale_product');

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

  //  Check thiếu trường bắt buộc
  if (!query.vnp_ResponseCode || !query.vnp_Amount || !query.vnp_TxnRef) {
    return res.json({
      success: false,
      message: "Thiếu dữ liệu thanh toán",
      data: query
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
     
     // Kiểm tra đơn hàng có tồn tại không trước khi cập nhật
     const existingOrder = await Order.findOne({ order_code: orderCode });
     if (!existingOrder) {
       console.error(" Không tìm thấy đơn hàng với order_code:", orderCode);
       console.log(" Danh sách đơn hàng trong DB:");
       const allOrders = await Order.find({}, { order_code: 1, createdAt: 1 }).limit(10);
       console.log(allOrders);
       
       return res.redirect(`coolmate://payment-result?status=failed&message=OrderNotFound&orderId=${orderCode}`);
     }
     
     console.log(" Tìm thấy đơn hàng:", existingOrder.order_code, "Status:", existingOrder.status);

  

  if (responseCode === "00") {
    try {
       //  Cập nhật đơn hàng từ order_code
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

       // CẬP NHẬT TỒN KHO NGAY KHI THANH TOÁN THÀNH CÔNG
      console.log(`🔄 Cập nhật tồn kho cho đơn hàng VNPay: ${orderCode}`);
         
      // Import helper function từ controller_order
      const orderController = require('../controller/controller_order');

      for (const item of updatedOrder.items) {
       // Sử dụng helper function để cập nhật tồn kho
      const success = await orderController.updateProductStock(item, 'decrease', 'VNPay');
      if (!success) {
        console.error(`❌ Không thể cập nhật tồn kho cho sản phẩm ID: ${item.id_product}`);
      }
    }
    
    // Gửi socket notification 
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(updatedOrder.userId.toString()).emit
        ('orderStatusUpdated', {
          orderId: updatedOrder._id,
          status: 'confirmed',
          message: 'Thanh toán thành công'
        });
      }
     } catch (socketError) {
      console.log("Socket notification error:", socketError.message);
     }
     // Lưu kết quả thanh toán vào cache để FE có thể truy cập
     const amount = query.vnp_Amount / 100;
         const paymentResult = {
           status: 'success',
           orderId: orderCode,
           amount: amount,
           transactionId: query.vnp_TransactionNo,
           timestamp: new Date().toISOString()
         };
         
         // Lưu vào global cache 
         if (!global.paymentResults) global.paymentResults = {};
         global.paymentResults[orderCode] = paymentResult;
         
        const deeplink = `coolmate://payment-result?status=success&orderId=${orderCode}&amount=${amount}&transactionId=${query.vnp_TransactionNo}`;
         

    } catch (updateError) {
         console.error("❌ Lỗi cập nhật đơn hàng:", updateError);
         return res.redirect(`coolmate://payment-result?status=failed&message=UpdateError&orderId=${orderCode}`);
       }
  }
  else {
    // Cập nhật trạng thái thất bại
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
     // Lưu kết quả thất bại vào cache
       const paymentResult = {
         status: 'failed',
         orderId: orderCode,
         errorCode: query.vnp_ResponseCode,
         errorMessage: query.vnp_Message || 'Thanh toán thất bại',
         timestamp: new Date().toISOString()
       };
       
       if (!global.paymentResults) global.paymentResults = {};
       global.paymentResults[orderCode] = paymentResult;
       // Redirect về deeplink với thông tin thất bại
       return res.redirect(`coolmate://payment-result?status=failed&orderId=${orderCode}&errorCode=${query.vnp_ResponseCode}&errorMessage=${query.vnp_Message || 'Thanh toán thất bại'}`);
  } 
}else {
     //  Redirect về deeplink khi hash không hợp lệ
     return res.redirect(`coolmate://payment-result?status=failed&message=InvalidHash`);
   }
});

router.get('/check_order_status', (req, res) => {
  res.json({
    success: true,
    message: 'API kiểm tra trạng thái đơn hàng đang phát triển',
  });
});


module.exports = router;
