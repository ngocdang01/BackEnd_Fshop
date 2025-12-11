const modelOrder = require('../model/model_order');
const Product = require('../model/model_product');
const SaleProduct = require('../model/model_sale_product');
const Voucher = require('../model/model_voucher');
const User = require('../model/model_user');
const ProductSize = require('../model/model_product_size');
const modelNotification = require('../model/model_notification');

// Helper: Cập nhật tồn kho sản phẩm
const updateProductStock = async (item, operation = 'decrease', source = 'unknown') => {
  try {
    let product = await SaleProduct.findById(item.id_product);
    let isSaleProduct = false;
    
    if (product) {
      isSaleProduct = true;
    } else {
      product = await Product.findById(item.id_product);
    }

    if (!product) {
      console.error(`❌ Không tìm thấy sản phẩm ID: ${item.id_product}`);
      return false;
    }

    if (operation === 'decrease' && product.stock < item.purchaseQuantity) {
      console.error(`❌ Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ cho ${item.purchaseQuantity} sản phẩm`);
      return false;
    }

    const quantityChange = operation === 'decrease' ? -item.purchaseQuantity : item.purchaseQuantity;
    const soldChange = operation === 'decrease' ? item.purchaseQuantity : -item.purchaseQuantity;

    if (isSaleProduct) {
      await SaleProduct.findByIdAndUpdate(item.id_product, {
        $inc: { 
          sold: soldChange,
          stock: quantityChange
        }
      });
      await ProductSize.findOneAndUpdate({productCode: item.id_product,  size: item.size }, {
        $inc: { 
          quantity: quantityChange
        }
      });
      console.log(`✅ Đã ${operation === 'decrease' ? 'giảm' : 'tăng'} tồn kho sản phẩm giảm giá: ${product.name} (${source})`);
    } else {
      await Product.findByIdAndUpdate(item.id_product, {
        $inc: { 
          sold: soldChange,
          stock: quantityChange
        }
      });
      await ProductSize.findOneAndUpdate({productCode: item.id_product,  size: item.size }, {
        $inc: { 
          quantity: quantityChange
        }
      });
      console.log(`✅ Đã ${operation === 'decrease' ? 'giảm' : 'tăng'} tồn kho sản phẩm thường: ${product.name} (${source})`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Lỗi cập nhật tồn kho cho sản phẩm ${item.id_product}:`, error);
    return false;
  }
};

// Helper: populate chi tiết sản phẩm cho từng đơn
const populateProductDetails = async (order) => {
  try {
    const populatedItems = await Promise.all(
      order.items.map(async (item) => {
        let product = await Product.findById(item.id_product).select('name images price size colors');
        if (!product) {
          product = await SaleProduct.findById(item.id_product).select('name images price discount_price discount_percent size colors');
          if (product) {
            product = product.toObject();
            product.isSaleProduct = true;
          }
        }

        return {

          ...item.toObject(),   // ✔ Không dùng item.toObject()

          productDetails: product,
          images: item.images || product?.images || []
        };
      })
    );

    return {
      ...order.toObject(),
      items: populatedItems
    };
  } catch (error) {
    console.error('❌ Lỗi khi populate chi tiết sản phẩm:', error);
    return order;
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
        if (!item.id_product || !item.name || !item.purchaseQuantity || !item.price ||  !item.size) {
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

        if (voucher?.voucherId) {
            const voucherDoc = await Voucher.findById(voucher.voucherId);
            const now = new Date();
            if (!voucherDoc) {
              return res.status(404).json({ message: "Voucher không tồn tại" });
            }
            if (voucherDoc.status !== 'active') {
              return res.status(400).json({ message: "Voucher không hoạt động" });
            }
            if (now < voucherDoc.startDate) {
              return res.status(400).json({ message: "Voucher chưa bắt đầu" });
            }
            if (now > voucherDoc.expireDate) {
              return res.status(400).json({ message: "Voucher đã hết hạn" });
            }
            if (totalPrice < voucherDoc.minOrderAmount) {
              return res.status(400).json({
                message: `Đơn hàng phải đạt tối thiểu ${voucherDoc.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng voucher này`
              });
            }
            discountAmount = Math.min(shippingFee, voucherDoc.discount);

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
// socket io
let io = null;
if (req && req.app && typeof req.app.get === 'function') {
  io = req.app.get('io');
}

const orderCode = savedOrder.order_code || savedOrder._id;
const message = `Bạn đã đặt đơn hàng thành công với mã đơn hàng: #${orderCode}.`;

if (io) {
  io.to(`notification_${userId}`).emit('notification received', {
    title: 'Đơn hàng mới',
    message,
    type: 'order',
    data: { orderId: savedOrder._id },
  });
}

try {
  await modelNotification.create({
    userId,
    title: 'Đơn hàng mới',
    message,
    type: 'order',
    isRead: false,
    data: { orderId: savedOrder._id },
  });
} catch (notificationError) {
  console.error("❌ Lỗi tạo notification:", notificationError);
}

      return res.status(201).json({
        message: "Tạo đơn hàng thành công",
        data: savedOrder
      });

    } catch (error) {
      console.error("❌ createOrder error:", error);
      return res.status(500).json({ message: "Lỗi server khi tạo đơn hàng", error: error.message });
    }
  },
      // [GET] /api/orders
getAllOrders: async (req, res) => {
  try {
    console.log("🔍 Fetching all orders...");

    const orders = await modelOrder.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    console.log(`📦 Found ${orders.length} orders`);

    const populatedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            return await populateProductDetails(order);
          } catch (populateError) {
            console.error(`❌ Error populating order ${order._id}:`, populateError.message);
            return order;
          }
        })
      );

      return res.status(200).json({ data: populatedOrders });
  } catch (error) {
    console.error("❌ getAllOrders error:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message
    });
  }
},
// [GET] /api/orders/:id
getOrderById: async (req, res) => {
  try {
    const order = await modelOrder.findById(req.params.id)
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const populatedOrder = await populateProductDetails(order);

    return res.status(200).json({ data: populatedOrder });
  } catch (error) {
    console.error("❌ getOrderById error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy đơn hàng", error: error.message });
  }
},

