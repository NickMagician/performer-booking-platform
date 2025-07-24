import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { 
  createPerformerSchema, 
  updatePerformerSchema, 
  performerSearchSchema,
  idParamSchema,
  CreatePerformerInput, 
  UpdatePerformerInput, 
  PerformerSearchInput,
  IdParam 
} from '../lib/validation';
import { AppError, asyncHandler } from '../middleware/error';

/**
 * Create performer profile
 * POST /api/performers
 */
export const createPerformer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  if (req.user.userType !== 'PERFORMER') {
    throw new AppError('Only performers can create performer profiles', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  // Check if performer profile already exists
  const existingPerformer = await prisma.performer.findUnique({
    where: { user_id: req.user.id },
  });

  if (existingPerformer) {
    throw new AppError('Performer profile already exists', 409, 'PROFILE_EXISTS');
  }

  // Validate request body
  const validatedData: CreatePerformerInput = createPerformerSchema.parse(req.body);

  // Verify categories exist
  const categoryIds = validatedData.categories.map(cat => cat.categoryId);
  const existingCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });

  if (existingCategories.length !== categoryIds.length) {
    throw new AppError('One or more categories do not exist', 400, 'INVALID_CATEGORIES');
  }

  // Ensure only one primary category
  const primaryCategories = validatedData.categories.filter(cat => cat.isPrimary);
  if (primaryCategories.length > 1) {
    throw new AppError('Only one category can be marked as primary', 400, 'MULTIPLE_PRIMARY_CATEGORIES');
  }

  // Create performer profile with categories
  const performer = await prisma.performer.create({
    data: {
      user_id: req.user.id,
      business_name: validatedData.businessName,
      bio: validatedData.bio,
      location: validatedData.location,
      postcode: validatedData.postcode,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      travel_distance: validatedData.travelDistance,
      base_price: validatedData.basePrice,
      price_per_hour: validatedData.pricePerHour,
      minimum_booking_hours: validatedData.minimumBookingHours,
      setup_time_minutes: validatedData.setupTimeMinutes,
      website_url: validatedData.websiteUrl,
      facebook_url: validatedData.facebookUrl,
      instagram_url: validatedData.instagramUrl,
      youtube_url: validatedData.youtubeUrl,
      categories: {
        create: validatedData.categories.map(cat => ({
          category_id: cat.categoryId,
          is_primary: cat.isPrimary,
        })),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          profile_image_url: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Performer profile created successfully',
    data: {
      performer: {
        id: performer.id,
        userId: performer.user_id,
        businessName: performer.business_name,
        bio: performer.bio,
        location: performer.location,
        postcode: performer.postcode,
        coordinates: performer.latitude && performer.longitude ? {
          latitude: performer.latitude,
          longitude: performer.longitude,
        } : null,
        travelDistance: performer.travel_distance,
        basePrice: performer.base_price,
        pricePerHour: performer.price_per_hour,
        minimumBookingHours: performer.minimum_booking_hours,
        setupTimeMinutes: performer.setup_time_minutes,
        websiteUrl: performer.website_url,
        facebookUrl: performer.facebook_url,
        instagramUrl: performer.instagram_url,
        youtubeUrl: performer.youtube_url,
        isVerified: performer.is_verified,
        isFeatured: performer.is_featured,
        averageRating: performer.average_rating,
        totalReviews: performer.total_reviews,
        totalBookings: performer.total_bookings,
        createdAt: performer.created_at,
        user: {
          id: performer.user.id,
          email: performer.user.email,
          firstName: performer.user.first_name,
          lastName: performer.user.last_name,
          phone: performer.user.phone,
          profileImageUrl: performer.user.profile_image_url,
        },
        categories: performer.categories.map(pc => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          isPrimary: pc.is_primary,
        })),
      },
    },
  });
});

/**
 * Get performer profile by ID
 * GET /api/performers/:id
 */
