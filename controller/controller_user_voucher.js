const UserVoucher = require("../model/model_user_voucher");
const Voucher = require("../model/model_voucher");
const User = require("../model/model_user");

// Gán voucher cho người dùng
const assignVoucherToUser = async (req, res) => {
  try {
    const { userId, voucherId, source, note } = req.body;

    // Validate file
    if (!userId || !voucherId || !source) {
      return res.status(400).json({
        success: false,
        message: "Bạn phải cung cấp userId, voucherId và source",
      });
    }

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra voucher tồn tại, trạng thái hợp lệ
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });
    }

    const currentDate = new Date();
    if (
      voucher.status !== "active" ||
      currentDate < voucher.startDate ||
      currentDate > voucher.expireDate
    )
      return res
        .status(400)
        .json({ success: false, message: "Voucher không hợp lệ tại thời điểm này" });

    const exists = await UserVoucher.findOne({
      userId,
      voucherId,
      used: false,
    });

    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Người dùng đã sở hữu voucher này rồi" });

    const countUsed = await UserVoucher.countDocuments({
      userId,
      voucherId,
      used: true,
    });

    if (countUsed >= voucher.usageLimitPerUser)
      return res.status(400).json({
        success: false,
        message: "Người dùng đã đạt giới hạn sử dụng cho voucher này",
      });
    // Tạo bản ghi mới
    const userVoucher = new UserVoucher({
      userId,
      voucherId,
      source,
      note: note || "",
    });

    await userVoucher.save();
    await userVoucher.populate("voucherId");

    res.status(201).json({
      success: true,
      data: userVoucher,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get user vouchers
const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.query;

    const currentDate = new Date();
    let vouchers = await UserVoucher.find({ userId }).populate({
      path: "voucherId",
      match:
        active === "true"
          ? {
              status: "active",
              startDate: { $lte: currentDate },
              expireDate: { $gte: currentDate },
            }
          : {},
    });
    // lọc null nếu active filter
    if (active === "true") vouchers = vouchers.filter((v) => v.voucherId);
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark voucher as used
const markVoucherAsUsed = async (req, res) => {
  try {
    const { userVoucherId } = req.params;

    const userVoucher = await UserVoucher.findById(userVoucherId).populate(
      "voucherId"
    );

    if (!userVoucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user voucher",
      });
    }

    if (userVoucher.used) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã được sử dụng",
      });
    }

    const voucher = userVoucher.voucherId;
    const currentDate = new Date();

    if (currentDate < voucher.startDate || currentDate > voucher.expireDate)
      return res
        .status(400)
        .json({ success: false, message: "Voucher đã hết hạn hoặc không còn hiệu lực" });

    userVoucher.used = true;
    userVoucher.usedAt = currentDate;
    await userVoucher.save();

    // Update voucher usage count
    await Voucher.findByIdAndUpdate(userVoucher.voucherId._id, {
      $inc: { usedCount: 1 },
    });

    res.json({
      success: true,
      data: userVoucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Validate user voucher
const validateUserVoucher = async (req, res) => {
  try {
    const { userVoucherId, orderAmount, shippingFee } = req.body;

    const userVoucher = await UserVoucher.findById(userVoucherId).populate(
      "voucherId"
    );
    if (!userVoucher) {
      return res.status(400).json({
        success: false,
        message: "userVoucherId và orderValue là bắt buộc",
      });
    }
    if (userVoucher.used)
      return res
        .status(400)
        .json({ success: false, message: "Voucher đã được sử dụng" });

    const voucher = userVoucher.voucherId;
    const currentDate = new Date();

    const isValid =
      voucher.status === "active" &&
      currentDate >= voucher.startDate &&
      currentDate <= voucher.expireDate &&
      orderAmount >= voucher.minOrderAmount &&
      voucher.usedCount < voucher.totalUsageLimit;

    if (!isValid) {
      return res.json({
        success: false,
        message: "Voucher không hợp lệ",
      });
    }

    // 🔥 freeship
    const discountAmount = Math.min(shippingFee, voucher.maxDiscount);

    res.json({
      success: true,
      message: "Voucher hợp lệ",
      discountAmount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get available vouchers for user
const getAvailableVouchersForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { orderAmount } = req.query;

    const currentDate = new Date();

    // Get user's unused vouchers
    const userVouchers = await UserVoucher.find({
      userId,
      used: false,
    }).populate({
      path: "voucherId",
      match: {
        status: "active",
        startDate: { $lte: currentDate },
        expireDate: { $gte: currentDate },
      },
    });

    // Filter valid vouchers
    let validVouchers = userVouchers.filter((uv) => uv.voucherId);

    if (orderAmount) {
      validVouchers = validVouchers.filter(
        (uv) => uv.voucherId.minOrderAmount <= Number(orderAmount)
      );
    }

    res.json({
      success: true,
      data: validVouchers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove user voucher
const removeUserVoucher = async (req, res) => {
  try {
    const { userVoucherId } = req.params;

    const userVoucher = await UserVoucher.findById(userVoucherId);

    if (!userVoucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher",
      });
    }

    if (userVoucher.used) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa voucher đã được sử dụng",
      });
    }

    await UserVoucher.findByIdAndDelete(userVoucherId);

    res.json({
      success: true,
      message: "Xóa voucher của người dùng thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  assignVoucherToUser,
  getUserVouchers,
  markVoucherAsUsed,
  validateUserVoucher,
  getAvailableVouchersForUser,
  removeUserVoucher,
};
