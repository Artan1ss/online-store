import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { AuthOptions } from 'next-auth';
import { prisma, withPrismaClient } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// For emergency login - hardcoded admin
// Note: This should be removed in a real production environment
const EMERGENCY_ADMIN = {
  id: 'emergency-admin',
  email: 'emergency@admin.com',
  name: 'Emergency Admin',
  role: 'ADMIN',
  // Password: EmergencyAdmin123!
  password: '$2b$10$8cH2hJNAJWfIcDY4dPh0FuOsnrjqvcsQEeZZcXmTwx4GS2HoK8AGq'
};

// Extend Session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        // Check for emergency admin login first
        if (credentials.email === EMERGENCY_ADMIN.email) {
          console.log('Emergency admin login attempt');
          
          try {
            // Check emergency admin password
            const isValidEmergency = await bcrypt.compare(
              credentials.password,
              EMERGENCY_ADMIN.password
            );
            
            if (isValidEmergency) {
              console.log('Emergency admin login successful');
              return {
                id: EMERGENCY_ADMIN.id,
                email: EMERGENCY_ADMIN.email,
                name: EMERGENCY_ADMIN.name,
                role: EMERGENCY_ADMIN.role
              };
            } else {
              console.log('Emergency admin login failed: wrong password');
            }
          } catch (error) {
            console.error('Error verifying emergency admin password:', error);
          }
        }

        // Proceed with normal database auth
        try {
          // Use the withPrismaClient helper for better connection handling
          return await withPrismaClient(async (prisma) => {
            console.log(`Attempting login for user: ${credentials.email}`);
            
            const user = await prisma.user.findUnique({
              where: { email: credentials.email }
            });

            if (!user) {
              console.log(`No user found with email: ${credentials.email}`);
              throw new Error('No user found with this email');
            }

            // For bcryptjs or bcrypt
            let isValid = false;
            try {
              isValid = await compare(credentials.password, user.password);
            } catch (compareError) {
              console.error('Password comparison error:', compareError);
              throw new Error('Error verifying password');
            }

            if (!isValid) {
              console.log(`Invalid password for user: ${credentials.email}`);
              throw new Error('Invalid password');
            }

            console.log(`Successful login for user: ${credentials.email}, role: ${user.role}`);
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            };
          });
        } catch (error) {
          console.error('Authorization error:', error);
          // If there's a database error, still allow emergency admin to log in
          if (credentials.email === EMERGENCY_ADMIN.email) {
            // Don't throw, just return null so it continues to next auth provider
            return null;
          }
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.id = user.id as string;
      } else {
        token.role = token.role || 'USER';
        token.id = token.id || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role || 'USER';
        session.user.id = token.id || '';
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-default-secure-secret-here'
};

export default NextAuth(authOptions); 