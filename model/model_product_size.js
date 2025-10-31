const mongoose = require('mongoose');

// Schema sản phẩm
const productSizeSchema = new mongoose.Schema({
    size: {
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
        default: 'M'
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    productCode: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'productModel'
    },
    productModel: {
        type: String,
        required: true,
        enum: ['product', 'sale_product']
    }

}, {
    timestamps: true
});

const ProductSize = mongoose.model('product_size', productSizeSchema);

module.exports = ProductSize;