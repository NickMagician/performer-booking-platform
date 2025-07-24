import { Request, Response } from 'express';
import { stripe, STRIPE_CONNECT_CONFIG } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Create Stripe Connect onboarding link for performers
 * POST /api/payments/onboard
 */
export const createOnboardingLink = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is a performer
    const performer = await prisma.performer.findUnique({
      where: { user_id: userId },
      include: { user: true }
    });

    if (!performer) {
      return res.status(403).json({ error: 'Only performers can access onboarding' });
    }

    let stripeAccountId = performer.stripe_account_id;

    // Create Stripe Connect account if it doesn't exist
    if (!stripeAccountId) {
      console.log('Creating new Stripe Connect account for performer:', performer.id);
      
      const account = await stripe.accounts.create({
        type: STRIPE_CONNECT_CONFIG.ACCOUNT_TYPE,
        capabilities: STRIPE_CONNECT_CONFIG.CAPABILITIES,
        business_profile: {
          ...STRIPE_CONNECT_CONFIG.BUSINESS_PROFILE,
          name: performer.business_name || `${performer.user.first_name} ${performer.user.last_name}`,
        },
        metadata: {
          performer_id: performer.id,
          user_id: userId,
        },
      });

      stripeAccountId = account.id;

      // Update performer with Stripe account ID
      await prisma.performer.update({
        where: { id: performer.id },
        data: { stripe_account_id: stripeAccountId }
      });

      console.log('Created Stripe account:', stripeAccountId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: STRIPE_CONNECT_CONFIG.REFRESH_URL,
      return_url: STRIPE_CONNECT_CONFIG.RETURN_URL,
      type: 'account_onboarding',
    });

    console.log('Generated onboarding link:', accountLink.url);

    res.json({
      success: true,
      data: {
        onboarding_url: accountLink.url,
        stripe_account_id: stripeAccountId,
        expires_at: accountLink.expires_at,
      }
    });

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return res.status(500).json({ 
      error: 'Failed to create onboarding link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get Stripe Connect account status for performer
 * GET /api/payments/account-status
 */
export const getAccountStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is a performer
    const performer = await prisma.performer.findUnique({
      where: { user_id: userId }
    });

    if (!performer) {
      return res.status(403).json({ error: 'Only performers can check account status' });
    }

    if (!performer.stripe_account_id) {
      return res.json({
        success: true,
        data: {
          has_stripe_account: false,
          onboarding_complete: false,
          payout_enabled: false,
          requirements: [],
        }
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(performer.stripe_account_id);

    const onboardingComplete = account.details_submitted && !account.requirements?.currently_due?.length;
    const payoutEnabled = account.payouts_enabled;

    // Update performer status if changed
    if (performer.stripe_onboarding_complete !== onboardingComplete || 
        performer.payout_enabled !== payoutEnabled) {
      await prisma.performer.update({
        where: { id: performer.id },
        data: {
          stripe_onboarding_complete: onboardingComplete,
          payout_enabled: payoutEnabled,
        }
      });
    }

    res.json({
      success: true,
      data: {
        has_stripe_account: true,
        onboarding_complete: onboardingComplete,
        payout_enabled: payoutEnabled,
        charges_enabled: account.charges_enabled,
        requirements: account.requirements?.currently_due || [],
        account_type: account.type,
      }
    });

  } catch (error) {
    console.error('Error getting account status:', error);
    return res.status(500).json({ 
      error: 'Failed to get account status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle return from Stripe Connect onboarding
 * GET /api/payments/onboard-return
 */
export const handleOnboardingReturn = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is a performer
    const performer = await prisma.performer.findUnique({
      where: { user_id: userId }
    });

    if (!performer || !performer.stripe_account_id) {
      return res.status(404).json({ error: 'Performer or Stripe account not found' });
    }

    // Get updated account status
    const account = await stripe.accounts.retrieve(performer.stripe_account_id);
    const onboardingComplete = account.details_submitted && !account.requirements?.currently_due?.length;

    // Update performer status
    await prisma.performer.update({
      where: { id: performer.id },
      data: {
        stripe_onboarding_complete: onboardingComplete,
        payout_enabled: account.payouts_enabled,
      }
    });

    console.log(`Onboarding return for performer ${performer.id}: complete=${onboardingComplete}`);

    res.json({
      success: true,
      data: {
        onboarding_complete: onboardingComplete,
        payout_enabled: account.payouts_enabled,
        message: onboardingComplete 
          ? 'Onboarding completed successfully! You can now receive payments.'
          : 'Onboarding in progress. Please complete any remaining requirements.',
      }
    });

  } catch (error) {
    console.error('Error handling onboarding return:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process onboarding return',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get payout history for performer or admin
 * GET /api/payments/payouts
 */
export const getPayouts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    if (!userId || !userType) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    let whereClause: any = {
      payout_status: {
        in: ['paid', 'failed']
      }
    };

    // If performer, only show their own payouts
    if (userType === 'PERFORMER') {
      const performer = await prisma.performer.findUnique({
        where: { user_id: userId }
      });

      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer profile not found'
        });
      }

      whereClause.performer_id = performer.id;
    }
    // Admin can see all payouts (no additional filter needed)

    const payouts = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        confirmed_price: true,
        deposit_amount: true,
        payout_status: true,
        payout_at: true,
        stripe_transfer_id: true,
        created_at: true,
        performer: {
          select: {
            id: true,
            business_name: true,
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
      },
      orderBy: {
        payout_at: 'desc'
      },
      take: 50 // Limit to recent 50 payouts
    });

    // Calculate payout amounts
    const payoutsWithAmounts = payouts.map(payout => {
      const platformFeeRate = 0.10;
      const depositAmount = payout.deposit_amount;
      const platformFee = depositAmount * platformFeeRate;
      const payoutAmount = depositAmount - platformFee;

      return {
        ...payout,
        platform_fee: platformFee,
        payout_amount: payoutAmount
      };
    });

    console.log(`📋 Retrieved ${payouts.length} payout records for user ${userId} (${userType})`);

    res.json({
      success: true,
      data: {
        payouts: payoutsWithAmounts,
        total_count: payouts.length
      }
    });

  } catch (error) {
    console.error('Error retrieving payouts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payouts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Trigger manual payout for a specific booking (Admin only)
 * POST /api/payments/manual-payout/:bookingId
 */
export const triggerManualPayout = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.userType;

    // Admin only endpoint
    if (userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate booking eligibility
    if (!booking.deposit_paid) {
      return res.status(400).json({
        success: false,
        error: 'Booking deposit has not been paid'
      });
    }

    if (booking.payout_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payout has already been processed for this booking'
      });
    }

    // Import and use the payout processing function
    const { processBookingPayout } = await import('../scripts/processPayouts');
    
    // Process the payout
    await processBookingPayout(booking as any);

    console.log(`💰 Manual payout triggered by admin ${userId} for booking ${bookingId}`);

    res.json({
      success: true,
      message: 'Manual payout processed successfully',
      data: {
        booking_id: bookingId,
        performer: {
          name: `${booking.performer.user.first_name} ${booking.performer.user.last_name}`,
          email: booking.performer.user.email
        },
        payout_amount: booking.deposit_amount * (1 - 0.10) // 10% platform fee
      }
    });

  } catch (error) {
    console.error('Error processing manual payout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process manual payout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
