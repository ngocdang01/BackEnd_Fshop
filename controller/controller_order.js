const modelOrder = require('../model/model_order');
const Product = require('../model/model_product');
const SaleProduct = require('../model/model_sale_product');
const Voucher = require('../model/model_voucher');
const User = require('../model/model_user');

// ================= Helper: cập nhật tồn kho =================
const updateProductStock = async (item, operation = 'decrease', source = 'unknown') => {
  try {
    let product = await SaleProduct.findById(item.id_product);
    let isSaleProduct = false;

    if (product) isSaleProduct = true;
    else product = await Product.findById(item.id_product);

    if (!product) {
      console.error(`❌ Không tìm thấy sản phẩm ID: ${item.id_product}`);
      return false;
    }

    if (operation === 'decrease' && product.stock < item.purchaseQuantity) {
      console.error(`❌ Sản phẩm "${product.name}" không đủ hàng để giảm tồn`);
      return false;
    }

    const stockChange = operation === 'decrease' ? -item.purchaseQuantity : item.purchaseQuantity;
    const soldChange = operation === 'decrease' ? item.purchaseQuantity : -item.purchaseQuantity;

    const targetModel = isSaleProduct ? SaleProduct : Product;

    await targetModel.findByIdAndUpdate(item.id_product, {
      $inc: { stock: stockChange, sold: soldChange }
    });

    console.log(`✅ ${operation === 'decrease' ? 'Giảm' : 'Tăng'} tồn kho cho ${isSaleProduct ? 'sản phẩm giảm giá' : 'sản phẩm thường'}: ${product.name} (${source})`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi cập nhật tồn kho:`, error);
    return false;
  }
};
const orderController = {

  // [POST] /api/orders
  createOrder: async (req, res) => {
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

      // ✅ Kiểm tra thông tin đầu vào
      if (!userId || !items || !paymentMethod || !shippingAddress) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng không được rỗng" });
      }

      // ✅ Kiểm tra tồn kho từng sản phẩm
      for (const item of items) {
        if (!item.id_product || !item.purchaseQuantity || !item.size) {
          return res.status(400).json({
            message: "Thiếu thông tin sản phẩm (id_product, purchaseQuantity, size)"
          });
        }

        let productExists = await Product.findById(item.id_product);
        let isSaleProduct = false;

        if (!productExists) {
          productExists = await SaleProduct.findById(item.id_product);
          isSaleProduct = true;
        }

        if (!productExists) {
          return res.status(404).json({ message: `Không tìm thấy sản phẩm ID ${item.id_product}` });
        }

        if (productExists.stock < item.purchaseQuantity) {
          return res.status(400).json({
            message: `Sản phẩm "${productExists.name}" chỉ còn ${productExists.stock} trong kho.`,
            productId: item.id_product,
            productName: productExists.name,
            availableStock: productExists.stock,
            requestedQuantity: item.purchaseQuantity,
          });
        }

        item.isSaleProduct = isSaleProduct;
      }

      // ✅ Tính tổng tiền đơn hàng
      let totalPrice = 0;
      const updatedItems = [];

      for (const item of items) {
        let product = await Product.findById(item.id_product);
        let isSaleProduct = false;

        if (!product) {
          product = await SaleProduct.findById(item.id_product);
          isSaleProduct = true;
        }

        if (!product) {
          return res.status(404).json({ message: `Không tìm thấy sản phẩm ID ${item.id_product}` });
        }

        const finalPrice = isSaleProduct ? product.discount_price : product.price;

        updatedItems.push({
          ...item,
          price: finalPrice,
          originalPrice: product.price,
          isSaleProduct,
          discount_percent: isSaleProduct ? product.discount_percent : 0,
          images: product.images || [],
          size: item.size || null,
        });

        totalPrice += finalPrice * item.purchaseQuantity;
      }

      // ✅ Áp dụng voucher
      let discountAmount = 0;
      let voucherData = null;

      if (voucher?.voucherId) {
        const voucherDoc = await Voucher.findById(voucher.voucherId);
        const now = new Date();

        if (voucherDoc && voucherDoc.status === 'active' && now >= voucherDoc.startDate && now <= voucherDoc.expireDate) {
          if (voucherDoc.type === 'percentage') {
            discountAmount = totalPrice * (voucherDoc.discount / 100);
            discountAmount = Math.min(discountAmount, voucherDoc.maxDiscount);
          } else if (voucherDoc.type === 'fixed') {
            discountAmount = voucherDoc.discount;
          } else if (voucherDoc.type === 'shipping') {
            discountAmount = shippingFee;
          }

          voucherData = {
            voucherId: voucherDoc._id,
            code: voucher.code || voucherDoc.code,
            discountAmount
          };
        }
      }

      const finalTotal = totalPrice + shippingFee - discountAmount;

      // ✅ Tạo đơn hàng
      const newOrder = new modelOrder({
        userId,
        items: updatedItems,
        order_code,
        totalPrice,
        shippingFee,
        voucher: voucherData,
        finalTotal,
        paymentMethod,
        shippingAddress,
        status: 'waiting',
      });

      const savedOrder = await newOrder.save();

      return res.status(201).json({
        message: "Tạo đơn hàng thành công",
        data: savedOrder
      });

    } catch (error) {
      console.error("❌ createOrder error:", error);
      return res.status(500).json({ message: "Lỗi server khi tạo đơn hàng", error: error.message });
    }
  },

  // [PUT] /api/orders/:id/status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await modelOrder.findById(id);
      if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

      const oldStatus = order.status;

      if (status === 'confirmed' && oldStatus === 'waiting') {
        for (const item of order.items) {
          await updateProductStock(item, 'decrease', 'confirm');
        }
      }

      order.status = status;
      await order.save();

      if (status === "shipped") {
      setTimeout(async () => {
        const checkOrder = await modelOrder.findById(id);
        if (checkOrder && checkOrder.status === "shipped") {
          checkOrder.status = "delivered";
          await checkOrder.save();
          console.log(`✅ Đơn hàng ${id} tự động cập nhật sang delivered sau 40 giây`);
        }
      }, 40000); 
    }

    const io = req.app.get('io');
    if (io) {
      const room = `order_${order.userId}`;
      io.to(room).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.status,
      });
      console.log(`📡 Gửi socket "orderStatusUpdated" tới room: ${room}`);
    }

    return res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("❌ updateStatus error:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật trạng thái", error: error.message });
  }
},
// [POST] /api/orders/:id/confirm-cod
confirmCODPayment: async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount } = req.body;

    const order = await modelOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({ message: "Đơn hàng này không phải thanh toán khi nhận hàng" });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: "Chỉ có thể xác nhận thanh toán khi đơn hàng đã được giao" });
    }

    if (paymentAmount < order.finalTotal) {
      return res.status(400).json({
        message: "Số tiền thanh toán không đủ",
        required: order.finalTotal,
        provided: paymentAmount
      });
    }

    // Nếu chưa trừ tồn kho, trừ lại
    if (order.paymentStatus !== 'completed') {
      console.log(`🔄 Cập nhật tồn kho cho đơn hàng COD thanh toán: ${order.order_code}`);
      for (const item of order.items) {
        const success = await updateProductStock(item, 'decrease', 'COD-payment');
        if (!success) {
          return res.status(400).json({
            message: `Không thể cập nhật tồn kho cho sản phẩm ID: ${item.id_product}`
          });
        }
      }
    } else {
      console.log(`ℹ️ Đơn hàng ${order.order_code} đã được thanh toán, bỏ qua cập nhật tồn kho`);
    }

    // Cập nhật trạng thái thanh toán
    order.paymentStatus = 'completed';
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId: `COD-${Date.now()}`,
      paymentTime: new Date().toISOString(),
      amount: paymentAmount
    };

    const updatedOrder = await order.save();

    // Emit socket realtime 
    const io = req.app.get('io');
    if (io) {
      const userId = order.userId?.toString();
      const orderRoom = `order_${userId}`;
      io.to(orderRoom).emit('orderStatusUpdated', {
        orderId: updatedOrder._id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        message: `Đơn hàng #${order.order_code} đã được thanh toán COD thành công.`
      });
      console.log(`📢 Gửi socket COD thanh toán thành công đến phòng: ${orderRoom}`);
    }

    return res.status(200).json({
      message: "Thanh toán COD thành công",
      data: updatedOrder
    });

  } catch (error) {
    console.error("❌ confirmCODPayment error:", error);
    return res.status(500).json({ message: "Lỗi khi xác nhận thanh toán COD", error: error.message });
  }
},



};

module.exports = orderController;
