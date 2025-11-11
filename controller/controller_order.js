const modelOrder = require('../model/model_order');



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
    // Kiểm tra tồn kho & thông tin từng sản phẩm
    for (const item of items) {
      if (!item.id_product || !item.name || !item.purchaseQuantity || !item.price || !item.size) {
        return res.status(400).json({
          message: "Mỗi sản phẩm cần đủ thông tin id_product, name, purchaseQuantity, price, size"
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
          message: `Sản phẩm "${productExists.name}" chỉ còn ${productExists.stock} trong kho, không đủ cho ${item.purchaseQuantity} sản phẩm`,
          productId: item.id_product,
          productName: productExists.name,
          availableStock: productExists.stock,
          requestedQuantity: item.purchaseQuantity,
          isSaleProduct: isSaleProduct
        });
      }

      item.isSaleProduct = isSaleProduct;
    }

    let totalPrice = 0;
    const updatedItems = [];

    // Tính tổng giá & gán thông tin chi tiết sản phẩm
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

      const updatedItem = {
        ...item,
        price: finalPrice,
        originalPrice: product.price,
        isSaleProduct,
        discount_percent: isSaleProduct ? product.discount_percent : 0,
        images: product.images || [],
        size: item.size || null,
      };

      updatedItems.push(updatedItem);

      if (product.stock > 0) {
        totalPrice += finalPrice * item.purchaseQuantity;
      }
    }

    let discountAmount = 0;
    let voucherData = null;

    if (voucher?.voucherId) {
      const voucherDoc = await Voucher.findById(voucher.voucherId);

      if (voucherDoc) {
        if (voucherDoc.type === 'percentage') {
          discountAmount = totalPrice * (voucherDoc.discount / 100);
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

    const finalTotal = totalPrice - discountAmount;

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



};
module.exports = orderController;
