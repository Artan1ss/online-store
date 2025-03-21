# NAMarket E-commerce Platform

A modern e-commerce platform built with Next.js, React, and Tailwind CSS. This application provides a full-featured shopping experience with product management, user accounts, cart functionality, and order processing.

## Features

- 🛍️ **Product Management**
  - Browse products by category
  - Featured and on-sale product displays
  - Advanced search and filtering
  - Admin product CRUD operations
  - Deals/discount management
  - Product recommendations

- 👤 **User Management**
  - Secure authentication with NextAuth.js
  - Role-based access (Admin/User)
  - Profile management
  - Address book
  - Order history

- 🛒 **Shopping Cart**
  - Add/remove items
  - Quantity adjustment
  - Real-time price calculation
  - Cart persistence
  - Automatic discount application

- 💳 **Order Management**
  - Streamlined checkout process
  - Order status tracking
  - Order history
  - Admin order management

## Tech Stack

- **Frontend Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: React Context API
- **Icons**: React Icons (FI set)

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/namarket.git
cd namarket
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file and add:
```
DATABASE_URL="postgresql://username:password@localhost:5432/namarket?schema=public"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Initialize the database
```bash
npx prisma db push
npm run seed
```

5. Start the development server
```bash
npm run dev
```

Visit http://localhost:3000 to view the application.

## Project Structure

```
namarket/
├── public/           # Static assets and images
├── prisma/           # Database schema and migrations
├── src/
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React Context providers
│   ├── lib/          # Utility functions
│   ├── pages/        # Next.js pages and API routes
│   ├── styles/       # Global styles and Tailwind config
│   └── types/        # TypeScript type definitions
└── ...
```

## Features and Usage

### Customer Features
- Browse products by category
- Add products to cart
- Apply discounts
- Complete checkout process
- Track order status
- Manage account details

### Admin Features
- Manage products (add, edit, delete)
- Set products as featured or on sale
- View and manage orders
- Manage user accounts
- Access sales analytics

## Troubleshooting

If you encounter issues, please refer to the `TROUBLESHOOTING.md` file for common problems and solutions. The application also includes a database management tool at `/reset-db.html` for administrators.

## Known Issues and Planned Improvements

- The discount calculation should be done server-side to ensure consistency
- Mobile responsiveness could be improved in some admin screens
- Order status emails are currently not being sent
- Payment processing is simulated (no real payment gateway integration)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Recent Updates & Bugfixes

- **Discount Calculation Fixes**:
  - Fixed the discount calculation in the cart to properly display original and sale prices
  - Added visual indicators for discounted items in the cart
  - Ensured consistent discount calculations across all pages

- **Cart Improvements**:
  - Added proper handling for discounted items in cart
  - Updated cart total calculation to properly reflect discounts
  - Enhanced cart UI for better visibility of savings

- **UI Enhancements**:
  - Updated the homepage banner with dynamic background image
  - Improved product card display with price formatting
  - Enhanced mobile responsiveness

- **Code Structure**:
  - Standardized discount calculation across components
  - Improved CartContext with proper type definitions
  - Better handling of cart item verification 