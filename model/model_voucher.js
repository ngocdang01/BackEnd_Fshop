const db = require('./db');

const voucherSchema = new db.mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    label: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['shipping'],
        default: "shipping",
        required: true
    },
    minOrderAmount: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    expireDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

voucherSchema.index({ status: 1 });
voucherSchema.index({ startDate: 1, expireDate: 1 });

const Voucher = db.model('voucher', voucherSchema);
module.exports = Voucher;