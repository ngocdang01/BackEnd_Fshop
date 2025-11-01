const Cart = require('../model/model_cart');
const Product = require('../model/model_product');
const SaleProduct = require('../model/model_sale_product');
const ProductSize = require("../model/model_product_size");

// [GET] /api/carts/:user_id
const getCartByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    let cartRaw = await Cart.findOne({ user_id });

    if (!cartRaw) {
       // Nếu chưa có giỏ hàng thì tạo mới luôn với mảng items rỗng
      cartRaw = await Cart.create({ user_id, items: [] });
      cartRaw = await Cart.findOne({ user_id }).populate('items.product_id');// Lấy lại có populate
    }

    const normalItems = cartRaw.items.filter(item => item.type !== 'sale');
    const saleItems = cartRaw.items.filter(item => item.type === 'sale');

    const populatedNormalCart = await Cart.findOne({ user_id })
      .populate({
        path: 'items.product_id',
        match: { _id: { $in: normalItems.map(i => i.product_id) } }
      });

    const detailedSaleItems = await Promise.all(
      saleItems.map(async (item) => {
        const product = await SaleProduct.findById(item.product_id);
        return {
          ...item.toObject(),
          product_id: product,// gán đầy đủ dữ liệu vào product_id giống populate
        };
      })
    );

    const mergedItems = [
      ...populatedNormalCart.items.filter(item => item.product_id),
      ...detailedSaleItems
    ];

    res.json({
      success: true,
      data: {
        _id: cartRaw._id,
        user_id: cartRaw.user_id,
        items: mergedItems,
        updated_at: cartRaw.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// [POST] /api/carts
const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity, size,  type } = req.body;

    if (!user_id || !product_id || !quantity || !size || !type) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const productModel = type === 'sale' ? SaleProduct : Product;
    const product = await productModel.findById(product_id); //Dùng đúng model theo type

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user_id });

    const newItem = {
      product_id,
      quantity,
      size,
      type //Lưu type để sau còn biết lấy từ bảng nào
    };

    if (!cart) {
      cart = await Cart.create({
        user_id,
        items: [newItem]
      });
    } else {
      const existingItem = cart.items.find(
        item => item.product_id.equals(product_id) && item.size === size  && item.type === type 
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push(newItem);
      }

      cart.updated_at = new Date();
      await cart.save();
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('❌ addToCart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// [PUT] /api/carts/:user_id/item
const updateItemQuantity = async (req, res) => {
  console.log("req.params", req.params)
  try {
    const { user_id } = req.params;
    const { product_id, size, quantity, type } = req.body;
    console.log("user_id", user_id)
    console.log("product_id", product_id)
    console.log("size", size)
    console.log("quantity", quantity)
    console.log("type", type)

    if (!user_id || !product_id || !size || !type) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
    }

    const cart = await Cart.findOne({ user_id });
  

    const item = cart.items.find(
      (item) =>
        item.product_id.equals(product_id) &&
        item.size === size &&
        item.type === type
    );

    

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) =>
          !(item.product_id.equals(product_id) && item.size === size &&  item.type === type)
      );
    } else {
      const checkSize = await ProductSize.findOne({
        productCode: product_id, 
        size: size,              
      });

      if (!checkSize) {
        return res.status(404).json({ success: false, message: 'Kích thước sản phẩm không tồn tại' });
      }
      if (checkSize.quantity < quantity) {
        return res.status(200).json({ success: false, message: 'Số lượng trong kho không đủ' });
      }

      item.quantity = quantity;
    }

    cart.updated_at = new Date();
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCartByUserId,
  addToCart,
  updateItemQuantity
};