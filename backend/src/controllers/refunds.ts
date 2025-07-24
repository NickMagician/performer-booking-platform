import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { stripe } from '../lib/stripe';
import { AppError } from '../utils/errors';

// Validation schemas
const getRefundsSchema = z.object({
  status: z.enum(['PENDING', 'REFUNDED', 'FAILED', 'NONE']).optional(),
  performer_id: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional()
});

const manualRefundSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters')
});

/**
 * Get all refunds with filtering (Admin only)
 * GET /api/refunds
 */
export const getRefunds = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { status, performer_id, date_from, date_to, page = 1, limit = 20 } = getRefundsSchema.parse(req.query);

    // Build where clause for filtering
    const where: any = {
      refund_status: {
        not: 'NONE' // Only show bookings that have refund activity
      }
    };

    if (status) {
      where.refund_status = status;
    }

    if (performer_id) {
      where.performer_id = performer_id;
    }

    if (date_from || date_to) {
      where.cancelled_at = {};
      if (date_from) {
        where.cancelled_at.gte = new Date(date_from);
      }
      if (date_to) {
        where.cancelled_at.lte = new Date(date_to);
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.booking.count({ where });

    // Get refunds with related data
    const refunds = await prisma.booking.findMany({
      where,
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
        transactions: {
          where: {
            type: 'REFUND'
          },
          select: {
            id: true,
            amount: true,
            status: true,
            stripe_refund_id: true,
            created_at: true,
            updated_at: true
          }
        }
      },
      orderBy: {
        cancelled_at: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format response data
    const formattedRefunds = refunds.map(booking => ({
      booking_id: booking.id,
      client_name: `${booking.client.first_name} ${booking.client.last_name}`,
      client_email: booking.client.email,
      performer_name: booking.performer.business_name || 
        `${booking.performer.user.first_name} ${booking.performer.user.last_name}`,
      performer_email: booking.performer.user.email,
      event_date: booking.event_date,
      event_location: booking.event_location,
      booking_amount: booking.confirmed_price,
      deposit_amount: booking.deposit_amount,
      refund_amount: booking.transactions.length > 0 ? booking.transactions[0].amount : 0,
      refund_status: booking.refund_status,
      stripe_refund_id: booking.transactions.length > 0 ? booking.transactions[0].stripe_refund_id : null,
      cancellation_reason: booking.cancellation_reason,
      refund_reason: booking.refund_reason,
      cancelled_at: booking.cancelled_at,
      cancelled_by: booking.cancelled_by,
      refund_processed_at: booking.transactions.length > 0 ? booking.transactions[0].updated_at : null
    }));

    return res.json({
      refunds: formattedRefunds,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    console.error('❌ Error fetching refunds:', error);
    return res.status(500).json({
      error: 'Failed to fetch refunds',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process manual refund for a booking (Admin only)
 * POST /api/refunds/:bookingId/manual
 */
export const processManualRefund = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { bookingId } = req.params;
    const { reason } = manualRefundSchema.parse(req.body);

    // Find the booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        performer: {
          include: {
            user: true
          }
        },
        transactions: {
          where: {
            type: 'REFUND'
          }
        }
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Check if booking is eligible for manual refund
    if (booking.refund_status === 'REFUNDED') {
      throw new AppError('Booking has already been refunded', 400);
    }

    if (booking.refund_status !== 'FAILED' && booking.refund_status !== 'PENDING') {
      throw new AppError('Manual refund can only be processed for failed or pending refunds', 400);
    }

    if (!booking.stripe_payment_intent_id) {
      throw new AppError('No payment intent found for this booking', 400);
    }

    // Calculate refund amount (same logic as in booking cancellation)
    let refundAmount = 0;
    if (booking.payment_status === 'paid') {
      // If full payment was made, refund the balance (total - deposit)
      refundAmount = Number(booking.confirmed_price) - Number(booking.deposit_amount);
    }

    if (refundAmount <= 0) {
      throw new AppError('No refund amount available for this booking', 400);
    }

    try {
      // Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          booking_id: booking.id,
          refund_type: 'manual_admin',
          admin_reason: reason,
          refund_amount: refundAmount.toString()
        }
      });

      // Update or create refund transaction record
      let refundTransaction;
      const existingTransaction = booking.transactions.find(t => t.type === 'REFUND');

      if (existingTransaction) {
        // Update existing failed transaction
        refundTransaction = await prisma.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            status: 'COMPLETED',
            stripe_refund_id: refund.id,
            description: `Manual refund processed by admin - ${reason}`,
            updated_at: new Date()
          }
        });
      } else {
        // Create new refund transaction
        refundTransaction = await prisma.transaction.create({
          data: {
            booking_id: booking.id,
            type: 'REFUND',
            amount: refundAmount,
            status: 'COMPLETED',
            stripe_refund_id: refund.id,
            description: `Manual refund processed by admin - ${reason}`
          }
        });
      }

      // Update booking refund status
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          refund_status: 'REFUNDED',
          refund_reason: `Manual refund by admin: ${reason}`,
          updated_at: new Date()
        }
      });

      console.log(`✅ Manual refund processed: ${refund.id} for £${refundAmount}`);
      console.log(`📧 Mock notification: Manual refund of £${refundAmount} processed for booking ${booking.id}`);

      return res.json({
        message: 'Manual refund processed successfully',
        refund: {
          booking_id: booking.id,
          refund_amount: refundAmount,
          stripe_refund_id: refund.id,
          transaction_id: refundTransaction.id,
          status: 'REFUNDED',
          reason: reason,
          processed_at: new Date()
        }
      });

    } catch (stripeError: any) {
      console.error('❌ Manual Stripe refund failed:', stripeError.message);

      // Update booking with failed refund status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          refund_status: 'FAILED',
          refund_reason: `Manual refund failed: ${stripeError.message}`,
          updated_at: new Date()
        }
      });

      throw new AppError(`Manual refund failed: ${stripeError.message}`, 500);
    }

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }

    console.error('❌ Error processing manual refund:', error);
    return res.status(500).json({
      error: 'Failed to process manual refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
