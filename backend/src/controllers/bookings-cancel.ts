import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/database';
import { AppError } from '../middleware/error';
import { cancelBookingSchema } from '../lib/validation';
import { stripe } from '../lib/stripe';

// Cancel booking (client only)
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = cancelBookingSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify client user type
    if (req.user!.userType !== 'CLIENT') {
      throw new AppError('Only clients can cancel bookings', 403);
    }

    // Find booking and verify ownership
    const booking = await prisma.booking.findUnique({
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
        transactions: {
          where: {
            type: 'DEPOSIT',
            status: 'SUCCEEDED'
          }
        }
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.client_id !== userId) {
      throw new AppError('Not authorized to cancel this booking', 403);
    }

    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    // Check if booking is completed
    if (booking.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed booking', 400);
    }

    // Strict cancellation rule: Cannot cancel within 21 days of event
    const eventDate = new Date(booking.event_date);
    const now = new Date();
    const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference < 21) {
      throw new AppError('Cannot cancel booking within 21 days of the event date', 400);
    }

    // Check if deposit has been paid
    const depositTransaction = booking.transactions.find(t => t.type === 'DEPOSIT' && t.status === 'SUCCEEDED');
    let refundAmount = 0;
    let refundTransactionId = null;

    // Calculate refund amount (deposit is non-refundable, but refund any additional payments)
    if (booking.payment_status === 'paid') {
      // If full payment was made, refund the balance (total - deposit)
      refundAmount = Number(booking.confirmed_price) - Number(booking.deposit_amount);
      
      if (refundAmount > 0) {
        try {
          // Process Stripe refund for the balance only
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id!,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              booking_id: booking.id,
              client_id: booking.client_id,
              performer_id: booking.performer_id,
              refund_type: 'cancellation',
              original_amount: booking.confirmed_price.toString(),
              deposit_amount: booking.deposit_amount.toString(),
              refund_amount: refundAmount.toString()
            }
          });

          // Create refund transaction record
          const refundTransaction = await prisma.transaction.create({
            data: {
              booking_id: booking.id,
              type: 'REFUND',
              amount: refundAmount,
              currency: 'GBP',
              status: 'SUCCEEDED',
              stripe_refund_id: refund.id,
              description: `Refund for cancelled booking - ${booking.performer.business_name || booking.performer.user.first_name + ' ' + booking.performer.user.last_name}`
            }
          });

          refundTransactionId = refundTransaction.id;
          console.log(`✅ Stripe refund processed: ${refund.id} for £${refundAmount}`);
        } catch (stripeError: any) {
          console.error('❌ Stripe refund failed:', stripeError.message);
          
          // Create failed refund transaction record
          await prisma.transaction.create({
            data: {
              booking_id: booking.id,
              type: 'REFUND',
              amount: refundAmount,
              currency: 'GBP',
              status: 'FAILED',
              description: `Failed refund for cancelled booking - ${stripeError.message}`
            }
          });

          // Update booking with failed refund status
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              cancelled_at: new Date(),
              cancelled_by: 'CLIENT',
              refund_status: 'FAILED',
              refund_reason: `Stripe refund failed: ${stripeError.message}`,
              cancellation_reason: validatedData.reason
            }
          });

          throw new AppError('Booking cancelled but refund failed. Please contact support.', 500);
        }
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: 'CLIENT',
        refund_status: refundAmount > 0 ? 'REFUNDED' : 'NONE',
        refund_reason: refundAmount > 0 ? `Refund of £${refundAmount} processed (deposit non-refundable)` : 'No refund - deposit only',
        cancellation_reason: validatedData.reason
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
        },
        transactions: true
      }
    });

    // Mock notifications
    console.log(`📧 [MOCK] Cancellation notification sent to client: ${booking.client.email}`);
    console.log(`📧 [MOCK] Cancellation notification sent to performer: ${booking.performer.user.email}`);
    console.log(`📧 [MOCK] Cancellation notification sent to admin for booking: ${booking.id}`);

    // Prepare refund summary
    const refundSummary = {
      total_amount: Number(booking.confirmed_price),
      deposit_amount: Number(booking.deposit_amount),
      refund_amount: refundAmount,
      deposit_retained: Number(booking.deposit_amount),
      refund_transaction_id: refundTransactionId,
      refund_status: updatedBooking.refund_status,
      message: refundAmount > 0 
        ? `Refund of £${refundAmount} processed. Deposit of £${booking.deposit_amount} is non-refundable.`
        : `No refund processed. Deposit of £${booking.deposit_amount} is non-refundable.`
    };

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
      refund_summary: refundSummary
    });
  } catch (error) {
    next(error);
  }
};
