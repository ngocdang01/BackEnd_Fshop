// socketHandle/updateOrderStatus.js
const Order = require('../model/model_order');

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true }).populate('userId');
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const io = req.app.get('io');
    const userId = updatedOrder.userId?._id?.toString();

    if (io && userId) {
      const orderRoom = `order_${userId}`;
      io.to(orderRoom).emit('orderStatusUpdated', {
        orderId: updatedOrder._id,
        status,
        message: `Đơn hàng #${updatedOrder.order_code} đã được cập nhật sang trạng thái: ${status}.`
      });
      console.log('📤 Gửi socket cập nhật trạng thái đơn hàng đến phòng:', orderRoom);
    }

    res.json({ success: true, updatedOrder });
  } catch (err) {
    console.error('❌ Lỗi updateOrderStatus:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = updateOrderStatus;
