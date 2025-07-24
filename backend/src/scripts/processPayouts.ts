import { stripe } from '../lib/stripe';
import { prisma } from '../lib/database';

/**
 * Payout Processing Script
 * Processes pending payouts to performers after successful deposit payments
 * 
 * Usage:
 * - Run as cron job: node -r ts-node/register src/scripts/processPayouts.ts
 * - Run manually: npm run process-payouts
 * - Recommended frequency: Every 15-30 minutes
 */

interface PayoutEligibleBooking {
  id: string;
  confirmed_price: number;
  deposit_amount: number;
  payout_status: string;
  performer: {
    id: string;
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean;
    payout_enabled: boolean;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  client: {
    first_name: string;
    last_name: string;
  };
  enquiry: {
    event_type: string;
    event_date: Date;
  };
}

/**
 * Main payout processing function
 */
export async function processPayouts(): Promise<void> {
  console.log('🔄 Starting payout processing...');
  
  try {
    // Find all bookings eligible for payout
    const eligibleBookings = await findPayoutEligibleBookings();
    
    if (eligibleBookings.length === 0) {
      console.log('✅ No bookings eligible for payout at this time');
      return;
    }
    
    console.log(`📋 Found ${eligibleBookings.length} bookings eligible for payout`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each booking
    for (const booking of eligibleBookings) {
      try {
        await processBookingPayout(booking);
        successCount++;
        console.log(`✅ Payout processed for booking ${booking.id}`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to process payout for booking ${booking.id}:`, error);
        
        // Mark payout as failed in database
        await markPayoutFailed(booking.id, error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Small delay between payouts to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`🎯 Payout processing complete: ${successCount} successful, ${failureCount} failed`);
    
  } catch (error) {
    console.error('❌ Critical error in payout processing:', error);
    throw error;
  }
}

/**
 * Find all bookings eligible for payout
 */
async function findPayoutEligibleBookings(): Promise<PayoutEligibleBooking[]> {
  return await prisma.booking.findMany({
    where: {
      deposit_paid: true,
      payout_status: 'pending',
      // Only process bookings where payment was confirmed at least 5 minutes ago
      // This prevents race conditions with webhook processing
      updated_at: {
        lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    },
    include: {
      performer: {
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      },
      client: {
        select: {
          first_name: true,
          last_name: true
        }
      },
      enquiry: {
        select: {
          event_type: true,
          event_date: true
        }
      }
    }
  });
}

/**
 * Process payout for a specific booking
 */
export async function processBookingPayout(booking: PayoutEligibleBooking): Promise<void> {
  const { performer } = booking;
  
  // Validate performer eligibility
  if (!performer.stripe_account_id) {
    throw new Error('Performer does not have a Stripe Connect account');
  }
  
  if (!performer.stripe_onboarding_complete) {
    throw new Error('Performer has not completed Stripe onboarding');
  }
  
  if (!performer.payout_enabled) {
    throw new Error('Performer payouts are not enabled');
  }
  
  // Verify Stripe account status
  const account = await stripe.accounts.retrieve(performer.stripe_account_id);
  
  if (!account.charges_enabled) {
    throw new Error('Performer Stripe account is not enabled for charges');
  }
  
  if (!account.payouts_enabled) {
    throw new Error('Performer Stripe account is not enabled for payouts');
  }
  
  // Calculate payout amount
  const platformFeeRate = 0.10; // 10% platform fee
  const depositAmount = booking.deposit_amount;
  const platformFee = depositAmount * platformFeeRate;
  const payoutAmount = depositAmount - platformFee;
  const payoutAmountCents = Math.round(payoutAmount * 100);
  
  console.log(`💰 Processing payout for ${performer.user.first_name} ${performer.user.last_name}:`);
  console.log(`   Deposit: £${depositAmount.toFixed(2)}`);
  console.log(`   Platform Fee (10%): £${platformFee.toFixed(2)}`);
  console.log(`   Payout Amount: £${payoutAmount.toFixed(2)}`);
  
  // Create Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: payoutAmountCents,
    currency: 'gbp',
    destination: performer.stripe_account_id,
    transfer_group: `booking_${booking.id}`,
    metadata: {
      booking_id: booking.id,
      performer_id: performer.id,
      event_type: booking.enquiry.event_type,
      event_date: booking.enquiry.event_date.toISOString(),
      deposit_amount: depositAmount.toString(),
      platform_fee: platformFee.toString(),
      payout_amount: payoutAmount.toString(),
    },
    description: `Payout for ${booking.enquiry.event_type} booking - ${booking.client.first_name} ${booking.client.last_name}`,
  });
  
  console.log(`✅ Stripe transfer created: ${transfer.id}`);
  
  // Update booking with payout information
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      payout_status: 'paid',
      payout_at: new Date(),
      stripe_transfer_id: transfer.id,
      updated_at: new Date()
    }
  });
  
  // Create payout transaction record
  await prisma.transaction.create({
    data: {
      booking_id: booking.id,
      type: 'PAYOUT',
      status: 'SUCCEEDED',
      amount: payoutAmount,
      currency: 'GBP',
      stripe_payment_intent_id: transfer.id, // Using this field for transfer ID
      description: `Payout to ${performer.user.first_name} ${performer.user.last_name} for ${booking.enquiry.event_type} booking`,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  
  // Optional: Update performer cumulative earnings
  await updatePerformerEarnings(performer.id, payoutAmount);
  
  console.log(`📧 Mock notification: Payout of £${payoutAmount.toFixed(2)} sent to ${performer.user.first_name} ${performer.user.last_name} (${performer.user.email})`);
}

/**
 * Mark payout as failed in database
 */
async function markPayoutFailed(bookingId: string, errorMessage: string): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      payout_status: 'failed',
      updated_at: new Date()
    }
  });
  
  // Create failed payout transaction record
  await prisma.transaction.create({
    data: {
      booking_id: bookingId,
      type: 'PAYOUT',
      status: 'FAILED',
      amount: 0,
      currency: 'GBP',
      description: `Failed payout: ${errorMessage}`,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  
  console.log(`📧 Mock notification: Payout failed for booking ${bookingId}. Admin intervention required.`);
}

/**
 * Update performer cumulative earnings (optional feature)
 */
async function updatePerformerEarnings(performerId: string, payoutAmount: number): Promise<void> {
  try {
    // This would require adding an earnings field to the Performer model
    // For now, we'll just log the earnings update
    console.log(`💼 Performer ${performerId} earnings updated: +£${payoutAmount.toFixed(2)}`);
    
    // Future implementation:
    // await prisma.performer.update({
    //   where: { id: performerId },
    //   data: {
    //     total_earnings: {
    //       increment: payoutAmount
    //     },
    //     last_payout_at: new Date()
    //   }
    // });
  } catch (error) {
    console.error('⚠️ Failed to update performer earnings:', error);
    // Don't throw - this is optional and shouldn't fail the payout
  }
}

/**
 * Run the payout processor if called directly
 */
if (require.main === module) {
  processPayouts()
    .then(() => {
      console.log('✅ Payout processing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Payout processing failed:', error);
      process.exit(1);
    });
}
