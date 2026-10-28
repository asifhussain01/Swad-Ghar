require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const RestaurantCategory = require('../models/RestaurantCategory');
const Address = require('../models/Address');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const seedAll = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb+srv://asifh9336_db_user:PicR5qIZvqmxfioY@cluster0.es5eufp.mongodb.net/swadghar?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected.');

    // 1. Seed Categories
    const categoriesData = [
      { name: 'Biryani', slug: 'biryani', iconUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300', description: 'Dum biryani, fragrant basmati rice & slow-cooked spices' },
      { name: 'Thali & Meals', slug: 'thali-meals', iconUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=300', description: 'Complete Indian meal plates with dal, sabzi, roti & rice' },
      { name: 'North Indian', slug: 'north-indian', iconUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300', description: 'Rich gravies, paneer curries, buttery naans & kebabs' },
      { name: 'South Indian', slug: 'south-indian', iconUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300', description: 'Crispy dosas, fluffy idlis, vada, and aromatic sambar' },
      { name: 'Pizza & Fast Food', slug: 'pizza-fast-food', iconUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300', description: 'Loaded pizzas, burgers, fries & sandwiches' },
      { name: 'Chinese & Rolls', slug: 'chinese-rolls', iconUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=300', description: 'Desi Chinese noodles, manchurian, fried rice & kathi rolls' },
      { name: 'Sweets & Desserts', slug: 'sweets-desserts', iconUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300', description: 'Gulab jamun, rasgulla, jalebi & kulfi' },
      { name: 'Street Food & Snacks', slug: 'street-food-snacks', iconUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300', description: 'Samosas, chaat, pakoras and evening snacks' },
    ];

    for (const cat of categoriesData) {
      await RestaurantCategory.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
    }
    console.log('[Seed] Categories seeded.');

    // 2. Seed Super Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@swadghar.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'SwadGhar Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@SwadGhar2026',
        phone: process.env.ADMIN_PHONE || '+919876543210',
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      console.log(`[Seed] Created Super Admin: ${adminEmail}`);
    } else {
      console.log(`[Seed] Super Admin exists: ${adminEmail}`);
    }

    // 3. Seed Restaurant Owners
    let owner1 = await User.findOne({ email: 'lucknow.zaika@swadghar.com' });
    if (!owner1) {
      owner1 = await User.create({
        name: 'Mohammad Tariq',
        email: 'lucknow.zaika@swadghar.com',
        password: 'OwnerPassword@123',
        phone: '+919811223344',
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
      });
      console.log('[Seed] Created Owner 1: Zaika Mahal');
    }

    let owner2 = await User.findOne({ email: 'krishna.dhaba@swadghar.com' });
    if (!owner2) {
      owner2 = await User.create({
        name: 'Ramesh Sharma',
        email: 'krishna.dhaba@swadghar.com',
        password: 'OwnerPassword@123',
        phone: '+919822334455',
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
      });
      console.log('[Seed] Created Owner 2: Krishna Dhaba');
    }

    // 4. Seed Customer
    let customer1 = await User.findOne({ email: 'customer@swadghar.com' });
    if (!customer1) {
      customer1 = await User.create({
        name: 'Rahul Verma',
        email: 'customer@swadghar.com',
        password: 'CustomerPassword@123',
        phone: '+919833445566',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });
      console.log('[Seed] Created Demo Customer: customer@swadghar.com');
    }

    // 5. Seed Customer Address
    let address1 = await Address.findOne({ customerId: customer1._id });
    if (!address1) {
      address1 = await Address.create({
        customerId: customer1._id,
        label: 'Home',
        recipientName: 'Rahul Verma',
        phone: '+919833445566',
        fullAddress: 'Flat 402, Shanti Kunj Apartments, Gomti Nagar',
        landmark: 'Near City Mall',
        city: 'Lucknow',
        pincode: '226010',
        isDefault: true,
      });
      console.log('[Seed] Created Demo Address for Customer');
    }

    // 6. Seed Restaurant 1: Zaika Mughlai & Biryani Mahal
    let rest1 = await Restaurant.findOne({ ownerId: owner1._id });
    if (!rest1) {
      rest1 = await Restaurant.create({
        ownerId: owner1._id,
        name: 'Zaika Biryani & Mughlai Mahal',
        description: 'Authentic Awadhi dum biryani, tender galouti kebabs & rich Mughlai curries slow-cooked to perfection.',
        address: {
          street: '12/4 Hazratganj Main Road',
          landmark: 'Opposite GPO',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: '226001',
        },
        phone: '+919811223344',
        email: 'zaika@swadghar.com',
        cuisineType: ['Biryani', 'North Indian', 'Mughlai'],
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
        coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        openingHours: { open: '11:00', close: '23:30' },
        isOpen: true,
        approvalStatus: 'APPROVED',
        avgRating: 4.6,
        totalRatings: 184,
        estimatedPrepTimeMinutes: 25,
        deliveryFee: 35,
        minimumOrderValue: 120,
      });
      console.log('[Seed] Created Restaurant 1');
    }

    // 7. Seed Restaurant 2: Shree Krishna Shuddh Shakahari Dhaba
    let rest2 = await Restaurant.findOne({ ownerId: owner2._id });
    if (!rest2) {
      rest2 = await Restaurant.create({
        ownerId: owner2._id,
        name: 'Shree Krishna Shuddh Shakahari Dhaba',
        description: '100% Pure Vegetarian Dhaba. Homestyle thalis, creamy dal makhani, paneer specialties & tandoori rotis.',
        address: {
          street: 'Shop 5, Alambagh Market',
          landmark: 'Near Metro Station',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: '226005',
        },
        phone: '+919822334455',
        email: 'krishna@swadghar.com',
        cuisineType: ['North Indian', 'Thali & Meals', 'Vegetarian'],
        logoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        coverImageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200',
        openingHours: { open: '08:00', close: '23:00' },
        isOpen: true,
        approvalStatus: 'APPROVED',
        avgRating: 4.8,
        totalRatings: 320,
        estimatedPrepTimeMinutes: 20,
        deliveryFee: 25,
        minimumOrderValue: 99,
      });
      console.log('[Seed] Created Restaurant 2');
    }

    // 8. Seed Menu Items for Restaurant 1
    const itemsCount1 = await MenuItem.countDocuments({ restaurantId: rest1._id });
    if (itemsCount1 === 0) {
      await MenuItem.create([
        {
          restaurantId: rest1._id,
          name: 'Lucknowi Chicken Dum Biryani',
          description: 'Aromatic long-grain basmati rice layered with tender marinated chicken and secret Awadhi spices.',
          category: 'Biryani',
          price: 260,
          discountPrice: 239,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
          isVegetarian: false,
          isAvailable: true,
          prepTimeMinutes: 25,
        },
        {
          restaurantId: rest1._id,
          name: 'Shahi Veg Dum Biryani',
          description: 'Fragrant saffron rice slow-cooked with fresh garden vegetables, paneer cubes, and golden fried onions.',
          category: 'Biryani',
          price: 210,
          discountPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 20,
        },
        {
          restaurantId: rest1._id,
          name: 'Paneer Butter Masala',
          description: 'Cottage cheese simmered in a luscious tomato and cashew butter gravy topped with fresh cream.',
          category: 'North Indian',
          price: 220,
          discountPrice: 199,
          imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 20,
        },
        {
          restaurantId: rest1._id,
          name: 'Butter Garlic Naan (2 Pcs)',
          description: 'Fresh clay-oven baked flatbread brushed with garlic butter and chopped coriander.',
          category: 'North Indian',
          price: 70,
          discountPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 10,
        },
        {
          restaurantId: rest1._id,
          name: 'Gulab Jamun (2 Pcs)',
          description: 'Soft melt-in-mouth milk solids dumplings soaked in rose and cardamom sugar syrup.',
          category: 'Sweets & Desserts',
          price: 60,
          discountPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 5,
        },
      ]);
      console.log('[Seed] Menu items seeded for Zaika Biryani.');
    }

    // 9. Seed Menu Items for Restaurant 2
    const itemsCount2 = await MenuItem.countDocuments({ restaurantId: rest2._id });
    if (itemsCount2 === 0) {
      await MenuItem.create([
        {
          restaurantId: rest2._id,
          name: 'Special Maharaja Veg Thali',
          description: 'Paneer Butter Masala, Dal Makhani, Mix Veg, Jeera Rice, 4 Butter Tandoori Rotis, Raita, Salad & Gulab Jamun.',
          category: 'Thali & Meals',
          price: 240,
          discountPrice: 219,
          imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 20,
        },
        {
          restaurantId: rest2._id,
          name: 'Dal Makhani Desi Ghee',
          description: 'Black lentils slow cooked overnight on charcoal tandoor and finished with pure desi ghee and butter.',
          category: 'North Indian',
          price: 180,
          discountPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 15,
        },
        {
          restaurantId: rest2._id,
          name: 'Matar Paneer Homestyle',
          description: 'Soft cottage cheese and tender green peas cooked in spiced onion-tomato gravy just like home.',
          category: 'North Indian',
          price: 190,
          discountPrice: 175,
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 15,
        },
        {
          restaurantId: rest2._id,
          name: 'Crispy Masala Dosa',
          description: 'Golden fermented crepe filled with spiced potato masala, served with piping hot sambar & coconut chutney.',
          category: 'South Indian',
          price: 130,
          discountPrice: null,
          imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600',
          isVegetarian: true,
          isAvailable: true,
          prepTimeMinutes: 15,
        },
      ]);
      console.log('[Seed] Menu items seeded for Krishna Dhaba.');
    }

    // 10. Seed Demo COD Orders
    const ordersCount = await Order.countDocuments();
    if (ordersCount === 0) {
      const demoOrder = await Order.create({
        orderNumber: 'SG-261027-1001',
        customerId: customer1._id,
        restaurantId: rest1._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Lucknowi Chicken Dum Biryani',
            price: 239,
            quantity: 2,
            subtotal: 478,
            isVegetarian: false,
          },
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Gulab Jamun (2 Pcs)',
            price: 60,
            quantity: 1,
            subtotal: 60,
            isVegetarian: true,
          },
        ],
        itemSubtotal: 538,
        deliveryFee: 35,
        discount: 0,
        finalAmount: 573,
        deliveryAddress: {
          label: 'Home',
          recipientName: 'Rahul Verma',
          phone: '+919833445566',
          fullAddress: 'Flat 402, Shanti Kunj Apartments, Gomti Nagar',
          landmark: 'Near City Mall',
          city: 'Lucknow',
          pincode: '226010',
        },
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 3600000),
        paymentCollectedBy: owner1._id,
        orderStatus: 'DELIVERED',
        customerNotes: 'Please bring extra green mint chutney.',
        statusTimeline: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 7200000), note: 'Order placed via Cash on Delivery' },
          { status: 'CONFIRMED', timestamp: new Date(Date.now() - 6600000), note: 'Accepted by kitchen' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 6000000), note: 'Cooking in progress' },
          { status: 'READY_FOR_DELIVERY', timestamp: new Date(Date.now() - 4800000), note: 'Order packed' },
          { status: 'DELIVERED', timestamp: new Date(Date.now() - 3600000), note: 'Delivered by restaurant runner' },
        ],
      });

      // Sample active order
      await Order.create({
        orderNumber: 'SG-261027-1002',
        customerId: customer1._id,
        restaurantId: rest2._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Special Maharaja Veg Thali',
            price: 219,
            quantity: 1,
            subtotal: 219,
            isVegetarian: true,
          },
        ],
        itemSubtotal: 219,
        deliveryFee: 25,
        discount: 0,
        finalAmount: 244,
        deliveryAddress: {
          label: 'Home',
          recipientName: 'Rahul Verma',
          phone: '+919833445566',
          fullAddress: 'Flat 402, Shanti Kunj Apartments, Gomti Nagar',
          landmark: 'Near City Mall',
          city: 'Lucknow',
          pincode: '226010',
        },
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'PREPARING',
        customerNotes: '',
        statusTimeline: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 1200000), note: 'Order placed via Cash on Delivery' },
          { status: 'CONFIRMED', timestamp: new Date(Date.now() - 900000), note: 'Accepted by kitchen' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 300000), note: 'Kitchen preparing meal' },
        ],
      });

      console.log('[Seed] Demo orders seeded.');
    }

    console.log('\n======================================================');
    console.log('✅ SwadGhar Database Seeding Complete!');
    console.log('------------------------------------------------------');
    console.log('Super Admin:');
    console.log(`  Email:    ${adminEmail}`);
    console.log('  Password: Admin@SwadGhar2026');
    console.log('------------------------------------------------------');
    console.log('Restaurant Owner 1 (Zaika Biryani):');
    console.log('  Email:    lucknow.zaika@swadghar.com');
    console.log('  Password: OwnerPassword@123');
    console.log('------------------------------------------------------');
    console.log('Restaurant Owner 2 (Krishna Dhaba):');
    console.log('  Email:    krishna.dhaba@swadghar.com');
    console.log('  Password: OwnerPassword@123');
    console.log('------------------------------------------------------');
    console.log('Customer:');
    console.log('  Email:    customer@swadghar.com');
    console.log('  Password: CustomerPassword@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedAll();
