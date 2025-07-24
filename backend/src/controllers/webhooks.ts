import { Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/database';
import { config } from '../config';

/**
 * Handle Stripe webhook events
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<Response | void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = config.stripeWebhookSecret;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature and construct event
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`✅ Webhook signature verified. Event type: ${event.type}`);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    // Handle the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('📄 Invoice payment succeeded (future feature)');
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;
      
      case 'charge.refund.updated':
        await handleChargeRefundUpdated(event);
        break;
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    // Always respond with 200 to acknowledge receipt
    return res.status(200).json({ received: true, event_type: event.type });

  } catch (error) {
    console.error(`❌ Error processing webhook event ${event.type}:`, error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      event_type: event.type,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle successful payment intent
 * Updates booking and transaction status to reflect successful payment
 */
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;
  
  console.log(`💰 Processing successful payment: ${paymentIntentId}`);

  try {
    // Find the transaction by PaymentIntent ID
    const transaction = await prisma.transaction.findFirst({
      where: { stripe_payment_intent_id: paymentIntentId },
      include: {
        booking: {
          include: {
            client: { select: { first_name: true, last_name: true, email: true } },
            performer: { 
              include: { 
                user: { select: { first_name: true, last_name: true, email: true } }
              }
            },
            enquiry: { select: { event_type: true, event_date: true } }
          }
        }
      }
    });

    if (!transaction) {
      console.error(`❌ Transaction not found for PaymentIntent: ${paymentIntentId}`);
      return;
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCEEDED',
        updated_at: new Date()
      }
    });

    // Update booking status - mark deposit as paid
    await prisma.booking.update({
      where: { id: transaction.booking_id },
      data: {
        deposit_paid: true,
        payment_status: 'paid',
        updated_at: new Date()
      }
    });

    console.log(`✅ Payment confirmed for booking ${transaction.booking_id}`);
    console.log(`📧 Mock notification: Payment confirmed! ${transaction.booking.client.first_name} ${transaction.booking.client.last_name} has paid the deposit for their ${transaction.booking.enquiry.event_type} booking with ${transaction.booking.performer.user.first_name} ${transaction.booking.performer.user.last_name}`);

    // Store webhook event for audit trail (optional)
    await storeWebhookEvent(event, transaction.booking_id, 'PROCESSED');

  } catch (error) {
    console.error(`❌ Error processing payment success for ${paymentIntentId}:`, error);
    await storeWebhookEvent(event, null, 'FAILED');
    throw error;
  }
}

