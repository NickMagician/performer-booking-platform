import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { hashPassword, comparePassword, validatePasswordStrength } from '../lib/password';
import { generateTokens } from '../lib/jwt';
import { signupSchema, loginSchema, SignupInput, LoginInput } from '../lib/validation';
import { AppError, asyncHandler } from '../middleware/error';

/**
 * User signup
 * POST /auth/signup
 */
export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request body
  const validatedData: SignupInput = signupSchema.parse(req.body);

  // Validate password strength
  const passwordValidation = validatePasswordStrength(validatedData.password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      `Password validation failed: ${passwordValidation.errors.join(', ')}`,
      400,
      'WEAK_PASSWORD'
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(validatedData.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validatedData.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      phone: validatedData.phone,
      user_type: validatedData.userType,
      status: 'ACTIVE', // For now, skip email verification
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      user_type: true,
      status: true,
      created_at: true,
    },
  });

  // Generate JWT tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    userType: user.user_type,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userType: user.user_type,
        status: user.status,
        createdAt: user.created_at,
      },
      tokens,
    },
  });
});

/**
 * User login
 * POST /auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request body
  const validatedData: LoginInput = loginSchema.parse(req.body);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      password_hash: true,
      first_name: true,
      last_name: true,
      phone: true,
      user_type: true,
      status: true,
      profile_image_url: true,
      created_at: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is active
  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is not active', 401, 'ACCOUNT_INACTIVE');
  }

  // Verify password
  const isPasswordValid = await comparePassword(validatedData.password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate JWT tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    userType: user.user_type,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userType: user.user_type,
        status: user.status,
        profileImageUrl: user.profile_image_url,
        createdAt: user.created_at,
      },
      tokens,
    },
  });
});

/**
 * Get current user profile
 * GET /users/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Fetch complete user profile
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      user_type: true,
      status: true,
      profile_image_url: true,
      email_verified: true,
      last_login: true,
      created_at: true,
      updated_at: true,
      // Include performer profile if user is a performer
      performer: {
        select: {
          id: true,
          business_name: true,
          bio: true,
          location: true,
          is_verified: true,
          is_featured: true,
          average_rating: true,
          total_reviews: true,
          total_bookings: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userType: user.user_type,
        status: user.status,
        profileImageUrl: user.profile_image_url,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        ...(user.performer && {
          performer: {
            id: user.performer.id,
            businessName: user.performer.business_name,
            bio: user.performer.bio,
            location: user.performer.location,
            isVerified: user.performer.is_verified,
            isFeatured: user.performer.is_featured,
            averageRating: user.performer.average_rating,
            totalReviews: user.performer.total_reviews,
            totalBookings: user.performer.total_bookings,
          },
        }),
      },
    },
  });
});

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // This would typically use a refresh token stored in httpOnly cookie
  // For now, we'll just return a new token based on the current user
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const tokens = generateTokens({
    userId: req.user.id,
    email: req.user.email,
    userType: req.user.userType,
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { tokens },
  });
});

/**
 * Logout user
 * POST /auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a production app, you might want to blacklist the token
  // or clear refresh tokens from the database
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
