const SaleProduct = require('../model/model_sale_product');
const { Types} = require('mongoose');

// Lấy danh sách tất cả sản phẩm khuyến mãi
exports.getAllSaleProducts = async (req, res) => {
    try{
        const saleProducts = await SaleProduct.find();
        res.json(saleProducts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm khuyến mãi', error: error.message });
    }
}
// Tạo sản phẩm khuyến mãi mới
exports.createSaleProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            discount_percent,
            stock,
            sold = 0,
            description,
            images,
            size,
            colors,
            categoryCode,
            isDiscount = true
        } = req.body;

        // Validation
        if (!name || !price || !discount_percent || !stock || !description || !images || !Array.isArray(images) || !categoryCode) {
            return res.status(400).json({
                status: 400,
                message: 'Vui lòng nhập đầy đủ thông tin sản phẩm khuyến mãi'
            });
        }

        // Validate images array
        if (images.length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'Sản phẩm phải có ít nhất một hình ảnh'
            });
        }

        if (price <= 0) {
            return res.status(400).json({
                status: 400,
                message: 'Giá sản phẩm phải lớn hơn 0'
            });
        }

        if (discount_percent < 0 || discount_percent > 100) {
            return res.status(400).json({
                status: 400,
                message: 'Phần trăm giảm giá phải từ 0 đến 100'
            });
        }

        if (stock < 0) {
            return res.status(400).json({
                status: 400,
                message: 'Số lượng tồn kho không được âm'
            });
        }

        if (sold < 0) {
            return res.status(400).json({
                status: 400,
                message: 'Số lượng đã bán không được âm'
            });
        }

        // Validate size
        if (size && Array.isArray(size)) {
            const validSizes = ['S', 'M', 'L', 'XL'];
            const invalidSizes = size.filter(s => !validSizes.includes(s));
            if (invalidSizes.length > 0) {
                return res.status(400).json({
                    status: 400,
                    message: 'Kích thước không hợp lệ',
                    invalidSizes,
                    validSizes
                });
            }
        }

        // Validate colors
        if (colors && Array.isArray(colors)) {
            const validColors = ['Đen', 'Trắng', 'Xanh'];
            const invalidColors = colors.filter(color => !validColors.includes(color));
            if (invalidColors.length > 0) {
                return res.status(400).json({
                    status: 400,
                    message: 'Màu sắc không hợp lệ',
                    invalidColors,
                    validColors
                });
            }
        }

        // Tính discount_price
        const discount_price = Math.round(price * (1 - discount_percent / 100));

        const saleProduct = new SaleProduct({
            name,
            price,
            discount_percent,
            discount_price,
            stock,
            sold,
            description,
            images,
            size: size || ['M'],
            colors: colors || [],
            categoryCode,
            isDiscount
        });

        const savedSaleProduct = await saleProduct.save();

        res.status(201).json({
            status: 201,
            message: 'Tạo sản phẩm khuyến mãi thành công',
            data: savedSaleProduct
        });
    } catch (error) {
        console.error('Create sale product error:', error);
        res.status(500).json({
            status: 500,
            message: 'Lỗi khi tạo sản phẩm khuyến mãi',
            error: error.message
        });
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