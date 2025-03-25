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
  debug: true, // Enable debug mode always for troubleshooting
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Auth attempt with credentials:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password');
          throw new Error('Please enter an email and password');
        }

        // Check for emergency admin login first
        if (credentials.email === EMERGENCY_ADMIN.email) {
          console.log('Emergency admin login attempt');
          
          try {
            // Check emergency admin password with both bcrypt and direct comparison as fallbacks
            let isValidEmergency = false;
            
            // First try bcrypt comparison
            try {
              isValidEmergency = await bcrypt.compare(
                credentials.password,
                EMERGENCY_ADMIN.password
              );
              console.log('Bcrypt compare result:', isValidEmergency);
            } catch (bcryptError) {
              console.error('Bcrypt comparison error:', bcryptError);
              // Fallback to direct string comparison in case of encoding issues
              isValidEmergency = credentials.password === 'EmergencyAdmin123!';
              console.log('Direct password comparison:', isValidEmergency);
            }
            
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
              return null;
            }
          } catch (error) {
            console.error('Error verifying emergency admin password:', error);
            return null;
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
          // Just return null on error to allow emergency admin handling
          return null;
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
        console.log('JWT callback with user:', user);
        token.role = user.role as string;
        token.id = user.id as string;
      } else {
        console.log('JWT callback without user, using existing token:', token);
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        console.log('Session callback with token:', token);
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