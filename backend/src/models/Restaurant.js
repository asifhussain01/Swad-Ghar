const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, default: 'Uttar Pradesh' },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [78.0, 27.0] }, // [longitude, latitude]
      },
    },
    phone: {
      type: String,
      required: [true, 'Restaurant contact phone is required'],
    },
    email: {
      type: String,
      required: [true, 'Restaurant contact email is required'],
      lowercase: true,
      trim: true,
    },
    cuisineType: {
      type: [String],
      default: ['North Indian', 'Biryani'],
    },
    logoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    },
    coverImageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    },
    openingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '23:00' },
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    avgRating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    estimatedPrepTimeMinutes: {
      type: Number,
      default: 25,
    },
    deliveryFee: {
      type: Number,
      default: 30, // Flat delivery fee managed by restaurant
    },
    minimumOrderValue: {
      type: Number,
      default: 99,
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ 'address.city': 1, approvalStatus: 1, isOpen: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
