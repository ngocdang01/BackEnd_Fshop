const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

    total: {
        type: Number,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    fullName: {
        type: String,
        required: true
    },

    status: {
        type: Boolean,
        default: false   // false: chưa thanh toán, true: đã thanh toán
    },

    typePayments: {
        type: String,
        enum: ['COD', 'VNPAY', 'MOMO'],
        required: true
    },

    paymentDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
