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
      Cart.create({ user_id, items: [] });
      cartRaw = await Cart.findOne({ user_id }).populate('items.product_id');
    }

    const normalItems = cartRaw.items.filter(item => item.type === 'sale');
    const saleItems = cartRaw.items.filter(item => item.type !== 'sale');

    const populatedNormalCart = await Cart.findOne({ user_id })
      .populate({
        path: 'items.product_id',
        match: { _id: { $in: saleItems.map(i => i.product_id) } }
      });

    const detailedSaleItems = await Promise.all(
      saleItems.map(async (item) => {
        const product = await SaleProduct.findById(item.product_id);
        return {
          ...item.toObject(),
          product_id: product,
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
