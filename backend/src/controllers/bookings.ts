import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/database';
import { AppError } from '../middleware/error';
import { confirmBookingSchema, bookingListSchema, cancelBookingSchema } from '../lib/validation';
import { stripe } from '../lib/stripe';

// Confirm enquiry to booking (performer only)
export const confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enquiryId } = req.params;
    const validatedData = confirmBookingSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify performer user type
    if (req.user!.userType !== 'PERFORMER') {
      throw new AppError('Only performers can confirm bookings', 403);
    }

    // Find enquiry and verify it's accepted
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
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
        },
        booking: true // Check if booking already exists
      }
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    if (enquiry.performer.user_id !== userId) {
      throw new AppError('Not authorized to confirm this booking', 403);
    }

    if (enquiry.status !== 'ACCEPTED') {
      throw new AppError('Enquiry must be accepted before confirming booking', 400);
    }

    if (enquiry.booking) {
      throw new AppError('Booking already exists for this enquiry', 400);
    }

    // Verify performer has completed Stripe onboarding
    if (!enquiry.performer.stripe_account_id || !enquiry.performer.stripe_onboarding_complete) {
      throw new AppError('Performer must complete Stripe onboarding before accepting payments', 400);
    }

    // Calculate deposit (25% by default)
    const depositAmount = validatedData.confirmedPrice * 0.25;
    const platformFeeRate = 0.10; // 10% platform fee as specified
    const platformFee = validatedData.confirmedPrice * platformFeeRate;
    const performerAmount = validatedData.confirmedPrice - platformFee;

    // Convert to cents for Stripe (Stripe uses smallest currency unit)
    const depositAmountCents = Math.round(depositAmount * 100);
    const platformFeeCents = Math.round(platformFee * 100);

    // Create Stripe PaymentIntent for the deposit
    console.log('Creating Stripe PaymentIntent for booking deposit...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountCents,
      currency: 'gbp', // Assuming GBP for UK platform
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: enquiry.performer.stripe_account_id,
      },
      metadata: {
        booking_type: 'deposit',
        enquiry_id: enquiryId,
        client_id: enquiry.client_id,
        performer_id: enquiry.performer_id,
        event_type: enquiry.event_type,
        event_date: enquiry.event_date.toISOString(),
        confirmed_price: validatedData.confirmedPrice.toString(),
        deposit_amount: depositAmount.toString(),
        platform_fee: platformFee.toString(),
      },
      description: `Deposit for ${enquiry.event_type} booking - ${enquiry.performer.business_name || enquiry.performer.user.first_name + ' ' + enquiry.performer.user.last_name}`,
    });

    console.log('PaymentIntent created:', paymentIntent.id);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        enquiry_id: enquiryId,
        client_id: enquiry.client_id,
        performer_id: enquiry.performer_id,
        event_date: enquiry.event_date,
        event_time: validatedData.eventTime,
        event_duration: validatedData.eventDuration,
        event_location: enquiry.event_location,
        guest_count: enquiry.guest_count,
        confirmed_price: validatedData.confirmedPrice,
        deposit_amount: depositAmount,
        platform_fee: platformFee,
        performer_amount: performerAmount,
        status: 'CONFIRMED'
      },
      include: {
        enquiry: {
          select: {
            id: true,
            event_type: true,
            message: true
          }
        },
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

    // Create initial deposit transaction record with PaymentIntent ID
    await prisma.transaction.create({
      data: {
        booking_id: booking.id,
        type: 'DEPOSIT',
        amount: depositAmount,
        status: 'PENDING',
        stripe_payment_intent_id: paymentIntent.id,
        description: `Deposit for ${enquiry.event_type} booking`
      }
    });

    // TODO: Send booking confirmation notification to client (mock for now)
    console.log(`📧 Mock notification: Booking confirmed! ${enquiry.performer.user.first_name} ${enquiry.performer.user.last_name} has confirmed your ${enquiry.event_type} booking for ${booking.event_date.toDateString()}`);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking: {
          id: booking.id,
          enquiryId: booking.enquiry_id,
          eventDate: booking.event_date,
          eventTime: booking.event_time,
          eventDuration: booking.event_duration,
          eventLocation: booking.event_location,
          confirmedPrice: booking.confirmed_price,
          depositAmount: booking.deposit_amount,
          depositPaid: booking.deposit_paid,
          status: booking.status,
          client: booking.client,
          performer: {
            id: booking.performer.id,
            businessName: booking.performer.business_name,
            user: booking.performer.user
          },
          enquiry: booking.enquiry,
          createdAt: booking.created_at
        },
        payment: {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount: depositAmountCents,
          currency: 'gbp',
          description: paymentIntent.description,
          requires_payment: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// List bookings (filtered by user role)
export const listBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = bookingListSchema.parse(req.query);
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
    // ADMIN can see all bookings (no additional filter)

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

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          enquiry: {
            select: {
              id: true,
              event_type: true,
              message: true
            }
          },
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
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              created_at: true
            },
            orderBy: {
              created_at: 'desc'
            }
          },
          review: {
            select: {
              id: true,
              overall_rating: true,
              title: true
            }
          }
        },
        orderBy: {
          event_date: 'desc'
        },
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit
      }),
      prisma.booking.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    res.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          id: booking.id,
          enquiryId: booking.enquiry_id,
          eventDate: booking.event_date,
          eventTime: booking.event_time,
          eventDuration: booking.event_duration,
          eventLocation: booking.event_location,
          confirmedPrice: booking.confirmed_price,
          depositAmount: booking.deposit_amount,
          depositPaid: booking.deposit_paid,
          status: booking.status,
          paymentStatus: booking.payment_status,
          client: booking.client,
          performer: {
            id: booking.performer.id,
            businessName: booking.performer.business_name,
            user: booking.performer.user
          },
          enquiry: booking.enquiry,
          transactions: booking.transactions,
          review: booking.review,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
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

// Get specific booking (client or performer)
export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        enquiry: {
          select: {
            id: true,
            event_type: true,
            message: true,
            special_requests: true,
            budget_min: true,
            budget_max: true
          }
        },
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true
          }
        },
        performer: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            description: true,
            created_at: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        review: true
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check authorization - only client who booked or performer assigned can view
    const isClient = booking.client_id === userId;
    const isPerformer = booking.performer.user_id === userId;
    const isAdmin = req.user!.userType === 'ADMIN';

    if (!isClient && !isPerformer && !isAdmin) {
      throw new AppError('Not authorized to view this booking', 403);
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          enquiryId: booking.enquiry_id,
          eventDate: booking.event_date,
          eventTime: booking.event_time,
          eventDuration: booking.event_duration,
          eventLocation: booking.event_location,
          guestCount: booking.guest_count,
          confirmedPrice: booking.confirmed_price,
          depositAmount: booking.deposit_amount,
          depositPaid: booking.deposit_paid,
          platformFee: booking.platform_fee,
          performerAmount: booking.performer_amount,
          status: booking.status,
          paymentStatus: booking.payment_status,
          cancellationReason: booking.cancellation_reason,
          cancelledAt: booking.cancelled_at,
          completedAt: booking.completed_at,
          client: booking.client,
          performer: {
            id: booking.performer.id,
            businessName: booking.performer.business_name,
            location: booking.performer.location,
            user: booking.performer.user
          },
          enquiry: booking.enquiry,
          transactions: booking.transactions,
          review: booking.review,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
