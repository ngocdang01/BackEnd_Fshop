const Product = require('../model/model_product');
const { Types } = require('mongoose'); // dùng đê convert _id ve objectID

// Lấy danh sách sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            message: 'Danh sách sản phẩm',
            data: products
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy sản phẩm',
            error: error.message
        });
    }
}
// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Product.findById(id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Không tìm thấy sản phẩm",
        data: []
      });
    }

    res.status(200).json({
      status: 200,
      message: "Đã tìm thấy sản phẩm",
      data: result
    });

  } catch (error) {
    console.error('Get product error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 400,
        message: "ID không hợp lệ",
        data: []
      });
    }
    res.status(500).json({
      status: 500,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const { name, price, stock, sold, description, images, size, colors, categoryCode } = req.body;
        if (!name || !price || !stock || !description || !images || !Array.isArray(images) || !size || !Array.isArray(size) || !categoryCode) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin sản phẩm, images, size và categoryCode hợp lệ' });
        }
        const product = new Product({ 
            name, 
            price, 
            stock, 
            sold: sold || 0, 
            description, 
            images, 
            size, 
            colors, 
            categoryCode 
        });
        const savedProduct = await product.save();

        res.status(201).json({ message: 'Tạo sản phẩm thành công', product: savedProduct });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo sản phẩm', error: error.message });
    }
 }
// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => { }
// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
        try {
            const objectId = new Types.ObjectId(req.params.id);
            const product = await Product.findByIdAndDelete(objectId);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    
            res.json({ message: 'Xóa sản phẩm thành công' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
        }
}
// Tìm kiếm sản phẩm
<<<<<<< HEAD
exports.searchProducts = async (req, res) => { }
=======
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, minPrice, maxPrice } = req.query;
    let query = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error("Search products error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tìm kiếm sản phẩm", error: error.message });
  }
};
// Lấy sản phẩm theo category_code
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryCode } = req.params;

    if (!categoryCode) {
      return res
        .status(400)
        .json({ message: " Trường Category code là bắt buộc" });
    }

    const products = await Product.find({
      categoryCode: { $regex: new RegExp(`^${categoryCode}$`, "i") },
    });

    if (products.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm nào cho category này",
        categoryCode: categoryCode,
        products: [],
      });
    }

    res.json({
      message: "Lấy sản phẩm theo category thành công",
      categoryCode: categoryCode,
      count: products.length,
      products: products,
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res
      .status(500)
      .json({
        message: "Lỗi khi lấy sản phẩm theo category",
        error: error.message,
      });
  }
};
>>>>>>> 157624f (fix products + test thanh cong)
