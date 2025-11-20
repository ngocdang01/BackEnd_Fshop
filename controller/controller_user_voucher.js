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
        message: "userId, voucherId, and source are required",
      });
    }

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Kiểm tra voucher tồn tại, trạng thái hợp lệ
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Voucher not found" });
    }

    if (voucher.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Voucher is not active",
      });
    }

    // Kiểm tra thời gian hiệu lực của voucher
    const currentDate = new Date();
    if (currentDate < voucher.startDate || currentDate > voucher.expireDate) {
      return res
        .status(400)
        .json({ success: false, message: "Voucher is not valid at this time" });
    }

    // Kiểm tra trùng lặp user_voucher
    if (!voucher.isGlobal) {
      const existingUserVoucher = await UserVoucher.findOne({
        userId: userId,
        voucherId: voucherId,
        used: false,
      });

      if (existingUserVoucher) {
        return res.status(400).json({
          success: false,
          message: "User already has this voucher",
        });
      }
    }
    // Tạo bản ghi mới
    const userVoucher = new UserVoucher({
      userId: userId,
      voucherId: voucherId,
      source: source,
      note: note || "",
    });
    await userVoucher.save();
    await userVoucher.populate("voucherId");

    res.status(201).json({
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
// Get user vouchers
const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { used, active } = req.query;

    let query = { userId: userId };
    // Filter by used status
    if (used !== undefined) {
      query.used = used === "true";
    }
    // Filter by active vouchers only
    if (active === "true") {
      const currentDate = new Date();
      const userVouchers = await UserVoucher.find(query).populate({
        path: "voucherId",
        match: {
          status: "active",
          startDate: { $lte: currentDate },
          expireDate: { $gte: currentDate },
        },
      });

      // Filter out vouchers where voucherId is null (inactive vouchers)
      const activeVouchers = userVouchers.filter((uv) => uv.voucherId !== null);

      return res.json({
        success: true,
        data: activeVouchers,
      });
    }

    const userVouchers = await UserVoucher.find(query)
      .populate("voucherId")
      .sort({ assignedAt: -1 });

    res.json({
      success: true,
      data: userVouchers,
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
  getUserVouchers
};
