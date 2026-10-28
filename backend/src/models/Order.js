const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const deliveryAddressSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    fullAddress: { type: String, required: true },
    landmark: { type: String, default: '' },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
      validate: [items => items.length > 0, 'Order must contain at least one item'],
    },
    itemSubtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: deliveryAddressSnapshotSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD'],
      default: 'COD',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentCollectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
      default: 'PLACED',
      index: true,
    },
    statusTimeline: [statusTimelineSchema],
    cancellationReason: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    customerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerId: 1, orderStatus: 1 });
orderSchema.index({ restaurantId: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
