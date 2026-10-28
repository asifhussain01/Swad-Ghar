# SwadGhar (घर का स्वाद, हर घर तक)

Modern Food Ordering Platform inspired by Zomato, specifically designed for Indian cities, towns, and rural regions with **Cash on Delivery (COD) Only** and **Independent Restaurant Delivery**.

---

## 🏗️ Platform Architecture

SwadGhar consists of **3 separate client interfaces** connected to **1 shared Express & MongoDB Atlas backend**:

1. **Customer Mobile App** (`customer-app/`): React Native with Expo, NativeWind, React Navigation. Allows discovering local restaurants, browsing vegetarian/non-veg dishes, single-restaurant cart management, address saving, and COD checkout.
2. **Restaurant Owner Mobile App** (`restaurant-app/`): React Native with Expo, NativeWind, React Navigation. Allows kitchen owners to manage open/closed status, accept/reject incoming orders, update cooking stages (`PREPARING` -> `READY_FOR_DELIVERY` -> `DELIVERED`), and explicitly confirm cash collection (`confirmCODPayment`).
3. **Admin Web Application** (`admin-web/`): React.js with Tailwind CSS, React Router, Recharts, and Lucide React. Real-time dashboard with metrics, partner approvals/rejections with mandatory reasons, customer suspension controls, COD cash reconciliation, and immutable audit logs.
4. **Shared Backend** (`backend/`): Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.IO for live kitchen alerts, bcrypt, JWT authentication, and Joi validation schemas.

---

## 🔑 Demo Seed Accounts

The platform comes pre-seeded with live data on MongoDB Atlas:

| Role | Email | Password | Details |
|---|---|---|---|
| **Super Admin** | `admin@swadghar.com` | `Admin@SwadGhar2026` | Full platform control & audit logs |
| **Restaurant Partner 1** | `lucknow.zaika@swadghar.com` | `OwnerPassword@123` | Zaika Biryani & Mughlai Mahal (Approved) |
| **Restaurant Partner 2** | `krishna.dhaba@swadghar.com` | `OwnerPassword@123` | Shree Krishna Shuddh Shakahari Dhaba (Approved) |
| **Customer** | `customer@swadghar.com` | `CustomerPassword@123` | Pre-saved Lucknow delivery address |

---

## 🚀 Quick Start Guide

You can launch all 4 components using the pre-configured Windows batch files or via terminal:

| Service | 1-Click Launcher | Manual Terminal Command | Port / Target |
|---|---|---|---|
| **Shared Backend** | `start-backend.bat` | `cd backend && npm start` | `http://localhost:5000` |
| **Admin Web Portal** | `start-admin.bat` | `cd admin-web && npm run dev` | `http://localhost:5173` |
| **Customer App** | `start-customer-app.bat` | `cd customer-app && npx expo start` | Press `w` (Web) or Expo Go |
| **Restaurant App** | `start-restaurant-app.bat` | `cd restaurant-app && npx expo start` | Press `w` (Web) or Expo Go |

Log in with:
- Email: `admin@swadghar.com`
- Password: `Admin@SwadGhar2026`

### 3. Customer Mobile App Setup

```bash
cd customer-app
npm install
npm start        # Launches Expo development server
```

Press `w` to open in web browser, or scan the QR code with the **Expo Go** mobile app on Android/iOS.

### 4. Restaurant Owner Mobile App Setup

```bash
cd restaurant-app
npm install
npm start        # Launches Expo development server
```

Press `w` to open in web browser, or scan the QR code with the **Expo Go** mobile app on Android/iOS.

---

## 🛡️ Strict Business Rules

1. **Cash on Delivery (COD) Only**:
   - Every order initializes with `paymentStatus: 'PENDING'`.
   - Changing status to `DELIVERED` does **not** automatically mark an order as paid.
   - The restaurant owner or an authorized administrator must explicitly record cash receipt (`PAID`).
2. **Independent Restaurant Delivery**:
   - Restaurants arrange their own deliveries using in-house staff or local runners.
   - There are no rider applications, rider GPS tracking, or delivery commissions.
3. **Immutable Order Snapshots**:
   - Food titles, item unit prices, quantities, and delivery addresses are frozen into the `Order` record at checkout time to preserve historical integrity.
