const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const RestaurantCategory = require('../models/RestaurantCategory');
const Address = require('../models/Address');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    List approved & active restaurants with filtering
// @route   GET /api/customer/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, isVegetarian, city, sortBy, minRating } = req.query;

    const filter = {
      approvalStatus: 'APPROVED',
      isOpen: true,
    };

    if (city) {
      filter['address.city'] = new RegExp(city, 'i');
    }

    if (cuisine) {
      filter.cuisineType = { $in: [new RegExp(cuisine, 'i')] };
    }

    if (minRating) {
      filter.avgRating = { $gte: parseFloat(minRating) };
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { cuisineType: new RegExp(search, 'i') },
      ];
    }

    let sortOptions = { avgRating: -1, createdAt: -1 };
    if (sortBy === 'rating') sortOptions = { avgRating: -1 };
    if (sortBy === 'deliveryTime') sortOptions = { estimatedPrepTimeMinutes: 1 };
    if (sortBy === 'minOrder') sortOptions = { minimumOrderValue: 1 };

    let restaurants = await Restaurant.find(filter).sort(sortOptions);

    // If pure vegetarian filter is requested, filter out restaurants with no veg items
    if (isVegetarian === 'true') {
      const vegRestaurantIds = await MenuItem.distinct('restaurantId', {
        isVegetarian: true,
        isAvailable: true,
      });
      restaurants = restaurants.filter((r) => vegRestaurantIds.some((id) => id.equals(r._id)));
    }

    return sendSuccess(res, restaurants, `Found ${restaurants.length} restaurants.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant profile and full menu
// @route   GET /api/customer/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return sendError(res, 'Restaurant not found.', 404);
    }

    if (restaurant.approvalStatus !== 'APPROVED') {
      return sendError(res, 'This restaurant is currently not accepting public orders.', 403);
    }

    // Fetch available menu items
    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
    }).sort({ category: 1, name: 1 });

    // Group items by category for mobile UI
    const groupedMenu = menuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return sendSuccess(
      res,
      {
        restaurant,
        menuItems,
        groupedMenu,
      },
      'Restaurant details retrieved.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get active categories
// @route   GET /api/customer/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await RestaurantCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    return sendSuccess(res, categories, 'Categories retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer saved addresses
// @route   GET /api/customer/addresses
// @access  Customer
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ customerId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return sendSuccess(res, addresses, 'Saved addresses retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new delivery address
// @route   POST /api/customer/addresses
// @access  Customer
const addAddress = async (req, res, next) => {
  try {
    const { label, recipientName, phone, fullAddress, landmark, city, pincode, isDefault } = req.body;

    const count = await Address.countDocuments({ customerId: req.user._id });

    const address = await Address.create({
      customerId: req.user._id,
      label,
      recipientName,
      phone,
      fullAddress,
      landmark,
      city,
      pincode,
      // If it's the first address, make it default automatically
      isDefault: count === 0 ? true : Boolean(isDefault),
    });

    return sendSuccess(res, address, 'Delivery address added successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete delivery address
// @route   DELETE /api/customer/addresses/:id
// @access  Customer
const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      customerId: req.user._id,
    });

    if (!address) {
      return sendError(res, 'Address not found or unauthorized.', 404);
    }

    return sendSuccess(res, null, 'Address deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer notifications
// @route   GET /api/customer/notifications
// @access  Customer
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    return sendSuccess(res, notifications, 'Notifications retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/customer/notifications/:id/read
// @access  Customer
const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    return sendSuccess(res, null, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  getCategories,
  getAddresses,
  addAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
};
