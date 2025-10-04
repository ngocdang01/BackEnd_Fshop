const Category = require('../model/model_categorie');

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
// tạo danh mục mới
exports.createCategory = async (req, res) => {
    try { 
        const { name, code, type, image } = req.body;
        // kiem tra du lieu đầu vào 
        if (! name || !code || !type || !image) {
            return res.status(400).json({ message: 'Tên, mã, loại và hình ảnh danh mục là bắt buộc' });
        }
        // kiểm tra type có hợp lệ không
        if (!['club','national'].includes(type)){
            return res.status(400).json({ message:
                'Loại danh mục không hợp lệ. Phải là "club" hoặc "national"' });
            }

            const category = new Category({
                name,
                code: code.toLowerCase(),
                type,
                image
            
            });
            const newCategory = await category.save();
            res.status(201).json(newCategory);

        } catch (error) {
            res.status(400).json({message: error.message});
    }
};
