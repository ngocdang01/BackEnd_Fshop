const { create } = require('../model/model_user');
const Voucher = require('../model/model_voucher');

// Lấy tất cả voucher
const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: vouchers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Lấy chi tiết voucher
const getVoucherByCode = async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const voucher = await Voucher.findOne({ code });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm voucher'
            });
        }

        res.json({
            success: true,
            data: voucher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// Tạo mới Voucher
const createVoucher = async (req, res) => {
    try {
        const {
            code,
            label,
            description,
            discount,
            minOrderAmount,
            startDate,
            expireDate,
            usageLimitPerUser,
            totalUsageLimit,
            createdBy,
            isGlobal
        } = req.body;

        // Check trùng code
        const exists = await Voucher.findOne({ code: code.toUpperCase() });
        if (exists) return res.status(400).json({ success: false, message: "Mã voucher đã tồn tại" });

        const voucher = new Voucher({
            code: code.toUpperCase(),
            label,
            description,
            type: "shipping", // 🔥 CHỈ CHO FREESHIP
            discount,
            minOrderAmount,
            startDate,
            expireDate,
            usageLimitPerUser,
            totalUsageLimit,
            createdBy,
            isGlobal,
            status: req.body.status || "active"
        });
        await voucher.save();

        res.json({
            success: true,
            message: "Tạo voucher thành công",
            data: voucher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Update voucher
const updateVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        // Don't allow updating code
        delete updateData.code;
        delete updateData.type; // bat buoc freeship

        const voucher = await Voucher.findOneAndUpdate(
            { code: code.toUpperCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher'
            });
        }

        res.json({
            success: true,
            data: voucher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Xóa voucher
const deleteVoucher = async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const voucher = await Voucher.findOneAndDelete({ code });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher"'
            });
        }

        res.json({
            success: true,
            message: 'Voucher deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Validate voucher
const validateVoucher = async (req, res) => {
    try {
        const { code, orderAmount, shippingFee  } = req.body;

        const voucher = await Voucher.findOne({ code: code.toUpperCase() });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy voucher"'
            });
        }
        
        const currentDate = new Date();

        if (voucher.status !== "active")
            return res.status(400).json({ success: false, message: "Voucher không hoạt động" });

        if (currentDate < voucher.startDate)
            return res.status(400).json({ success: false, message: "Voucher chưa bắt đầu" });

        if (currentDate > voucher.expireDate)
            return res.status(400).json({ success: false, message: "Voucher đã hết hạn" });

        if (voucher.usedCount >= voucher.totalUsageLimit)
            return res.status(400).json({ success: false, message: "Voucher đã đạt đến giới hạn sử dụng" });

        if (orderAmount < voucher.minOrderAmount)
            return res.status(400).json({
                success: false,
                message: `Đơn hàng phải đạt tối thiểu ${voucher.minOrderAmount}đ`
            });

        // 🔥 Tính giảm phí ship
        const discountAmount = Math.min(shippingFee, voucher.discount);
        
        res.json({
            success: true,
            message: 'Voucher hợp lệ',
            discountAmount,
            finalShippingFee: shippingFee - discountAmount
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// Get active vouchers
const getActiveVouchers = async (req, res) => {
    try {
        const currentDate = new Date();
        const vouchers = await Voucher.find({
            type: "shipping",  // 🔥 thêm để chắc chắn
            status: 'active',
            startDate: { $lte: currentDate },
            expireDate: { $gte: currentDate },
            $expr: { $lt: ["$usedCount", "$totalUsageLimit"] }
        });

        res.json({
            success: true,
            data: vouchers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get global vouchers
const getGlobalVouchers = async (req, res) => {
    try {
        const currentDate = new Date();
        const vouchers = await Voucher.find({
            isGlobal: true,
            type: "shipping",   // 🔥 bắt buộc freeship
            status: 'active',
            startDate: { $lte: currentDate },
            expireDate: { $gte: currentDate },
            $expr: { $lt: ["$usedCount", "$totalUsageLimit"] }
        });

        res.json({
            success: true,
            data: vouchers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getAllVouchers,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher,
    getActiveVouchers,
    getGlobalVouchers
};
