const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().trim().required(),
  phone: Joi.string().trim().min(10).max(15).required(),
  password: Joi.string().min(6).max(128).required(),
  // Public registration ONLY allows CUSTOMER or RESTAURANT_OWNER. ADMIN is disallowed!
  role: Joi.string().valid('CUSTOMER', 'RESTAURANT_OWNER').default('CUSTOMER'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

const restaurantRegisterSchema = Joi.object({
  name: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().allow('').max(500),
  address: Joi.object({
    street: Joi.string().required(),
    landmark: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().default('Uttar Pradesh'),
    pincode: Joi.string().required(),
  }).required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  cuisineType: Joi.array().items(Joi.string()).min(1).required(),
  logoUrl: Joi.string().uri().allow(''),
  coverImageUrl: Joi.string().uri().allow(''),
  openingHours: Joi.object({
    open: Joi.string().default('09:00'),
    close: Joi.string().default('23:00'),
  }),
  estimatedPrepTimeMinutes: Joi.number().min(5).max(120).default(25),
  deliveryFee: Joi.number().min(0).max(500).default(30),
  minimumOrderValue: Joi.number().min(0).default(99),
});

const menuItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().allow('').max(500),
  category: Joi.string().required(),
  price: Joi.number().min(1).required(),
  discountPrice: Joi.number().min(0).allow(null),
  imageUrl: Joi.string().uri().allow(''),
  isVegetarian: Joi.boolean().default(true),
  isAvailable: Joi.boolean().default(true),
  prepTimeMinutes: Joi.number().min(1).max(180).default(20),
});

const cartItemSchema = Joi.object({
  menuItemId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
});

const addressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Work', 'Other').default('Home'),
  recipientName: Joi.string().required(),
  phone: Joi.string().required(),
  fullAddress: Joi.string().required(),
  landmark: Joi.string().allow(''),
  city: Joi.string().required(),
  pincode: Joi.string().required(),
  isDefault: Joi.boolean().default(false),
});

const orderCreateSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required(),
  customerNotes: Joi.string().allow('').max(300),
});

const orderStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'REJECTED').required(),
  rejectionReason: Joi.string().when('status', {
    is: 'REJECTED',
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  note: Joi.string().allow(''),
});

const orderCancelSchema = Joi.object({
  cancellationReason: Joi.string().min(3).max(300).required(),
});

const reviewSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow('').max(500),
});

const complaintSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  subject: Joi.string().min(5).max(150).required(),
  description: Joi.string().min(10).max(1000).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  restaurantRegisterSchema,
  menuItemSchema,
  cartItemSchema,
  addressSchema,
  orderCreateSchema,
  orderStatusUpdateSchema,
  orderCancelSchema,
  reviewSchema,
  complaintSchema,
};
