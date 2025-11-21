const modelNotification = require('../model/model_notification');

const initializeNotificationSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected to notification system:", socket.id);

    // Join user room
    socket.on("join notification room", (userId) => {
      if (!userId) return; // tránh lỗi room undefined

      const room = `notification_${userId}`;
      socket.join(room);
      console.log(`🔔 User joined NOTIFICATION room: ${room}`);
    });

    // Create new notification from client (optional)
    socket.on("new notification", async (notificationData) => {
      try {
        const { userId, title, message, type, data } = notificationData;

        if (!userId)
          return socket.emit("notification error", {
            message: "Missing userId",
          });

        const notification = new modelNotification({
          userId,
          title,
          message,
          type: type || "system",
          isRead: false,
          data: data || {},
        });

        const savedNotification = await notification.save();

        io.to(`notification_${userId}`).emit(
          "notification received",
          savedNotification
        );
      } catch (error) {
        console.error("Error handling notification:", error);
        socket.emit("notification error", {
          message: "Error creating notification",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from notification system:", socket.id);
    });
  });
};

module.exports = initializeNotificationSocket; 
