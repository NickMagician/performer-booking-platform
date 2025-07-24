import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { createReviewSchema, reviewListSchema } from '../lib/validation';

// Helper function to calculate performer average rating
const updatePerformerAverageRating = async (performerId: string) => {
  const reviews = await prisma.review.findMany({
    where: { performer_id: performerId },
    select: {
      rating_overall: true,
      rating_quality: true,
      rating_communication: true,
    }
  });

  if (reviews.length === 0) return;

  const totalOverall = reviews.reduce((sum, review) => sum + review.rating_overall, 0);
  const totalQuality = reviews.reduce((sum, review) => sum + review.rating_quality, 0);
  const totalCommunication = reviews.reduce((sum, review) => sum + review.rating_communication, 0);

  const avgOverall = totalOverall / reviews.length;
  const avgQuality = totalQuality / reviews.length;
  const avgCommunication = totalCommunication / reviews.length;
  const avgRating = (avgOverall + avgQuality + avgCommunication) / 3;

  await prisma.performer.update({
    where: { id: performerId },
    data: {
      average_rating: avgRating,
      total_reviews: reviews.length,
    }
  });
};

// Create review for completed booking
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const validatedData = createReviewSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if booking exists and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, first_name: true, last_name: true } },
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        },
        review: true
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check if user is the client who made the booking
    if (booking.client_id !== userId) {
      throw new AppError('Only the booking client can leave a review', 403);
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      throw new AppError('Reviews can only be left for completed bookings', 400);
    }

    // Check if review already exists (prevent duplicates)
    if (booking.review) {
      throw new AppError('Review already exists for this booking', 400);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        booking_id: bookingId,
        client_id: userId,
        performer_id: booking.performer_id,
        rating_overall: validatedData.ratingOverall,
        rating_quality: validatedData.ratingQuality,
        rating_communication: validatedData.ratingCommunication,
        written_review: validatedData.writtenReview,
        event_type: validatedData.eventType,
        photos: validatedData.photos || [],
      },
      include: {
        client: { select: { id: true, first_name: true, last_name: true } },
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        }
      }
    });

    // Update performer's average rating
    await updatePerformerAverageRating(booking.performer_id);

    // Mock notification to performer
    console.log(`📧 Mock notification: New review from ${review.client.first_name} ${review.client.last_name} for ${review.performer.user.first_name} ${review.performer.user.last_name} - ${validatedData.ratingOverall}/5 stars`);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        review: {
          id: review.id,
          bookingId: review.booking_id,
          ratingOverall: review.rating_overall,
          ratingQuality: review.rating_quality,
          ratingCommunication: review.rating_communication,
          writtenReview: review.written_review,
          eventType: review.event_type,
          photos: review.photos,
          isVerified: review.is_verified,
          client: review.client,
          performer: {
            id: review.performer.id,
            businessName: review.performer.business_name,
            user: review.performer.user
          },
          createdAt: review.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a performer (public endpoint)
export const getPerformerReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { performerId } = req.params;
    const validatedQuery = reviewListSchema.parse(req.query);
    
    const { page = 1, limit = 10, eventType, minRating, isVerified } = validatedQuery;
    const skip = (page - 1) * limit;

    // Check if performer exists
    const performer = await prisma.performer.findUnique({
      where: { id: performerId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    if (!performer) {
      throw new AppError('Performer not found', 404);
    }

    // Build where clause
    const whereClause: any = {
      performer_id: performerId
    };

    if (eventType) {
      whereClause.event_type = eventType;
    }

    if (minRating) {
      whereClause.rating_overall = {
        gte: minRating
      };
    }

    if (isVerified !== undefined) {
      whereClause.is_verified = isVerified;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          client: { select: { id: true, first_name: true, last_name: true } },
          booking: { 
            select: { 
              id: true, 
              event_date: true, 
              event_location: true 
            } 
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: whereClause })
    ]);

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      bookingId: review.booking_id,
      ratingOverall: review.rating_overall,
      ratingQuality: review.rating_quality,
      ratingCommunication: review.rating_communication,
      writtenReview: review.written_review,
      eventType: review.event_type,
      photos: review.photos,
      isVerified: review.is_verified,
      client: {
        id: review.client.id,
        firstName: review.client.first_name,
        lastName: review.client.last_name
      },
      booking: {
        id: review.booking.id,
        eventDate: review.booking.event_date,
        eventLocation: review.booking.event_location
      },
      createdAt: review.created_at
    }));

    // Calculate rating statistics
    const ratingStats = {
      averageOverall: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length : 0,
      averageQuality: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating_quality, 0) / reviews.length : 0,
      averageCommunication: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating_communication, 0) / reviews.length : 0,
      totalReviews: total,
      ratingDistribution: {
        5: reviews.filter(r => r.rating_overall === 5).length,
        4: reviews.filter(r => r.rating_overall === 4).length,
        3: reviews.filter(r => r.rating_overall === 3).length,
        2: reviews.filter(r => r.rating_overall === 2).length,
        1: reviews.filter(r => r.rating_overall === 1).length,
      }
    };

    res.json({
      success: true,
      data: {
        performer: {
          id: performer.id,
          businessName: performer.business_name,
          user: performer.user
        },
        reviews: formattedReviews,
        statistics: ratingStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
