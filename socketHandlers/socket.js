const handleOrderStatus = require('./updateOrderStatus');
const handleNotificationSocket = require('./handleNotificationSocket');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Socket connected:', socket.id);

    handleOrderStatus(io, socket);
    handleNotificationSocket(io, socket);

  });
  
};
module.exports = initializeSocket;