// [GET] /api/orders/user/:userId
getOrdersByUserId: async (req, res) => {
  try {
    const orders = await modelOrder.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        try {
          return await populateProductDetails(order);
        } catch (populateError) {
          console.error(`❌ Lỗi populate đơn ${order._id}:`, populateError.message);
          return order;
        }
      })
    );

    return res.status(200).json({ data: populatedOrders });
  } catch (error) {
    console.error("❌ getOrdersByUserId error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy đơn theo user", error: error.message });
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
       const isPaid = order.paymentStatus === 'completed' || order.paymentMethod === 'vnpay';
      if (!isPaid && order.paymentMethod === 'cod') {
        console.log(`🔽 Trừ kho vì COD xác nhận đơn: ${order.order_code}`);
        for (const item of order.items) {
        const success =  await updateProductStock(item, 'decrease', 'COD-confirm');
        if (!success) {
              return res.status(400).json({
                message: `Không thể cập nhật tồn kho cho sản phẩm ID: ${item.id_product}`
              });
            }
        }
      } else if (isPaid) {
          console.log(`ℹ️ Đơn hàng ${order.order_code} đã được thanh toán (${order.paymentMethod}), bỏ qua cập nhật tồn kho`);
        } else {
          console.log(`ℹ️ Đơn hàng ${order.order_code} không phải COD, bỏ qua cập nhật tồn kho`);
        }
    }

    if (status === 'cancelled' && ['confirmed', 'shipped', 'pending'].includes(oldStatus)) {
      console.log(`🔁 Hoàn kho do đơn bị hủy: ${order.order_code}`);
      for (const item of order.items) {
        await updateProductStock(item, 'increase', 'cancel');
      }
    }

    const updatedOrder = await modelOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
 
    const io = req.app.get('io');
    const populatedOrder = await modelOrder.findById(updatedOrder._id)
  .populate('userId')
  .lean();

const orderWithProductDetails = await populateProductDetails(populatedOrder);

const userId = orderWithProductDetails.userId?._id?.toString();
const orderRoom = `order_${userId}`;
const notificationRoom = `notification_${userId}`;

const translateOrderStatus = (s) => {
  const statusMap = {
    pending: "Đang chờ xử lý",
    confirmed: "Đã xác nhận",
    shipped: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy"
  };
  return statusMap[s] || s;
};

const message = `Đơn hàng #${orderWithProductDetails.order_code || orderWithProductDetails._id} đã được cập nhật sang trạng thái: ${translateOrderStatus(status)}.`;

// Emit cập nhật trạng thái đơn
if (io && userId) {
  io.to(orderRoom).emit('orderStatusUpdated', {
    orderId: updatedOrder._id,
    status: updatedOrder.status,
    fullOrder: orderWithProductDetails
  });

  // Lưu DB notification
  const noti = await modelNotification.create({
    userId,
    title: 'Cập nhật đơn hàng',
    message,
    type: 'order',
    isRead: false,
    data: { orderId: updatedOrder._id, status },
  });

  // Emit thông báo
  io.to(notificationRoom).emit('notification received', noti.toObject());

  console.log('📤 Gửi notification đến phòng:', notificationRoom);
  console.log('📨 Nội dung:', noti.toObject());
}

    return res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedOrder
    });

  } catch (error) {
    console.error("❌ updateStatus error:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật trạng thái", error: error.message });
  }
},


};

module.exports = orderController;
// Helper export
module.exports.updateProductStock = updateProductStock;