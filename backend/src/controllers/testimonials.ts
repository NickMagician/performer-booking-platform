import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { createTestimonialSchema, testimonialListSchema } from '../lib/validation';

// Create testimonial (admin only)
export const createTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTestimonialSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if user is admin
    if (req.user!.user_type !== 'ADMIN') {
      throw new AppError('Only admins can create testimonials', 403);
    }

    // Check if performer exists
    const performer = await prisma.performer.findUnique({
      where: { id: validatedData.performerId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    if (!performer) {
      throw new AppError('Performer not found', 404);
    }

    // If setting as featured, unset other featured testimonials for this performer
    if (validatedData.isFeatured) {
      await prisma.testimonial.updateMany({
        where: { 
          performer_id: validatedData.performerId,
          is_featured: true 
        },
        data: { is_featured: false }
      });
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        performer_id: validatedData.performerId,
        author_name: validatedData.authorName,
        quote: validatedData.quote,
        event_type: validatedData.eventType,
        is_featured: validatedData.isFeatured,
        submitted_by_user_id: userId,
      },
      include: {
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        },
        submitted_by_user: { 
          select: { id: true, first_name: true, last_name: true } 
        }
      }
    });

    // Mock notification to performer
    console.log(`📧 Mock notification: New testimonial added for ${performer.user.first_name} ${performer.user.last_name} by admin`);

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: {
        testimonial: {
          id: testimonial.id,
          performerId: testimonial.performer_id,
          authorName: testimonial.author_name,
          quote: testimonial.quote,
          eventType: testimonial.event_type,
          isFeatured: testimonial.is_featured,
          performer: {
            id: testimonial.performer.id,
            businessName: testimonial.performer.business_name,
            user: testimonial.performer.user
          },
          submittedBy: testimonial.submitted_by_user,
          createdAt: testimonial.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get testimonials for a performer (public endpoint)
export const getPerformerTestimonials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { performerId } = req.params;
    const validatedQuery = testimonialListSchema.parse(req.query);
    
    const { page = 1, limit = 10, eventType, isFeatured } = validatedQuery;
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

    if (isFeatured !== undefined) {
      whereClause.is_featured = isFeatured;
    }

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where: whereClause,
        include: {
          submitted_by_user: { 
            select: { id: true, first_name: true, last_name: true } 
          }
        },
        orderBy: [
          { is_featured: 'desc' }, // Featured testimonials first
          { created_at: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.testimonial.count({ where: whereClause })
    ]);

    const formattedTestimonials = testimonials.map(testimonial => ({
      id: testimonial.id,
      performerId: testimonial.performer_id,
      authorName: testimonial.author_name,
      quote: testimonial.quote,
      eventType: testimonial.event_type,
      isFeatured: testimonial.is_featured,
      submittedBy: testimonial.submitted_by_user,
      createdAt: testimonial.created_at
    }));

    // Get featured testimonials count
    const featuredCount = await prisma.testimonial.count({
      where: { 
        performer_id: performerId,
        is_featured: true 
      }
    });

    res.json({
      success: true,
      data: {
        performer: {
          id: performer.id,
          businessName: performer.business_name,
          user: performer.user
        },
        testimonials: formattedTestimonials,
        statistics: {
          totalTestimonials: total,
          featuredTestimonials: featuredCount,
          eventTypeBreakdown: {
            WEDDING: testimonials.filter(t => t.event_type === 'WEDDING').length,
            BIRTHDAY: testimonials.filter(t => t.event_type === 'BIRTHDAY').length,
            CORPORATE: testimonials.filter(t => t.event_type === 'CORPORATE').length,
            OTHER: testimonials.filter(t => t.event_type === 'OTHER').length,
          }
        },
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

// Toggle featured status of testimonial (admin only)
export const toggleFeaturedTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testimonialId } = req.params;
    const userId = req.user!.id;

    // Check if user is admin
    if (req.user!.user_type !== 'ADMIN') {
      throw new AppError('Only admins can toggle featured testimonials', 403);
    }

    // Find testimonial
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
      include: {
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        }
      }
    });

    if (!testimonial) {
      throw new AppError('Testimonial not found', 404);
    }

    const newFeaturedStatus = !testimonial.is_featured;

    // If setting as featured, unset other featured testimonials for this performer
    if (newFeaturedStatus) {
      await prisma.testimonial.updateMany({
        where: { 
          performer_id: testimonial.performer_id,
          is_featured: true,
          id: { not: testimonialId }
        },
        data: { is_featured: false }
      });
    }

    // Update testimonial
    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { is_featured: newFeaturedStatus },
      include: {
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        },
        submitted_by_user: { 
          select: { id: true, first_name: true, last_name: true } 
        }
      }
    });

    // Mock notification
    console.log(`📧 Mock notification: Testimonial for ${testimonial.performer.user.first_name} ${testimonial.performer.user.last_name} ${newFeaturedStatus ? 'featured' : 'unfeatured'} by admin`);

    res.json({
      success: true,
      message: `Testimonial ${newFeaturedStatus ? 'featured' : 'unfeatured'} successfully`,
      data: {
        testimonial: {
          id: updatedTestimonial.id,
          performerId: updatedTestimonial.performer_id,
          authorName: updatedTestimonial.author_name,
          quote: updatedTestimonial.quote,
          eventType: updatedTestimonial.event_type,
          isFeatured: updatedTestimonial.is_featured,
          performer: {
            id: updatedTestimonial.performer.id,
            businessName: updatedTestimonial.performer.business_name,
            user: updatedTestimonial.performer.user
          },
          submittedBy: updatedTestimonial.submitted_by_user,
          createdAt: updatedTestimonial.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
