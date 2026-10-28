let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*', // Allows mobile apps (expo) and web apps
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  ioInstance.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join customer private room
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        // console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join restaurant kitchen room
    socket.on('join_restaurant_room', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
        // console.log(`[Socket.IO] Socket ${socket.id} joined restaurant_${restaurantId}`);
      }
    });

    // Join admin broadcast room
    socket.on('join_admin_room', () => {
      socket.join('admin_channel');
      // console.log(`[Socket.IO] Socket ${socket.id} joined admin_channel`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized! Call initSocket first.');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
