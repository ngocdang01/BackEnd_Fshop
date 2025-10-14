const Banner = require('../model/model_banner');


// Lấy tất cả banner
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy banner đang hoạt động
exports.getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy banner theo ID
exports.getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Không tìm thấy banner' });
        }
        res.json(banner);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};