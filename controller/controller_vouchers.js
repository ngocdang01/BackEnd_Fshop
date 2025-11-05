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

module.exports = {
    getAllVouchers,
    createVoucher
};
