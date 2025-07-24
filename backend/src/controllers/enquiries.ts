import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/database';
import { AppError } from '../middleware/error';
import { 
  createEnquirySchema, 
  updateEnquiryStatusSchema, 
  enquiryListSchema 
} from '../lib/validation';

// Create new enquiry (client only)
export const createEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createEnquirySchema.parse(req.body);
    const clientId = req.user!.id;

    // Verify client user type
    if (req.user!.userType !== 'CLIENT') {
      throw new AppError('Only clients can create enquiries', 403);
    }

    // Verify performer exists and is active
    const performer = await prisma.performer.findFirst({
      where: {
        id: validatedData.performerId,
        user: {
          status: 'ACTIVE'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!performer) {
      throw new AppError('Performer not found or inactive', 404);
    }

    // Create enquiry
    const enquiry = await prisma.enquiry.create({
      data: {
        client_id: clientId,
        performer_id: performer.id,
        event_type: validatedData.eventType,
        event_date: new Date(validatedData.eventDate),
        event_time: validatedData.eventTime,
        event_duration: validatedData.eventDuration,
        event_location: validatedData.eventLocation,
        guest_count: validatedData.guestCount,
        budget_min: validatedData.budgetMin,
        budget_max: validatedData.budgetMax,
        message: validatedData.message,
        special_requests: validatedData.specialRequests,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        performer: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // TODO: Send notification to performer (mock for now)
    console.log(`📧 Mock notification: New enquiry from ${enquiry.client.first_name} ${enquiry.client.last_name} to ${performer.user.first_name} ${performer.user.last_name}`);

    res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: {
        enquiry: {
          id: enquiry.id,
          eventType: enquiry.event_type,
          eventDate: enquiry.event_date,
          eventTime: enquiry.event_time,
          eventLocation: enquiry.event_location,
          status: enquiry.status,
          client: enquiry.client,
          performer: {
            id: enquiry.performer.id,
            businessName: enquiry.performer.business_name,
            user: enquiry.performer.user
          },
          createdAt: enquiry.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific enquiry (client or performer)
export const getEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        performer: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        booking: {
          select: {
            id: true,
            status: true,
            confirmed_price: true,
            deposit_paid: true
          }
        }
      }
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    // Check authorization - only client who created or performer assigned can view
    const isClient = enquiry.client_id === userId;
    const isPerformer = enquiry.performer.user_id === userId;
    const isAdmin = req.user!.userType === 'ADMIN';

    if (!isClient && !isPerformer && !isAdmin) {
      throw new AppError('Not authorized to view this enquiry', 403);
    }

    res.json({
      success: true,
      data: {
        enquiry: {
          id: enquiry.id,
          eventType: enquiry.event_type,
          eventDate: enquiry.event_date,
          eventTime: enquiry.event_time,
          eventDuration: enquiry.event_duration,
          eventLocation: enquiry.event_location,
          guestCount: enquiry.guest_count,
          budgetMin: enquiry.budget_min,
          budgetMax: enquiry.budget_max,
          message: enquiry.message,
          specialRequests: enquiry.special_requests,
          status: enquiry.status,
          performerResponse: enquiry.performer_response,
          quotedPrice: enquiry.quoted_price,
          responseDate: enquiry.response_date,
          expiresAt: enquiry.expires_at,
          client: enquiry.client,
          performer: {
            id: enquiry.performer.id,
            businessName: enquiry.performer.business_name,
            user: enquiry.performer.user
          },
          booking: enquiry.booking,
          createdAt: enquiry.created_at,
          updatedAt: enquiry.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// List enquiries (filtered by user role)
export const listEnquiries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = enquiryListSchema.parse(req.query);
    const userId = req.user!.id;
    const userType = req.user!.userType;

    let whereClause: any = {};

    // Filter based on user role
    if (userType === 'CLIENT') {
      whereClause.client_id = userId;
    } else if (userType === 'PERFORMER') {
      // Find performer record for this user
      const performer = await prisma.performer.findUnique({
        where: { user_id: userId }
      });
      
      if (!performer) {
        throw new AppError('Performer profile not found', 404);
      }
      
      whereClause.performer_id = performer.id;
    }
    // ADMIN can see all enquiries (no additional filter)

    // Apply additional filters
    if (validatedQuery.status) {
      whereClause.status = validatedQuery.status;
    }
    if (validatedQuery.performerId) {
      whereClause.performer_id = validatedQuery.performerId;
    }
    if (validatedQuery.clientId) {
      whereClause.client_id = validatedQuery.clientId;
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          performer: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          booking: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit
      }),
      prisma.enquiry.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    res.json({
      success: true,
      data: {
        enquiries: enquiries.map(enquiry => ({
          id: enquiry.id,
          eventType: enquiry.event_type,
          eventDate: enquiry.event_date,
          eventLocation: enquiry.event_location,
          status: enquiry.status,
          quotedPrice: enquiry.quoted_price,
          client: enquiry.client,
          performer: {
            id: enquiry.performer.id,
            businessName: enquiry.performer.business_name,
            user: enquiry.performer.user
          },
          booking: enquiry.booking,
          createdAt: enquiry.created_at
        })),
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update enquiry status (performer only)
export const updateEnquiryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateEnquiryStatusSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify performer user type
    if (req.user!.userType !== 'PERFORMER') {
      throw new AppError('Only performers can update enquiry status', 403);
    }

    // Find enquiry and verify performer ownership
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        performer: {
          include: {
            user: true
          }
        },
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    if (enquiry.performer.user_id !== userId) {
      throw new AppError('Not authorized to update this enquiry', 403);
    }

    // Check if enquiry is still pending
    if (enquiry.status !== 'PENDING') {
      throw new AppError('Enquiry has already been responded to', 400);
    }

    // Check if enquiry has expired
    if (enquiry.expires_at && enquiry.expires_at < new Date()) {
      throw new AppError('Enquiry has expired', 400);
    }

    // Update enquiry status
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        status: validatedData.status,
        performer_response: validatedData.performerResponse,
        quoted_price: validatedData.quotedPrice,
        response_date: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        performer: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // TODO: Send notification to client (mock for now)
    const statusText = validatedData.status === 'ACCEPTED' ? 'accepted' : 'declined';
    console.log(`📧 Mock notification: ${enquiry.performer.user.first_name} ${enquiry.performer.user.last_name} has ${statusText} your enquiry`);

    res.json({
      success: true,
      message: `Enquiry ${statusText} successfully`,
      data: {
        enquiry: {
          id: updatedEnquiry.id,
          status: updatedEnquiry.status,
          performerResponse: updatedEnquiry.performer_response,
          quotedPrice: updatedEnquiry.quoted_price,
          responseDate: updatedEnquiry.response_date,
          client: updatedEnquiry.client,
          performer: {
            id: updatedEnquiry.performer.id,
            businessName: updatedEnquiry.performer.business_name,
            user: updatedEnquiry.performer.user
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
