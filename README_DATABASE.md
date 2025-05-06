# Database Configuration Guide

## Overview
This document provides instructions for setting up and configuring the database connection for the online store application.

## Secure Database Configuration

### Environment Variables
After updating the codebase to use environment variables, you need to set up the following in your `.env` (development) and in your production environment:

```
# Required environment variables
DATABASE_URL="postgresql://username:password@host:port/database"

# Optional variables
APP_NAME="online-store-app"
STRICT_DB_CONNECTION="false" # Set to "true" in production to fail on startup if DB connection fails
```

### Supabase Configuration

If you're using Supabase as the database provider:

1. Get your connection string from Supabase dashboard
2. Format it as: `postgresql://postgres:YOUR_PASSWORD@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`
3. Set this as your `DATABASE_URL` in your environment

## Connection Pooling

The application is configured to use connection pooling in production, which is essential for serverless environments like Vercel.

Connection pooling parameters are automatically applied with these optimizations:
- PgBouncer enabled
- Connection limit per serverless function: 1
- Connection timeout: 30 seconds 
- Statement timeout: 60 seconds
- Idle connection timeout: 60 seconds
- SSL mode: required

## Error Handling

The application includes robust error handling for database operations:

1. **Automatic Reconnection**: The system will attempt to reconnect if database connections are lost
2. **Operation Retry Logic**: Database operations can be retried automatically
3. **Timeout Handling**: Operations have configurable timeouts
4. **Connection Status Tracking**: The application keeps track of connection status for diagnostic purposes

## Diagnostic Tools

These API endpoints can be used to diagnose database issues:

- `/api/test-vercel-db` - Tests database connection in a Vercel environment
- `/api/test-supabase` - Tests Supabase-specific connectivity
- Debug page at `/debug/simple-check` for database connection testing

## Troubleshooting

If you encounter database connection issues:

1. Verify environment variables are set correctly
2. Check Supabase dashboard for service status
3. Ensure your IP is allowed in Supabase security settings 
4. Check network connectivity to the database server
5. Review application logs for specific connection errors

## Migrations & Schema Updates

When updating the database schema:

1. Update the Prisma schema
2. Run `npx prisma generate` to update the client
3. Run `npx prisma migrate dev` in development or `npx prisma migrate deploy` in production

## Security Best Practices

1. Never commit database credentials to version control
2. Rotate database passwords regularly
3. Use environment variables for all sensitive configuration
4. Limit database user permissions to only what's necessary
5. Enable SSL for all database connections 