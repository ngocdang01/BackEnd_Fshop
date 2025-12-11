const Category = require('../model/model_categorie');
const Product = require("../model/model_product");

// lay danh sach tat ca danh muc

exports.getAllCategories = async (req, res)=>
{
    try {
        const categories = await Category.find();
        res.json(categories)
;
        } catch (error){
            res.status(500).json({message: error.message});
        }    };

        // lay chi tiet mot danh muc

exports.getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCategoryById = async (req,res)=>
{
    try {
        const category = await Category.findById(req.params.id);
        if(!category) {
            return res.status(404).json({
                message: 'Không tìm thấy danh mục'
            });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({message: error.message });
    }
}
// Lấy danh mục theo code
exports.getCategoryByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const category = await Category.findOne({ code: code.toLowerCase() });
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục với code này' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// tạo danh mục mới
exports.createCategory = async (req, res) => {
    try { 
        const { name, code, type, image } = req.body;
        // kiem tra du lieu đầu vào 
        if (! name || !code || !image) {
            return res.status(400).json({ message: 'Tên, mã, loại và hình ảnh danh mục là bắt buộc' });
        }
        // Kiểm tra trùng tên (không phân biệt hoa thường)
        const existingName = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (existingName) {
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        }
        // kiểm tra trùng mã code
        const existing = await Category.findOne({ code: code.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Mã danh mục đã tồn tại' });
        }

            const category = new Category({
                name,
                code: code.toLowerCase(),
                image
            
            });
            const newCategory = await category.save();
            res.status(201).json(newCategory);

        } catch (error) {
            res.status(400).json({message: error.message});
    }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { name, code, type, image } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!name || !code || !image) {
            return res.status(400).json({ message: 'Tên, mã và hình ảnh danh mục là bắt buộc' });
        }

        // Kiểm tra trùng tên (ngoại trừ danh mục hiện tại)
        const existingName = await Category.findOne({
            _id: { $ne: req.params.id },
            name: new RegExp(`^${name}$`, 'i')
        });
        if (existingName) {
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        }

        // Kiểm tra trùng mã code (ngoại trừ danh mục hiện tại)
        const existingCode = await Category.findOne({
            _id: { $ne: req.params.id },
            code: code.toLowerCase()
        });
        if (existingCode) {
            return res.status(400).json({ message: 'Mã danh mục đã tồn tại' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        category.name = name;
        category.code = code.toLowerCase();
        category.image = image;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        await category.deleteOne();
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Không tìm thấy danh mục" });
        }

        // Đảo trạng thái
        category.isActive = !category.isActive;
        await category.save();

        // Nếu tắt danh mục → tắt tất cả sản phẩm thuộc danh mục
        if (!category.isActive) {
            await Product.updateMany(
                { categoryCode: category.code },
                { $set: { isActive: false } }
            );
        } else {
            // Nếu bật danh mục → bật lại sản phẩm
            await Product.updateMany(
                { categoryCode: category.code },
                { $set: { isActive: true } }
            );
        }

        return res.json({
            success: true,
            message: `Danh mục đã ${category.isActive ? "kích hoạt" : "vô hiệu hóa"} thành công`,
            data: category
        });

    } catch (error) {
        console.error("Toggle category error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi thay đổi trạng thái danh mục",
            error: error.message
        });
    }
};

