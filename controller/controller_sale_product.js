const SaleProduct = require('../model/model_sale_product');
const { Types } = require('mongoose');

// Lấy danh sách tất cả sản phẩm khuyến mãi
exports.getAllSaleProducts = async (req, res) => {
    try {
      const saleProducts = await SaleProduct.find();
      res.json(saleProducts);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm khuyến mãi', error: error.message });
    }
  };

// Xóa sản phẩm khuyến mãi
exports.deleteSaleProduct = async (req, res) => {
    try {
        const objectId = new Types.ObjectId(req.params.id);
        const saleProduct = await SaleProduct.findByIdAndDelete(objectId);

        if (!saleProduct) {
            return res.status(404).json({
                status: 404,
                message: 'Không tìm thấy sản phẩm khuyến mãi'
            });
        }

        res.json({
            status: 200,
            message: 'Xóa sản phẩm khuyến mãi thành công'
        });
    } catch (error) {
        console.error('Delete sale product error:', error);
        res.status(500).json({
            status: 500,
            message: 'Lỗi khi xóa sản phẩm khuyến mãi',
            error: error.message
        });
    }
};