export const getPerformer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id }: IdParam = idParamSchema.parse(req.params);

  const performer = await prisma.performer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          profile_image_url: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon_url: true,
            },
          },
        },
      },
      media: {
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          file_url: true,
          file_type: true,
          title: true,
          description: true,
          is_featured: true,
        },
      },
      testimonials: {
        where: { is_featured: true },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          client_name: true,
          event_type: true,
          content: true,
          rating: true,
          event_date: true,
          is_verified: true,
        },
      },
      reviews: {
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          overall_rating: true,
          title: true,
          content: true,
          would_recommend: true,
          created_at: true,
          client: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  });

  if (!performer) {
    throw new AppError('Performer not found', 404, 'PERFORMER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      performer: {
        id: performer.id,
        userId: performer.user_id,
        businessName: performer.business_name,
        bio: performer.bio,
        location: performer.location,
        postcode: performer.postcode,
        coordinates: performer.latitude && performer.longitude ? {
          latitude: performer.latitude,
          longitude: performer.longitude,
        } : null,
        travelDistance: performer.travel_distance,
        basePrice: performer.base_price,
        pricePerHour: performer.price_per_hour,
        minimumBookingHours: performer.minimum_booking_hours,
        setupTimeMinutes: performer.setup_time_minutes,
        websiteUrl: performer.website_url,
        facebookUrl: performer.facebook_url,
        instagramUrl: performer.instagram_url,
        youtubeUrl: performer.youtube_url,
        isVerified: performer.is_verified,
        isFeatured: performer.is_featured,
        averageRating: performer.average_rating,
        totalReviews: performer.total_reviews,
        totalBookings: performer.total_bookings,
        responseRate: performer.response_rate,
        responseTimeHours: performer.response_time_hours,
        createdAt: performer.created_at,
        updatedAt: performer.updated_at,
        user: {
          id: performer.user.id,
          email: performer.user.email,
          firstName: performer.user.first_name,
          lastName: performer.user.last_name,
          phone: performer.user.phone,
          profileImageUrl: performer.user.profile_image_url,
        },
        categories: performer.categories.map(pc => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          description: pc.category.description,
          iconUrl: pc.category.icon_url,
          isPrimary: pc.is_primary,
        })),
        media: performer.media,
        testimonials: performer.testimonials,
        reviews: performer.reviews.map(review => ({
          id: review.id,
          overallRating: review.overall_rating,
          title: review.title,
          content: review.content,
          wouldRecommend: review.would_recommend,
          createdAt: review.created_at,
          client: {
            firstName: review.client.first_name,
            lastName: review.client.last_name,
          },
        })),
      },
    },
  });
});

/**
 * Update performer profile
 * PUT /api/performers/:id
 */
export const updatePerformer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const { id }: IdParam = idParamSchema.parse(req.params);

  // Check if performer exists and belongs to current user
  const existingPerformer = await prisma.performer.findUnique({
    where: { id },
    select: { id: true, user_id: true },
  });

  if (!existingPerformer) {
    throw new AppError('Performer not found', 404, 'PERFORMER_NOT_FOUND');
  }

  if (existingPerformer.user_id !== req.user.id && req.user.userType !== 'ADMIN') {
    throw new AppError('You can only update your own performer profile', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  // Validate request body
  const validatedData: UpdatePerformerInput = updatePerformerSchema.parse(req.body);

  // Handle category updates if provided
  if (validatedData.categories) {
    const categoryIds = validatedData.categories.map(cat => cat.categoryId);
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (existingCategories.length !== categoryIds.length) {
      throw new AppError('One or more categories do not exist', 400, 'INVALID_CATEGORIES');
    }

    // Ensure only one primary category
    const primaryCategories = validatedData.categories.filter(cat => cat.isPrimary);
    if (primaryCategories.length > 1) {
      throw new AppError('Only one category can be marked as primary', 400, 'MULTIPLE_PRIMARY_CATEGORIES');
    }

    // Update categories
    await prisma.performerCategory.deleteMany({
      where: { performer_id: id },
    });

    await prisma.performerCategory.createMany({
      data: validatedData.categories.map(cat => ({
        performer_id: id,
        category_id: cat.categoryId,
        is_primary: cat.isPrimary,
      })),
    });
  }

  // Update performer profile
  const performer = await prisma.performer.update({
    where: { id },
    data: {
      business_name: validatedData.businessName,
      bio: validatedData.bio,
      location: validatedData.location,
      postcode: validatedData.postcode,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      travel_distance: validatedData.travelDistance,
      base_price: validatedData.basePrice,
      price_per_hour: validatedData.pricePerHour,
      minimum_booking_hours: validatedData.minimumBookingHours,
      setup_time_minutes: validatedData.setupTimeMinutes,
      website_url: validatedData.websiteUrl,
      facebook_url: validatedData.facebookUrl,
      instagram_url: validatedData.instagramUrl,
      youtube_url: validatedData.youtubeUrl,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          profile_image_url: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'Performer profile updated successfully',
    data: {
      performer: {
        id: performer.id,
        userId: performer.user_id,
        businessName: performer.business_name,
        bio: performer.bio,
        location: performer.location,
        postcode: performer.postcode,
        coordinates: performer.latitude && performer.longitude ? {
          latitude: performer.latitude,
          longitude: performer.longitude,
        } : null,
        travelDistance: performer.travel_distance,
        basePrice: performer.base_price,
        pricePerHour: performer.price_per_hour,
        minimumBookingHours: performer.minimum_booking_hours,
        setupTimeMinutes: performer.setup_time_minutes,
        websiteUrl: performer.website_url,
        facebookUrl: performer.facebook_url,
        instagramUrl: performer.instagram_url,
        youtubeUrl: performer.youtube_url,
        isVerified: performer.is_verified,
        isFeatured: performer.is_featured,
        averageRating: performer.average_rating,
        totalReviews: performer.total_reviews,
        totalBookings: performer.total_bookings,
        updatedAt: performer.updated_at,
        user: {
          id: performer.user.id,
          email: performer.user.email,
          firstName: performer.user.first_name,
          lastName: performer.user.last_name,
          phone: performer.user.phone,
          profileImageUrl: performer.user.profile_image_url,
        },
        categories: performer.categories.map(pc => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          isPrimary: pc.is_primary,
        })),
      },
    },
  });
});

