# Order Management System

A modern order management application built with Next.js, MongoDB, and JWT authentication.

## Features

- **JWT Authentication** - Single admin account authentication
- **Order CRUD Operations** - Create, Read, Update, and Delete orders
- **Modern UI** - Beautiful, responsive interface with dark mode support
- **MongoDB Database** - Fast and scalable data storage

## Order Fields

Each order contains:
- **Item ID** - Unique identifier for the item
- **Item Name** - Name of the item
- **Client Name** - Name of the client
- **Stock Count** - Current stock count

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- MongoDB (local or MongoDB Atlas)

### MongoDB Setup

1. **Local MongoDB**:
   - Install MongoDB locally from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

2. **MongoDB Atlas** (Cloud):
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

### Environment Variables

Create a `.env` file in the root directory with your MongoDB connection and admin credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/order-management
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/order-management

# JWT Secret (change this to a random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Admin Account Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password-here
```

You can copy `.env.example` to `.env` and fill in the values.

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Seed the admin account:

```bash
pnpm seed:admin
```

This will create the admin account using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file. If the account already exists, the script will skip creation.

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. Sign in with the admin credentials you set in `.env`

## Usage

1. **Sign In**: Sign in with the admin email and password from your `.env` file
2. **Create Order**: Click "New Order" and fill in the order details
3. **View Orders**: All orders are displayed in a grid layout
4. **Edit Order**: Click "Edit" on any order card to modify it
5. **Delete Order**: Click "Delete" on any order card to remove it

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx             # Main page (auth + orders)
├── components/
│   ├── AuthForm.tsx         # Login/Signup form
│   ├── OrderCard.tsx        # Order display card
│   ├── OrderForm.tsx        # Create/Edit order form
│   └── OrderList.tsx        # Order list with CRUD operations
├── contexts/
│   └── AuthContext.tsx      # Firebase Auth context
├── lib/
│   ├── firebase/
│   │   └── config.ts        # Firebase initialization
│   └── services/
│       └── orderService.ts  # Order CRUD operations
└── types/
    └── order.ts             # TypeScript types for orders
```

## Technologies

- **Next.js 16** - React framework
- **Firebase Auth** - Authentication
- **Firestore** - Database
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Deploy on Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy!

Make sure to add all the environment variables (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) in your Vercel project settings.
