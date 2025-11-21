const mongoose = require('mongoose');
const { Schema } = mongoose;

const vnpaySchema = new Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },

        amount: {
            type: Number,
            required: true
        },

        orderInfo: {
            type: String,
            required: true
        },

        vnpTxnRef: {
            type: String,
            required: true
        },

        vnpTransactionNo: {
            type: String,
            default: null
        },

        vnpResponseCode: {
            type: String,
            default: null
        },

        vnpMessage: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'cancelled'],
            default: 'pending'
        },

        bankCode: {
            type: String,
            default: null
        },

        paymentMethod: {
            type: String,
            default: 'VNPAY'
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },

        returnUrl: {
            type: String,
            required: true
        },

        ipnUrl: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

vnpaySchema.index({ vnpTxnRef: 1 });
vnpaySchema.index({ status: 1 });
vnpaySchema.index({ userId: 1 });
vnpaySchema.index({ createdAt: -1 });

// ✅ Virtual field: hiển thị số tiền theo VNĐ
vnpaySchema.virtual('amountVND').get(function () {
  return this.amount / 100; // VNPay lưu số tiền ×100
});

// ✅ Method: cập nhật trạng thái giao dịch
vnpaySchema.methods.updateStatus = function (status, responseCode = null, message = null) {
  this.status = status;
  if (responseCode) this.vnpResponseCode = responseCode;
  if (message) this.vnpMessage = message;
  if (status === 'success') this.paidAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// ✅ Static method: tìm giao dịch theo orderId
vnpaySchema.statics.findByOrderId = function (orderId) {
  return this.findOne({ orderId });
};
module.exports = mongoose.model('VNPayTransaction', vnpaySchema);
