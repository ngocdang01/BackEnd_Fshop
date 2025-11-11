const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    id_product: {
      type: Schema.Types.ObjectId,
      ref: 'product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    purchaseQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    images: {
      type: [String],
      default: []
    },
    size: {
      type: String,
      default: null
    },
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const voucherSchema = new Schema(
  {
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'voucher',
      required: true
    },
    code: {
      type: String,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    order_code: {
      type: String,
      unique: true,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    voucher: {
      type: voucherSchema,
      default: null
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cod', 'online', 'vnpay', 'momo', 'zalopay']
    },
    shippingAddress: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: [
        'waiting',
        'pending',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled'
      ],
      default: 'waiting'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Tự tạo mã đơn hàng nếu chưa có
orderSchema.pre('save', function (next) {
  if (!this.order_code) {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
      date.getDate()
    )}`;
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.order_code = `ORD-${ymd}-${random}`;
  }
  next();
});

const Order = mongoose.model('order', orderSchema);
module.exports = Order;
