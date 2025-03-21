# Troubleshooting Guide for E-Commerce System

This guide helps you diagnose and fix common issues with the e-commerce system.

## Database-Related Issues

### Foreign Key Constraint Violations

**Problem**: When creating an order, you get a "Foreign key constraint violated" error.

**Cause**: This happens when order items reference products that don't exist in the database.

**Solution**:

1. Use the Database Management tool at `/reset-db.html` to:
   - Check database connections
   - View detailed database status
   - Repair the database by removing invalid order items
   - Check and verify cart items against the database

2. Clear your browser's local storage to reset the cart:
   - In the Database Management tool, click "Clear Cart"
   - Alternatively, in your browser's developer tools, go to Application > Local Storage and clear `cart-items`

3. Reseed products if necessary:
   - In the Database Management tool, click "Clear & Seed Products"
   - This will remove old products and create new ones

### Empty Orders

**Problem**: Orders are created but contain no items.

**Solution**:
1. Use the Database Management tool to run "Repair Database"
2. This will clean up empty orders automatically

### Database Connection Issues

**Problem**: The application cannot connect to the database.

**Solution**:
1. Verify the database connection using the "Check Database Connection" in the Database Management tool
2. Make sure your database server is running
3. Check environment variables for correct database connection details in `.env.local`

## Checkout Process Issues

### Cart Validation Failures

**Problem**: Unable to check out because cart validation fails.

**Solution**:
1. Use the "Diagnose Cart" feature in the Database Management tool
2. Clear your cart and add products again
3. Make sure you're using products from the current database

### Payment Processing Issues

**Problem**: Payment appears to process, but no order is created.

**Solution**:
1. Check browser console for errors
2. Verify all required form fields are completed
3. Check order history to see if an order was actually created but not displayed

## Debugging Tools

The following tools are available to help diagnose issues:

1. **Database Management Tool**: `/reset-db.html`
   - Database connection checking
   - Cart validation
   - Product seeding
   - Database repair

2. **API Debug Endpoints**:
   - `/api/debug/db-status` - Detailed database information
   - `/api/debug/repair-db` - Clean up invalid data
   - `/api/debug/cart-diagnosis` - Diagnose cart issues
   - `/api/products/verify-cart` - Verify cart items against the database

## Common Error Messages

- **"Foreign key constraint failed"**: A cart item references a product that doesn't exist
- **"Failed to verify cart items"**: The cart validation process encountered an error
- **"Products with ids X not found"**: The specified product IDs no longer exist in the database

## Administration

### Cleaning Up the Database

If you need to reset the database completely:

1. Use the Prisma CLI to reset the database:
   ```
   npx prisma migrate reset
   ```

2. Reinitialize with seed data:
   ```
   npm run seed
   ```

Or use the Database Management tool to:
1. Clear and seed products
2. Repair database
3. Clear cart

## Contact Support

If you continue to experience issues:

1. Check the application logs in the console
2. Provide error messages and steps to reproduce when seeking help
3. Include database status information from the Database Management tool 