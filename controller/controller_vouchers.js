const Voucher = require('../model/model_voucher');

// Lấy danh sách voucher
const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        return res.json({ success: true, data: vouchers });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Lấy voucher theo mã
const getVoucherByCode = async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const voucher = await Voucher.findOne({ code });

        if (!voucher)
            return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });

        return res.json({ success: true, data: voucher });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Tạo voucher mới
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
            status
        } = req.body;

        // Check trùng code
        const exists = await Voucher.findOne({ code: code.toUpperCase() });
        if (exists)
            return res.status(400).json({ success: false, message: "Mã voucher đã tồn tại" });

        const voucher = new Voucher({
            code: code.toUpperCase(),
            label,
            description,
            discount,
            minOrderAmount,
            startDate,
            expireDate,
            status: status || "active",
            type: "shipping"
        });

        await voucher.save();

        return res.json({
            success: true,
            message: "Tạo voucher thành công",
            data: voucher
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Cập nhật voucher
const updateVoucher = async (req, res) => {
    try {
        const { code } = req.params;

        const allowed = [
            "label",
            "description",
            "discount",
            "minOrderAmount",
            "startDate",
            "expireDate",
            "status"
        ];

        const updateData = {};
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) updateData[key] = req.body[key];
        });

        const voucher = await Voucher.findOneAndUpdate(
            { code: code.toUpperCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!voucher)
            return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });

        return res.json({ success: true, data: voucher });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Xóa voucher
const deleteVoucher = async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const voucher = await Voucher.findOneAndDelete({ code });

        if (!voucher)
            return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });

        return res.json({ success: true, message: "Xóa voucher thành công" });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Validate voucher
const validateVoucher = async (req, res) => {
    try {
        const { code, orderAmount, shippingFee } = req.body;

        const voucher = await Voucher.findOne({ code: code.toUpperCase() });
        if (!voucher)
            return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });

        const now = new Date();

        if (voucher.status !== "active")
            return res.status(400).json({ success: false, message: "Voucher không hoạt động" });

        if (now < voucher.startDate)
            return res.status(400).json({ success: false, message: "Voucher chưa bắt đầu" });

        if (now > voucher.expireDate)
            return res.status(400).json({ success: false, message: "Voucher đã hết hạn" });

        if (orderAmount < voucher.minOrderAmount)
            return res.status(400).json({
                success: false,
                message: `Đơn hàng phải đạt tối thiểu ${voucher.minOrderAmount}đ`
            });

        const discountAmount = Math.min(shippingFee, voucher.discount);

        return res.json({
            success: true,
            message: "Voucher hợp lệ",
            discountAmount,
            finalShippingFee: shippingFee - discountAmount
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAllVouchers,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher
};
