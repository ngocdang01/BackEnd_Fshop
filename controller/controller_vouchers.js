const { create } = require('../model/model_user');
const Voucher = require('../model/model_voucher');

// Lấy tất cả voucher
const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find();
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

// Lấy chi tiết voucher
const getVoucherByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const voucher = await Voucher.findOne({ code: code.toUpperCase() });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        res.json({
            success: true,
            data: voucher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
            maxDiscount,
            type,
            minOrderAmount,
            startDate,
            expireDate,
            usageLimitPerUser,
            totalUsageLimit,
            createdBy,
            isGlobal
        } = req.body;


        const voucherData = {
            code: code ? code.toUpperCase() : null,
            label,
            description,
            discount: Number(discount),
            maxDiscount: Number(maxDiscount),
            type,
            minOrderAmount: Number(minOrderAmount),
            startDate: new Date(startDate),
            expireDate: new Date(expireDate),
            usageLimitPerUser: Number(usageLimitPerUser),
            totalUsageLimit: Number(totalUsageLimit),
            createdBy,
            isGlobal: Boolean(isGlobal),
            usedCount: 0,
            status: 'active'
        };

        // Validate required fields
        if (!voucherData.code || !voucherData.label || !voucherData.description || 
            !voucherData.discount || !voucherData.maxDiscount || !voucherData.type || 
            !voucherData.minOrderAmount || !voucherData.startDate || !voucherData.expireDate || 
            !voucherData.usageLimitPerUser || !voucherData.totalUsageLimit || !voucherData.createdBy) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if voucher code already exists
        const existingVoucher = await Voucher.findOne({ code: voucherData.code });
        if (existingVoucher) {
            return res.status(400).json({
                success: false,
                message: 'Voucher code already exists'
            });
        }

        const voucher = new Voucher(voucherData);
        await voucher.save();

        res.status(201).json({
            success: true,
            data: voucher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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

        const voucher = await Voucher.findOneAndUpdate(
            { code: code.toUpperCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        res.json({
            success: true,
            data: voucher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa voucher
const deleteVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const voucher = await Voucher.findOneAndDelete({ code: code.toUpperCase()});

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        res.json({
            success: true,
            message: 'Voucher deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const validateVoucher = async (req, res) => {
    try {
        const { code, order_value } = req.body;

        if (!code || !order_value) {
            return res.status(400).json({
                success: false,
                message: 'Voucher code and order value are required'
            });
        }
        const voucher = await Voucher.findOne({ code: code.toUpperCase() });

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }
        return res.json({
            success: true,
            message: 'Voucher found. Continue to validation next step.',
            data: { voucher }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get active vouchers
const getActiveVouchers = async (req, res) => {
    try {
        const currentDate = new Date();
        const vouchers = await Voucher.find({
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
