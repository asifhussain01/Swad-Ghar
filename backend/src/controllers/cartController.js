const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper to compute live totals and validate stock
const calculateCartTotals = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      restaurant: null,
      items: [],
      itemSubtotal: 0,
      deliveryFee: 0,
      finalAmount: 0,
      itemCount: 0,
      hasUnavailableItems: false,
    };
  }

  const restaurant = await Restaurant.findById(cart.restaurantId);
  const deliveryFee = restaurant ? restaurant.deliveryFee : 0;

  let itemSubtotal = 0;
  let hasUnavailableItems = false;
  const detailedItems = [];

  for (const entry of cart.items) {
    const menuItem = await MenuItem.findById(entry.menuItemId);
    if (!menuItem) continue;

    const effectivePrice = menuItem.discountPrice || menuItem.price;
    const subtotal = effectivePrice * entry.quantity;
    itemSubtotal += subtotal;

    if (!menuItem.isAvailable) {
      hasUnavailableItems = true;
    }

    detailedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: effectivePrice,
      originalPrice: menuItem.price,
      quantity: entry.quantity,
      subtotal,
      imageUrl: menuItem.imageUrl,
      isVegetarian: menuItem.isVegetarian,
      isAvailable: menuItem.isAvailable,
      category: menuItem.category,
    });
  }

  const finalAmount = itemSubtotal + deliveryFee;

  return {
    restaurant: restaurant
      ? {
          id: restaurant._id,
          name: restaurant.name,
          isOpen: restaurant.isOpen,
          deliveryFee: restaurant.deliveryFee,
          minimumOrderValue: restaurant.minimumOrderValue,
        }
      : null,
    items: detailedItems,
    itemSubtotal,
    deliveryFee,
    finalAmount,
    itemCount: detailedItems.reduce((acc, i) => acc + i.quantity, 0),
    hasUnavailableItems,
  };
};

// @desc    Get current user's cart with live calculation
// @route   GET /api/customer/cart
// @access  Customer
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customerId: req.user._id, items: [] });
    }

    const calculated = await calculateCartTotals(cart);
    return sendSuccess(res, calculated, 'Cart retrieved.');
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update item in cart
// @route   POST /api/customer/cart/items
// @access  Customer
const addToCart = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return sendError(res, 'Menu item not found.', 404);
    }

    if (!menuItem.isAvailable) {
      return sendError(res, `"${menuItem.name}" is currently sold out and cannot be added.`, 400);
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = new Cart({ customerId: req.user._id, items: [] });
    }

    // Check single-restaurant restriction
    if (cart.restaurantId && !cart.restaurantId.equals(menuItem.restaurantId) && cart.items.length > 0) {
      // Clear cart items from previous restaurant to allow adding from new restaurant
      cart.items = [];
    }

    cart.restaurantId = menuItem.restaurantId;

    const existingIndex = cart.items.findIndex((item) => item.menuItemId.equals(menuItemId));

    if (quantity <= 0) {
      // Remove item if quantity is zero
      if (existingIndex > -1) {
        cart.items.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = quantity;
      } else {
        cart.items.push({ menuItemId, quantity });
      }
    }

    // If no items left, clear restaurantId
    if (cart.items.length === 0) {
      cart.restaurantId = null;
    }

    await cart.save();

    const calculated = await calculateCartTotals(cart);
    return sendSuccess(res, calculated, 'Cart updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from cart
// @route   DELETE /api/customer/cart/items/:itemId
// @access  Customer
const removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ customerId: req.user._id });

    if (!cart) {
      return sendError(res, 'Cart is empty.', 404);
    }

    cart.items = cart.items.filter((item) => !item.menuItemId.equals(itemId));
    if (cart.items.length === 0) {
      cart.restaurantId = null;
    }

    await cart.save();
    const calculated = await calculateCartTotals(cart);
    return sendSuccess(res, calculated, 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in cart
// @route   DELETE /api/customer/cart
// @access  Customer
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user._id });
    if (cart) {
      cart.items = [];
      cart.restaurantId = null;
      await cart.save();
    }

    return sendSuccess(
      res,
      {
        restaurant: null,
        items: [],
        itemSubtotal: 0,
        deliveryFee: 0,
        finalAmount: 0,
        itemCount: 0,
      },
      'Cart cleared.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeItem,
  clearCart,
};
