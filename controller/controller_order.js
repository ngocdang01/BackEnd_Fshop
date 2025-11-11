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

    // Validate thông tin đầu vào
    if (!userId || !items || !paymentMethod || !shippingAddress) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Kiểm tra người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Validate danh sách sản phẩm
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng không được rỗng" });
    }

    // Kiểm tra tồn kho & thông tin từng sản phẩm
    for (const item of items) {
      if (!item.id_product || !item.name || !item.purchaseQuantity || !item.price || !item.size) {
        return res.status(400).json({ message: "Mỗi sản phẩm cần đủ thông tin id_product, name, purchaseQuantity, price" });
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

    // Tạm thời chỉ trả kết quả kiểm tra OK
    return res.status(200).json({ message: "Dữ liệu hợp lệ, đủ hàng để đặt" });

  } catch (error) {
    console.error("❌ createOrder error:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo đơn hàng", error: error.message });
  }
},


};
module.exports = orderController;
