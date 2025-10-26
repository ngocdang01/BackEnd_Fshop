const SaleProduct = require("../model/model_sale_product");
const { Types } = require("mongoose");

// Lấy danh sách tất cả sản phẩm khuyến mãi
exports.getAllSaleProducts = async (req, res) => {
  try {
    const saleProducts = await SaleProduct.find();
    res.json(saleProducts);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm khuyến mãi",
      error: error.message,
    });
  }
};
// Lấy chi tiết sản phẩm khuyến mãi theo ID
exports.getSaleProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: "ID không hợp lệ",
        data: null,
      });
    }

    const objectId = new Types.ObjectId(id);
    const result = await SaleProduct.findById(objectId);

    if (!result) {
      res.json({
        status: 200,
        message: "Đã tìm thấy sản phẩm khuyến mãi",
        data: result,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Không tìm thấy sản phẩm khuyến mãi",
        data: null,
      });
    }
  } catch (error) {
    console.error("Get sale product error:", error);
    res.status(500).json({
      status: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
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
      categoryCode,
      isDiscount = true,
    } = req.body;

    // Validation
    if (
      !name ||
      !price ||
      !discount_percent ||
      !stock ||
      !description ||
      !images ||
      !Array.isArray(images) ||
      !categoryCode
    ) {
      return res.status(400).json({
        status: 400,
        message: "Thiếu thông tin bắt buộc để tạo sản phẩm khuyến mãi",
      });
    }
    // Validate images array
    if (images.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Sản phẩm phải có ít nhất một hình ảnh",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Giá sản phẩm phải lớn hơn 0",
      });
    }
    if (discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({
        status: 400,
        message: "Phần trăm khuyến mãi phải từ 0 đến 100",
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        status: 400,
        message: "Số lượng tồn kho không được âm",
      });
    }

    if (sold < 0) {
      return res.status(400).json({
        status: 400,
        message: "Số lượng đã bán không được âm",
      });
    }

    // Validate size
    if (size && Array.isArray(size)) {
      const validSizes = ["S", "M", "L", "XL"];
      const invalidSizes = size.filter((s) => !validSizes.includes(s));
      if (invalidSizes.length > 0) {
        return res.status(400).json({
          status: 400,
          message: "Kích thước không hợp lệ",
          invalidSizes,
          validSizes,
        });
      }
    }

    // Tinh discount_price
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
      size: size || ["M"],
      categoryCode,
      isDiscount,
    });

    const savedSaleProduct = await saleProduct.save();

    res.status(201).json({
      status: 201,
      message: "Tạo sản phẩm khuyến mãi thành công",
      data: savedSaleProduct,
    });
  } catch (error) {
    console.error("Create sale product error:", error);
    res.status(500).json({
      status: 500,
      message: "Lỗi khi tạo sản phẩm khuyến mãi",
      error: error.message,
    });
  }
};
// Cập nhật sản phẩm khuyến mãi
exports.updateSaleProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      discount_percent,
      stock,
      sold,
      description,
      images,
      size,
      categoryCode,
      isDiscount,
    } = req.body;

    const objectId = new Types.ObjectId(req.params.id);

    const saleProduct = await SaleProduct.findById(objectId);
    if (!saleProduct) {
      return res.status(404).json({
        status: 404,
        message: "Không tìm thấy sản phẩm khuyến mãi",
      });
    }

    // Validation
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Giá sản phẩm phải lớn hơn 0",
      });
    }

    if (
      discount_percent !== undefined &&
      (discount_percent < 0 || discount_percent > 1000)
    ) {
      return res.status(400).json({
        status: 400,
        message: "Phần trăm giảm giá phải từ 0 đến 100",
      });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        status: 400,
        message: "Số lượng tồn kho không được âm",
      });
    }

    if (sold !== undefined && sold < 0) {
      return res.status(400).json({
        status: 400,
        message: "Số lượng đã bán không được âm",
      });
    }

    // Validate size
    if (size && Array.isArray(size)) {
      const validSizes = ["S", "M", "L", "XL"];
      const invalidSizes = size.filter((s) => !validSizes.includes(s));
      if (invalidSizes.length > 0) {
        return res.status(400).json({
          status: 400,
          message: "Kích thước không hợp lệ",
          invalidSizes,
          validSizes,
        });
      }
    }

    // Update fields
    if (name) saleProduct.name = name;
    if (price !== undefined) saleProduct.price = price;
    if (discount_percent !== undefined)
      saleProduct.discount_percent = discount_percent;
    if (stock !== undefined) saleProduct.stock = stock;
    if (sold !== undefined) saleProduct.sold = sold;
    if (description) saleProduct.description = description;
    if (images && Array.isArray(images)) saleProduct.images = images;
    if (size && Array.isArray(size)) saleProduct.size = size;
    if (categoryCode) saleProduct.categoryCode = categoryCode;
    if (isDiscount !== undefined) saleProduct.isDiscount = isDiscount;

    // Recalculate discount_price if price or discount_percent changed
    if (price !== undefined || discount_percent !== undefined) {
      const newPrice = price !== undefined ? price : saleProduct.price;
      const newDiscountPercent =
        discount_percent !== undefined
          ? discount_percent
          : saleProduct.discount_percent;
      saleProduct.discount_price = Math.round(
        newPrice * (1 - newDiscountPercent / 100)
      );
    }

    const updatedSaleProduct = await saleProduct.save();

    res.json({
      status: 200,
      message: "Cập nhật sản phẩm khuyến mãi thành công",
      data: updatedSaleProduct,
    });
  } catch (error) {
    console.error("Update sale product error:", error);
    res.status(500).json({
      status: 500,
      message: "Lỗi khi cập nhật sản phẩm khuyến mãi",
      error: error.message,
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
        message: "Không tìm thấy sản phẩm khuyến mãi",
      });
    }

    res.json({
      status: 200,
      message: "Xóa sản phẩm khuyến mãi thành công",
    });
  } catch (error) {
    console.error("Delete sale product error:", error);
    res.status(500).json({
      status: 500,
      message: "Lỗi khi xóa sản phẩm khuyến mãi",
      error: error.message,
    });
  }
};
// Lấy sản phẩm khuyến mãi theo category_Code
exports.getSaleProductsByCategory = async (req, res) => {
  try {
    const { categoryCode } = req.params;
    if(!categoryCode) {
      return res.status(400).json({
        status: 400,
        message: "Category code là bắt buộc"
      });
    }
    const saleProducts = await SaleProduct.find({ categoryCode: new RegExp(`^${categoryCode}$`, 'i') });

    if(saleProducts.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Không có sản phẩm khuyến mãi nào cho category_code",
        categoryCode: categoryCode,
        data: []
      });
    }

    res.json({
      status: 200,
      message: "Lấy thành công",
      categoryCode: categoryCode,
      data: saleProducts
    });
  } catch (error) {
    console.error("Get sale products by category error:", error);
    res.status(500).json({
      status: 500,
      message: "Lỗi khi lấy sản phẩm khuyến mãi theo category",
      error: error.message
    });
  }
};
