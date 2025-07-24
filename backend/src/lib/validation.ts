import { z } from 'zod';

// User registration schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().optional(),
  userType: z.enum(['CLIENT', 'PERFORMER']).default('CLIENT'),
});

// User login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Update user profile schema
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  phone: z.string().optional(),
  profileImageUrl: z.string().url('Invalid URL').optional(),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Generic ID parameter schema
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Enquiry validation schemas
export const createEnquirySchema = z.object({
  performerId: z.string().cuid(),
  eventType: z.string().min(1, 'Event type is required'),
  eventDate: z.string().datetime('Invalid date format'),
  eventTime: z.string().optional(),
  eventDuration: z.number().min(1).max(24).optional(),
  eventLocation: z.string().min(1, 'Event location is required'),
  guestCount: z.number().min(1).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  message: z.string().min(1, 'Message is required'),
  specialRequests: z.string().optional(),
}).refine((data) => {
  if (data.budgetMin && data.budgetMax) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'Budget max must be greater than or equal to budget min',
  path: ['budgetMax'],
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  performerResponse: z.string().optional(),
  quotedPrice: z.number().min(0).optional(),
});

export const enquiryListSchema = z.object({
  status: z.enum(['PENDING', 'RESPONDED', 'ACCEPTED', 'DECLINED', 'EXPIRED']).optional(),
  performerId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  ...paginationSchema.shape,
});

// Booking validation schemas
export const confirmBookingSchema = z.object({
  confirmedPrice: z.number().min(0, 'Confirmed price must be positive'),
  eventTime: z.string().min(1, 'Event time is required'),
  eventDuration: z.number().min(1).max(24),
});

export const bookingListSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
  performerId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  ...paginationSchema.shape,
});

// Booking cancellation schema
export const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason too long'),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  rating: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema);

// Performer profile schemas
export const createPerformerSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100, 'Business name too long').optional(),
  bio: z.string().max(2000, 'Bio too long').optional(),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  postcode: z.string().max(10, 'Postcode too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  travelDistance: z.number().min(0).max(500).optional(),
  basePrice: z.number().min(0, 'Base price must be positive'),
  pricePerHour: z.number().min(0, 'Price per hour must be positive').optional(),
  minimumBookingHours: z.number().min(1).max(24).default(1),
  setupTimeMinutes: z.number().min(0).max(480).default(30),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  facebookUrl: z.string().url('Invalid Facebook URL').optional(),
  instagramUrl: z.string().url('Invalid Instagram URL').optional(),
  youtubeUrl: z.string().url('Invalid YouTube URL').optional(),
  categories: z.array(z.object({
    categoryId: z.string().cuid('Invalid category ID'),
    isPrimary: z.boolean().default(false),
  })).min(1, 'At least one category is required'),
});

export const updatePerformerSchema = createPerformerSchema.partial().omit({ categories: true }).extend({
  categories: z.array(z.object({
    categoryId: z.string().cuid('Invalid category ID'),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

// Performer search schema
export const performerSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  minRating: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional(),
  travelDistance: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  isVerified: z.string().transform(val => val === 'true').optional(),
  isFeatured: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'popularity', 'newest']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema);

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CreatePerformerInput = z.infer<typeof createPerformerSchema>;
export type UpdatePerformerInput = z.infer<typeof updatePerformerSchema>;
export type PerformerSearchInput = z.infer<typeof performerSearchSchema>;

// Message validation schemas
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  fileUrl: z.string().url('Invalid file URL').optional(),
});

export const threadListSchema = z.object({
  isArchived: z.boolean().optional(),
  ...paginationSchema.shape,
});

export const markMessageReadSchema = z.object({
  messageId: z.string().cuid('Invalid message ID'),
});

// Message type exports
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ThreadListInput = z.infer<typeof threadListSchema>;
export type MarkMessageReadInput = z.infer<typeof markMessageReadSchema>;

// Review validation schemas
export const createReviewSchema = z.object({
  ratingOverall: z.number().min(1, 'Overall rating must be at least 1').max(5, 'Overall rating must be at most 5'),
  ratingQuality: z.number().min(1, 'Quality rating must be at least 1').max(5, 'Quality rating must be at most 5'),
  ratingCommunication: z.number().min(1, 'Communication rating must be at least 1').max(5, 'Communication rating must be at most 5'),
  writtenReview: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review must be at most 2000 characters'),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'OTHER']),
  photos: z.array(z.string().url('Invalid photo URL')).max(5, 'Maximum 5 photos allowed').optional().default([]),
});

export const reviewListSchema = z.object({
  performerId: z.string().cuid('Invalid performer ID').optional(),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'OTHER']).optional(),
  minRating: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional(),
  isVerified: z.string().transform(val => val === 'true').optional(),
  ...paginationSchema.shape,
});

// Testimonial validation schemas
export const createTestimonialSchema = z.object({
  performerId: z.string().cuid('Invalid performer ID'),
  authorName: z.string().min(2, 'Author name must be at least 2 characters').max(100, 'Author name too long'),
  quote: z.string().min(10, 'Quote must be at least 10 characters').max(2000, 'Quote must be at most 2000 characters'),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'OTHER']),
  isFeatured: z.boolean().default(false),
});

export const testimonialListSchema = z.object({
  performerId: z.string().cuid('Invalid performer ID').optional(),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'OTHER']).optional(),
  isFeatured: z.string().transform(val => val === 'true').optional(),
  ...paginationSchema.shape,
});

// Review and testimonial type exports
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewListInput = z.infer<typeof reviewListSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type TestimonialListInput = z.infer<typeof testimonialListSchema>;
