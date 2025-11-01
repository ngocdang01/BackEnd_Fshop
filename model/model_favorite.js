const db = require("./db");
const mongoose = require('mongoose');

const favoriteSchema = new db.mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  product: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});
const Favorite = db.mongoose.model('favorites', favoriteSchema);
module.exports = Favorite;