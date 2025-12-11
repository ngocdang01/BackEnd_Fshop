const Product = require("../model/model_product");
const ProductSize = require("../model/model_product_size");
const Comment = require('../model/model_comment');
const { Types } = require("mongoose"); // dùng đê convert _id ve objectID

// Lấy danh sách sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryCode",
          foreignField: "code",
          as: "categoryData"
        }
      },
      { 
        $unwind: { 
          path: "$categoryData", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      {
        $lookup: {
          from: "product_sizes",
          let: { productId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ["$productCode", "$$productId"] },
                productModel: "product"
              }
            }
          ],
          as: "sizes"
        }
      },
      {
        $addFields: {
          categoryIsActive: "$categoryData.isActive"
        }
      }
    ]);

    res.json(products);
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm",
      error: error.message,
    });
  }
};
exports.getActiveProducts = async (req, res) => {
    try {
        const activeProducts = await Product.find({ isActive: true }).populate("sizes");
        res.json(activeProducts);
    } catch (error) {
        console.error("Get active products error:", error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm đang hoạt động', error: error.message });
    }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: "ID không hợp lệ",
      });
    }

    const product = await Product.findById(id).populate("sizes");

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    const isAdmin = req.query.admin === "true";

    if (!product.isActive && !isAdmin) {
      return res.status(403).json({
        message: "Sản phẩm tạm thời không khả dụng",
      });
    }
    res.json({
      status: 200,
      data: product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};


// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      sold,
      description,
      images,

      categoryCode,
      size_items
    } = req.body;

    if (
      !name ||
      !price ||
      !stock ||
      !description ||
      !images ||
      !Array.isArray(images) ||

      !categoryCode
    ) {
      return res
        .status(400)
        .json({
          message:
            "Vui lòng nhập đầy đủ thông tin sản phẩm, images, size và categoryCode hợp lệ",
        });

    }

    // Validate images array
    if (images.length === 0) {
      return res
        .status(400)
        .json({ message: "Sản phẩm phải có ít nhất một hình ảnh" });
    }



    const product = new Product({
      name,
      price,
      stock,
      sold: sold || 0,
      description,
      images,

      categoryCode,
    });
    const savedProduct = await product.save();
    const productId = savedProduct._id;


    const sizeEntries = size_items.map(item => ({
            size: item.size,
            quantity: item.quantity,
            productCode: productId,
            productModel: 'product'
        }));
    await ProductSize.insertMany(sizeEntries);


    res
      .status(201)
      .json({ message: "Tạo sản phẩm thành công", product: savedProduct });
  } catch (error) {
    console.error("Create product error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tạo sản phẩm", error: error.message });
  }
};
// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      sold,
      description,
      images,
      size,
      categoryCode,
      size_items


    } = req.body;
    const objectId = new Types.ObjectId(req.params.id);

    const product = await Product.findById(objectId);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (price !== undefined && price <= 0) {
      return res.status(400).json({ message: "Giá sản phẩm phải lớn hơn 0" });
    }

    if (stock !== undefined && stock < 0) {
      return res
        .status(400)
        .json({ message: "Số lượng tồn kho không được âm" });
    }

    if (sold !== undefined && sold < 0) {
      return res.status(400).json({ message: "Số lượng đã bán không được âm" });
    }

    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res
          .status(400)
          .json({ message: "Sản phẩm với tên này đã tồn tại" });
      }
    }

    // Validate images array if provided
    if (images && Array.isArray(images)) {
      if (images.length === 0) {
        return res
          .status(400)
          .json({ message: "Sản phẩm phải có ít nhất một hình ảnh" });
      }
    }


    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (sold !== undefined) product.sold = sold;
    if (description) product.description = description;
    if (images && Array.isArray(images)) product.images = images;
    if (size && Array.isArray(size)) product.size = size;

    if (categoryCode) product.categoryCode = categoryCode;

    const updatedProduct = await product.save();

    const productId = updatedProduct._id;

    await ProductSize.deleteMany({ productCode: productId, productModel: 'product' });

    const sizeEntries = size_items.map(item => ({
            size: item.size,
            quantity: item.quantity,
            productCode: productId,
            productModel: 'product'
        }));
        await ProductSize.insertMany(sizeEntries);

    res.json({
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật sản phẩm", error: error.message });
  }
};
// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const objectId = new Types.ObjectId(req.params.id);
    const product = await Product.findByIdAndDelete(objectId);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Delete product error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
  }
};
// Tìm kiếm sản phẩm
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

    const category = await Category.findOne({ code: categoryCode.toLowerCase() });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    if (!category.isActive) {
      return res.status(403).json({
        success: false,
        message: "Danh mục này đang bị vô hiệu hóa",
        products: []
      });
    }

    const products = await Product.find({ 
      categoryCode: category.code,
      isActive: true,
      isDeleted: false
    }).populate("sizes");


    // if (products.length === 0) {
    //   return res.status(404).json({
    //     message: "Không tìm thấy sản phẩm nào cho category này",
    //     categoryCode: categoryCode,
    //     products: [],
    //   });
    // }

    res.json({
      success: true,
      message: "Lấy sản phẩm theo category thành công",
      categoryCode: category.name,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get products by category error:", error);

    res.status(500).json({
      message: "Lỗi khi lấy sản phẩm theo category",
      error: error.message,
    });

  }
};
// Cập nhật tồn kho
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const objectId = new Types.ObjectId(req.params.id);

        const product = await Product.findById(objectId);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (stock < 0) {
            return res.status(400).json({ message: 'Số lượng tồn kho không hợp lệ' });
        }
        product.stock = stock;
        const updatedProduct = await product.save();
        res.json({ message: 'Cập nhật số lượng tồn kho thành công', product: updatedProduct });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật số lượng tồn kho', error: error.message });
    }
};
// Cập nhật số lượng đã bán
exports.updateSoldQuantity = async (req, res) => {
    try {
        const { sold } = req.body;
        const objectId = new Types.ObjectId(req.params.id);

        const product = await Product.findById(objectId);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (sold < 0) {
            return res.status(400).json({ message: 'Số lượng đã bán không hợp lệ' });
        }

        const total = product.stock + product.sold;

        if (sold > total) {
            return res.status(400).json({
                message: `Số lượng đã bán không được vượt quá tổng số sản phẩm (${total})`
            });
        }

        // Điều chỉnh stock theo sold mới
        product.stock = total - sold;
        product.sold = sold;

        const updatedProduct = await product.save();

        res.json({ 
          message: 'Cập nhật số lượng đã bán thành công',
           product: updatedProduct 
          });
    } catch (error) {
        console.error('Update sold quantity error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật số lượng đã bán', error: error.message });
    }
};
// Lấy chi tiết sản phẩm kèm bình luận
exports.getProductDetailWithComments = async (req, res) => {
    try {
      const objectId = new Types.ObjectId(req.params.id);
      const product = await Product.findById(objectId).populate('sizes');
      
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
  
      // Lấy comment kèm thông tin user (name, avatar)
      const comments = await Comment.find({ productId: objectId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name avatar'); 
        // Lưu ý: userId trong model Comment phải là ObjectId ref tới User
  
      res.json({
        product,
        comments: comments.map(c => ({
          _id: c._id,
          content: c.content,
          rating: c.rating,
          createdAt: c.createdAt,
          user: c.userId ? {
            _id: c.userId._id,
            name: c.userId.name,
            avatar: c.userId.avatar
          } : {
            name: 'Người dùng',
            avatar: 'https://i.pinimg.com/736x/bc/43/98/bc439871417621836a0eeea768d60944.jpg'
          }
        }))
      });
  
    } catch (error) {
      console.error('Get product detail with comments error:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy chi tiết sản phẩm kèm bình luận',
        error: error.message
      });
    }
  };
  // Toggle trạng thái sản phẩm (active / inactive)
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        product.isActive = !product.isActive;
        await product.save();
        res.json({
            message: `Sản phẩm đã được ${product.isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
            product
        });
    } catch (error) {
        console.error("Toggle product status error:", error);
        res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái sản phẩm', error: error.message });
    }
};
