const handleOrderStatus = require('./updateOrderStatus');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Socket connected:', socket.id);

    handleOrderStatus(io, socket);

  });
  
};
module.exports = initializeSocket;