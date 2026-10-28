const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // Only one review per order
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    moderationStatus: {
      type: String,
      enum: ['VISIBLE', 'FLAGGED', 'REMOVED'],
      default: 'VISIBLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Recalculate restaurant avg rating after review is saved
reviewSchema.post('save', async function () {
  const Restaurant = mongoose.model('Restaurant');
  const stats = await this.constructor.aggregate([
    { $match: { restaurantId: this.restaurantId, moderationStatus: 'VISIBLE' } },
    {
      $group: {
        _id: '$restaurantId',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(this.restaurantId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      totalRatings: stats[0].totalRatings,
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