/**
 * List/search performers
 * GET /api/performers
 */
export const getPerformers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const searchParams: PerformerSearchInput = performerSearchSchema.parse(req.query);

  // Build where clause for filtering
  const where: any = {};

  if (searchParams.query) {
    where.OR = [
      { business_name: { contains: searchParams.query, mode: 'insensitive' } },
      { bio: { contains: searchParams.query, mode: 'insensitive' } },
      { location: { contains: searchParams.query, mode: 'insensitive' } },
      { user: { 
        OR: [
          { first_name: { contains: searchParams.query, mode: 'insensitive' } },
          { last_name: { contains: searchParams.query, mode: 'insensitive' } },
        ]
      }},
    ];
  }

  if (searchParams.category) {
    where.categories = {
      some: {
        category: {
          slug: searchParams.category,
        },
      },
    };
  }

  if (searchParams.location) {
    where.location = { contains: searchParams.location, mode: 'insensitive' };
  }

  if (searchParams.minPrice !== undefined || searchParams.maxPrice !== undefined) {
    where.base_price = {};
    if (searchParams.minPrice !== undefined) {
      where.base_price.gte = searchParams.minPrice;
    }
    if (searchParams.maxPrice !== undefined) {
      where.base_price.lte = searchParams.maxPrice;
    }
  }

  if (searchParams.minRating !== undefined) {
    where.average_rating = { gte: searchParams.minRating };
  }

  if (searchParams.isVerified !== undefined) {
    where.is_verified = searchParams.isVerified;
  }

  if (searchParams.isFeatured !== undefined) {
    where.is_featured = searchParams.isFeatured;
  }

  // Build order by clause
  const orderBy: any = {};
  switch (searchParams.sortBy) {
    case 'price':
      orderBy.base_price = searchParams.sortOrder;
      break;
    case 'rating':
      orderBy.average_rating = searchParams.sortOrder;
      break;
    case 'newest':
      orderBy.created_at = searchParams.sortOrder;
      break;
    case 'popularity':
    default:
      orderBy.total_bookings = searchParams.sortOrder;
      break;
  }

  // Calculate pagination
  const skip = (searchParams.page - 1) * searchParams.limit;

  // Get performers with total count
  const [performers, totalCount] = await Promise.all([
    prisma.performer.findMany({
      where,
      orderBy,
      skip,
      take: searchParams.limit,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        media: {
          where: { is_featured: true },
          take: 1,
          select: {
            file_url: true,
            file_type: true,
          },
        },
      },
    }),
    prisma.performer.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / searchParams.limit);

  res.json({
    success: true,
    data: {
      performers: performers.map(performer => ({
        id: performer.id,
        userId: performer.user_id,
        businessName: performer.business_name,
        location: performer.location,
        basePrice: performer.base_price,
        pricePerHour: performer.price_per_hour,
        isVerified: performer.is_verified,
        isFeatured: performer.is_featured,
        averageRating: performer.average_rating,
        totalReviews: performer.total_reviews,
        totalBookings: performer.total_bookings,
        user: {
          id: performer.user.id,
          firstName: performer.user.first_name,
          lastName: performer.user.last_name,
          profileImageUrl: performer.user.profile_image_url,
        },
        categories: performer.categories.map(pc => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          isPrimary: pc.is_primary,
        })),
        featuredMedia: performer.media[0] || null,
      })),
      pagination: {
        page: searchParams.page,
        limit: searchParams.limit,
        totalCount,
        totalPages,
        hasNextPage: searchParams.page < totalPages,
        hasPreviousPage: searchParams.page > 1,
      },
    },
  });
});
