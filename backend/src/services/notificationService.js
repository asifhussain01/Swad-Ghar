const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

const createAndSendNotification = async ({ userId, title, message, type = 'GENERAL', referenceId = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      referenceId,
    });

    // Attempt real-time broadcast via socket
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('notification', notification);
      }
    } catch (socketError) {
      // Socket not ready or no clients; graceful ignore
    }

    return notification;
  } catch (error) {
    console.error('[NotificationService Error]:', error.message);
    return null;
  }
};

const notifyRestaurantKitchen = (restaurantId, order, ownerId = null) => {
  try {
    const io = getIO();
    if (io) {
      const payload = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        finalAmount: order.finalAmount,
        itemCount: order.items ? order.items.length : 0,
        items: order.items || [],
        deliveryAddress: order.deliveryAddress,
        customerNotes: order.customerNotes || '',
        paymentMethod: order.paymentMethod || 'COD',
        paymentStatus: order.paymentStatus || 'PENDING',
        createdAt: order.createdAt || new Date(),
      };
      const roomName = `restaurant_${restaurantId.toString()}`;
      io.to(roomName).emit('new_incoming_order', payload);

      if (ownerId) {
        io.to(`user_${ownerId.toString()}`).emit('new_incoming_order', payload);
      }
    }
  } catch (err) {
    console.error('[Kitchen Socket Alert Error]:', err.message);
  }
};

const notifyOrderStatusChange = (userId, order) => {
  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('order_status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      });
    }
  } catch (err) {
    console.error('[User Order Status Socket Error]:', err.message);
  }
};

const notifyAdminChannel = (event, data) => {
  try {
    const io = getIO();
    if (io) {
      io.to('admin_channel').emit(event, data);
    }
  } catch (err) {
    console.error('[Admin Socket Error]:', err.message);
  }
};

module.exports = {
  createAndSendNotification,
  notifyRestaurantKitchen,
  notifyOrderStatusChange,
  notifyAdminChannel,
};
