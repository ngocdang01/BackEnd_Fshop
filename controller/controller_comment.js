const Comment = require("../model/model_comment");
const Product = require("../model/model_product");
const SaleProduct = require("../model/model_sale_product");
const Order = require("../model/model_order");
const mongoose = require("mongoose");
const { Types } = mongoose;

// HÀM PHỤ: cập nhật rating trung bình vào Product hoặc SaleProduct
async function updateProductRating(productId, type = "normal") {
  //Truy vấn tất cả comment của một sản phẩm theo productId và type
  const comments = await Comment.find({
     productId: new Types.ObjectId(productId),
     type
  });

  //Tính tổng số review.
  const totalReviews = comments.length;

  //Tính averageRating
  const averageRating = totalReviews > 0
      ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / totalReviews).toFixed(1)
     : 0;

  // Cập nhật điểm đánh giá và tổng lượt review cho sản phẩm
  let updated;
  if (type === "sale") {
    updated = await SaleProduct.findByIdAndUpdate(
      productId,
      { averageRating, totalReviews },
      { new: true }
    );
  } else {
    updated = await Product.findByIdAndUpdate(
      productId,
      { averageRating, totalReviews },
      { new: true }
    );
  }
  return updated;
}

// THÊM 1 COMMENT
exports.createComment = async (req, res) => {
  try {
   //Lấy các dữ liệu từ body request
    const { orderId, productId, userId, type, rating, content } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId không được để trống" });
    }

    //Đảm bảo đơn hàng tồn tại
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra sản phẩm có trong đơn hàng không
    const item = order.items.find(i => {
      const prodId = i.id_product?._id || i.id_product;
      return prodId?.toString() === productId;
    });
    if (!item) {
      return res.status(400).json({ message: "Sản phẩm không tồn tại trong đơn hàng" });
    }

    // Kiểm tra sản phẩm này đã được review chưa
    if (item.isReviewed) {
      return res.status(400).json({ message: "Sản phẩm này đã được đánh giá rồi" });
    }

    return res.status(201).json({
      message: " tạo 1 comment",
      data: { orderId, productId, userId, type, rating, content }

    });

  } catch (error) {
    console.error("Lỗi khi tạo comment:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// THÊM NHIỀU COMMENT 
exports.createMultipleComments = async (req, res) => {
  try {
    console.log(" createMultipleComments()");

    const { orderId, userId, reviews } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    if (!Array.isArray(reviews)) {
      return res.status(400).json({ message: "Không có đánh giá nào được gửi" });
    }

    return res.status(201).json({
      message: "Khung API tạo nhiều comment",
      total: reviews.length,
      reviews,
    });

  } catch (error) {
    console.error(" Lỗi khi tạo nhiều comment:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// LẤY CHI TIẾT SẢN PHẨM KÈM COMMENT 
exports.getProductDetailWithComments = async (req, res) => {
  try {
    console.log(" getProductDetailWithComments()");

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    return res.json({
      message: " lấy sản phẩm + bình luận",
      productId: id,
      comments: [],
    });

  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};