/**
 * Handle failed payment intent
 * Updates transaction status and logs for retry logic
 */
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;
  const failureReason = paymentIntent.last_payment_error?.message || 'Unknown payment failure';
  
  console.log(`❌ Processing failed payment: ${paymentIntentId} - Reason: ${failureReason}`);

  try {
    // Find the transaction by PaymentIntent ID
    const transaction = await prisma.transaction.findFirst({
      where: { stripe_payment_intent_id: paymentIntentId },
      include: {
        booking: {
          include: {
            client: { select: { first_name: true, last_name: true, email: true } },
            performer: { 
              include: { 
                user: { select: { first_name: true, last_name: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      console.error(`❌ Transaction not found for failed PaymentIntent: ${paymentIntentId}`);
      return;
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        description: `${transaction.description} - Failed: ${failureReason}`,
        updated_at: new Date()
      }
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: transaction.booking_id },
      data: {
        payment_status: 'failed',
        updated_at: new Date()
      }
    });

    console.log(`❌ Payment failed for booking ${transaction.booking_id}: ${failureReason}`);
    console.log(`📧 Mock notification: Payment failed for ${transaction.booking.client.first_name} ${transaction.booking.client.last_name}. Please try again or contact support.`);

    // Store webhook event for audit trail
    await storeWebhookEvent(event, transaction.booking_id, 'PROCESSED');

  } catch (error) {
    console.error(`❌ Error processing payment failure for ${paymentIntentId}:`, error);
    await storeWebhookEvent(event, null, 'FAILED');
    throw error;
  }
}

/**
 * Handle canceled payment intent
 * Updates transaction status for canceled payments
 */
async function handlePaymentIntentCanceled(event: any) {
  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;
  
  console.log(`🚫 Processing canceled payment: ${paymentIntentId}`);

  try {
    // Find the transaction by PaymentIntent ID
    const transaction = await prisma.transaction.findFirst({
      where: { stripe_payment_intent_id: paymentIntentId }
    });

    if (!transaction) {
      console.error(`❌ Transaction not found for canceled PaymentIntent: ${paymentIntentId}`);
      return;
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'CANCELLED',
        description: `${transaction.description} - Canceled by client`,
        updated_at: new Date()
      }
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: transaction.booking_id },
      data: {
        payment_status: 'cancelled',
        updated_at: new Date()
      }
    });

    console.log(`🚫 Payment canceled for booking ${transaction.booking_id}`);

    // Store webhook event for audit trail
    await storeWebhookEvent(event, transaction.booking_id, 'PROCESSED');

  } catch (error) {
    console.error(`❌ Error processing payment cancellation for ${paymentIntentId}:`, error);
    await storeWebhookEvent(event, null, 'FAILED');
    throw error;
  }
}

/**
 * Handle charge dispute created (preparation for Step 5)
 * Logs dispute for future handling
 */
const handleChargeDisputeCreated = async (event: any) => {
  try {
    const charge = event.data.object;
    console.log(`⚠️ Charge dispute created: ${charge.id}`);
    console.log(`Dispute amount: £${(charge.amount_disputed / 100).toFixed(2)}`);
    
    // TODO: Implement dispute handling logic
    // - Find related booking
    // - Update booking status
    // - Notify admin and performer
    
  } catch (error) {
    console.error('❌ Error handling charge dispute:', error);
    throw error;
  }
};

/**
 * Handle charge refunded event
 * Updates booking and transaction status when refund is processed
 */
const handleChargeRefunded = async (event: any) => {
  try {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;
    const refundAmount = charge.amount_refunded / 100; // Convert from cents
    
    console.log(`💰 Charge refunded: ${charge.id}`);
    console.log(`Payment Intent: ${paymentIntentId}`);
    console.log(`Refund amount: £${refundAmount.toFixed(2)}`);
    
    // Find the booking by PaymentIntent ID
    const booking = await prisma.booking.findFirst({
      where: {
        stripe_payment_intent_id: paymentIntentId
      },
      include: {
        performer: {
          include: {
            user: true
          }
        },
        client: true
      }
    });
    
    if (!booking) {
      console.error(`❌ No booking found for PaymentIntent: ${paymentIntentId}`);
      return;
    }
    
    // Find the refund transaction to update
    const refundTransaction = await prisma.transaction.findFirst({
      where: {
        booking_id: booking.id,
        type: 'REFUND',
        status: 'PENDING'
      }
    });
    
    if (refundTransaction) {
      // Update the refund transaction status
      await prisma.transaction.update({
        where: { id: refundTransaction.id },
        data: {
          status: 'COMPLETED',
          updated_at: new Date()
        }
      });
      
      console.log(`✅ Updated refund transaction: ${refundTransaction.id}`);
    }
    
    // Update booking refund status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        refund_status: 'REFUNDED',
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Refund confirmed for booking ${booking.id}`);
    console.log(`📧 Mock notification: Refund of £${refundAmount.toFixed(2)} processed for ${booking.client.first_name} ${booking.client.last_name}`);
    
    // Store webhook event for audit trail
    await storeWebhookEvent(event, booking.id, 'PROCESSED');
    
  } catch (error) {
    console.error('❌ Error handling charge refunded:', error);
    await storeWebhookEvent(event, null, 'FAILED');
    throw error;
  }
};

/**
 * Handle charge refund updated event
 * Tracks failed or pending refunds
 */
const handleChargeRefundUpdated = async (event: any) => {
  try {
    const refund = event.data.object;
    const chargeId = refund.charge;
    const refundStatus = refund.status;
    
    console.log(`🔄 Refund updated: ${refund.id}`);
    console.log(`Charge: ${chargeId}`);
    console.log(`Status: ${refundStatus}`);
    
    // Find the booking by looking up the charge
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent;
    
    const booking = await prisma.booking.findFirst({
      where: {
        stripe_payment_intent_id: paymentIntentId as string
      }
    });
    
    if (!booking) {
      console.error(`❌ No booking found for charge: ${chargeId}`);
      return;
    }
    
    // Update refund transaction if status changed to failed
    if (refundStatus === 'failed') {
      const refundTransaction = await prisma.transaction.findFirst({
        where: {
          booking_id: booking.id,
          type: 'REFUND',
          stripe_refund_id: refund.id
        }
      });
      
      if (refundTransaction) {
        await prisma.transaction.update({
          where: { id: refundTransaction.id },
          data: {
            status: 'FAILED',
            updated_at: new Date()
          }
        });
        
        // Update booking refund status
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            refund_status: 'FAILED',
            refund_reason: `Refund failed: ${refund.failure_reason || 'Unknown reason'}`,
            updated_at: new Date()
          }
        });
        
        console.log(`❌ Refund failed for booking ${booking.id}: ${refund.failure_reason}`);
        console.log(`📧 Mock notification: Refund failed - manual intervention required`);
      }
    }
    
    // Store webhook event for audit trail
    await storeWebhookEvent(event, booking.id, 'PROCESSED');
    
  } catch (error) {
    console.error('❌ Error handling refund updated:', error);
    await storeWebhookEvent(event, null, 'FAILED');
    throw error;
  }
};

/**
 * Store webhook event for audit trail and debugging
 */
async function storeWebhookEvent(event: any, bookingId: string | null, status: 'PROCESSED' | 'FAILED') {
  try {
    // Note: This would require a webhook_events table in the future
    // For now, we'll just log the event
    console.log(`📝 Webhook event stored: ${event.type} - Status: ${status} - Booking: ${bookingId || 'N/A'}`);
    
    // Future implementation:
    // await prisma.webhookEvent.create({
    //   data: {
    //     stripe_event_id: event.id,
    //     event_type: event.type,
    //     booking_id: bookingId,
    //     status: status,
    //     event_data: JSON.stringify(event.data),
    //     processed_at: new Date()
    //   }
    // });
  } catch (error) {
    console.error('❌ Error storing webhook event:', error);
  }
}
