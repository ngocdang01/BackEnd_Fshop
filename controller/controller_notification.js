const modelNotification = require('../model/model_notification');
const modelUser = require('../model/model_user'); // Change from model_users to model_user

module.exports = (io) => ({
  add: async (req, res) => {
    try {
      const { userId, title, message, type, data } = req.body;

      if (!userId) {
        return res.status(400).json({
          status: 400,
          message: "userId is required",
        });
      }

      const notification = new modelNotification({
        userId,
        title,
        message,
        type: type || "order",
        isRead: false,
        data: data || {},
      });

      const saved = await notification.save();

      // ⭐ Emit realtime cho user
      io.to(`notification_${userId}`).emit("notification received", saved);

      return res.json({
        status: 200,
        message: "Thêm thông báo thành công",
        data: saved,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Lỗi thêm thông báo",
        error: error.message,
      });
    }
  },

  getByUserId: async (req, res) => {
    try {
      const notifications = await modelNotification
        .find({ userId: req.params.userId })
        .sort({ createdAt: -1 });

      res.json({
        status: 200,
        message: "Lấy thông báo thành công",
        data: notifications,
      });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const notification = await modelNotification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );

      res.json({
        status: 200,
        message: "Đánh dấu đã đọc thành công",
        data: notification,
      });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const count = await modelNotification.countDocuments({
        userId: req.params.userId,
        isRead: false,
      });

      res.json({
        status: 200,
        message: "Lấy số lượng thông báo chưa đọc thành công",
        data: count,
      });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  },
});
