import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { paginationSchema, PaginationInput } from '../lib/validation';
import { asyncHandler } from '../middleware/error';

/**
 * Get all categories
 * GET /api/categories
 */
export const getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const paginationParams: PaginationInput = paginationSchema.parse(req.query);

  // Calculate pagination
  const skip = (paginationParams.page - 1) * paginationParams.limit;

  // Get categories with performer count
  const [categories, totalCount] = await Promise.all([
    prisma.category.findMany({
      where: { is_active: true },
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' },
      ],
      skip,
      take: paginationParams.limit,
      include: {
        _count: {
          select: {
            performers: true,
          },
        },
      },
    }),
    prisma.category.count({
      where: { is_active: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / paginationParams.limit);

  res.json({
    success: true,
    data: {
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        iconUrl: category.icon_url,
        performerCount: category._count.performers,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
      })),
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        totalCount,
        totalPages,
        hasNextPage: paginationParams.page < totalPages,
        hasPreviousPage: paginationParams.page > 1,
      },
    },
  });
});

/**
 * Get category by slug
 * GET /api/categories/:slug
 */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { 
      slug,
      is_active: true,
    },
    include: {
      _count: {
        select: {
          performers: true,
        },
      },
      performers: {
        take: 10, // Featured performers in this category
        include: {
          performer: {
            select: {
              id: true,
              business_name: true,
              location: true,
              base_price: true,
              is_verified: true,
              is_featured: true,
              average_rating: true,
              total_reviews: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  profile_image_url: true,
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
          },
        },
        orderBy: [
          { performer: { is_featured: 'desc' } },
          { performer: { average_rating: 'desc' } },
        ],
      },
    },
  });

  if (!category) {
    res.status(404).json({
      success: false,
      error: 'Category not found',
      code: 'CATEGORY_NOT_FOUND',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        iconUrl: category.icon_url,
        performerCount: category._count.performers,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        featuredPerformers: category.performers.map(pc => ({
          id: pc.performer.id,
          businessName: pc.performer.business_name,
          location: pc.performer.location,
          basePrice: pc.performer.base_price,
          isVerified: pc.performer.is_verified,
          isFeatured: pc.performer.is_featured,
          averageRating: pc.performer.average_rating,
          totalReviews: pc.performer.total_reviews,
          user: {
            firstName: pc.performer.user.first_name,
            lastName: pc.performer.user.last_name,
            profileImageUrl: pc.performer.user.profile_image_url,
          },
          featuredMedia: pc.performer.media[0] || null,
        })),
      },
    },
  });
});
