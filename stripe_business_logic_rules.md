# Stripe Business Logic Rules & Implementation Guide

## 🎯 Executive Summary

This document defines the comprehensive business logic rules for our Stripe Connect-based performer booking platform, covering platform fee structures, refund policies, payout eligibility, VAT handling, and risk management.

## 💰 Platform Fee Structure & Earning Rules

### Core Fee Model
```typescript
interface PlatformFeeStructure {
  standardRate: 10.0;           // 10% of booking value
  minimumFee: 5.00;            // Minimum £5 fee
  maximumFee: 500.00;          // Maximum £500 fee (for high-value bookings)
  
  // Fee earning trigger points
  feeEarnedOn: 'booking_confirmation';  // Fee earned when payment succeeds
  feeReversalRules: {
    fullRefund: 'reverse_complete_fee',     // 100% fee reversal
    partialRefund: 'proportional_reversal', // Proportional to refund amount
    lateRefund: 'keep_processing_costs'     // Keep Stripe fees + admin costs
  };
}
```

### Fee Calculation Examples
```typescript
// Standard booking fee calculation
function calculatePlatformFee(bookingAmount: number): number {
  const feeAmount = bookingAmount * 0.10;
  return Math.max(5.00, Math.min(500.00, feeAmount));
}

// Multi-performer fee distribution
function distributeMultiPerformerFee(
  totalFee: number, 
  performerSplits: Record<string, number>
): Record<string, number> {
  const feeDistribution: Record<string, number> = {};
  
  for (const [performerId, splitPercentage] of Object.entries(performerSplits)) {
    feeDistribution[performerId] = (totalFee * splitPercentage) / 100;
  }
  
  return feeDistribution;
}
```

## 🔄 Refund Policy & Impact on Platform Fees

### Refund Tiers Based on Cancellation Timing

```typescript
interface RefundPolicy {
  fullRefund: {
    timeframe: '48+ hours before event';
    clientRefund: 100;           // % of booking amount
    platformFeeImpact: 'full_reversal';
    performerPayout: 0;          // % of booking amount
  };
  
  partialRefund: {
    timeframe: '24-48 hours before event';
    clientRefund: 75;            // % of booking amount
    platformFeeImpact: 'proportional_reduction';
    performerPayout: 15;         // % of booking amount (cancellation fee)
  };
  
  minimumRefund: {
    timeframe: '0-24 hours before event';
    clientRefund: 25;            // % of booking amount
    platformFeeImpact: 'keep_processing_costs';
    performerPayout: 65;         // % of booking amount
  };
  
  noRefund: {
    timeframe: 'After event start time';
    clientRefund: 0;             // % of booking amount
    platformFeeImpact: 'keep_full_fee';
    performerPayout: 90;         // % after platform fee
  };
}
```

### Refund Processing Logic

```typescript
async function processRefund(bookingId: string, cancellationReason: string) {
  const booking = await getBookingWithDetails(bookingId);
  const hoursUntilEvent = getHoursUntilEvent(booking.event_date, booking.event_start_time);
  
  let refundPolicy: RefundTier;
  
  if (hoursUntilEvent >= 48) {
    refundPolicy = RefundPolicy.fullRefund;
  } else if (hoursUntilEvent >= 24) {
    refundPolicy = RefundPolicy.partialRefund;
  } else if (hoursUntilEvent > 0) {
    refundPolicy = RefundPolicy.minimumRefund;
  } else {
    refundPolicy = RefundPolicy.noRefund;
  }
  
  const refundAmount = (booking.price_agreed * refundPolicy.clientRefund) / 100;
  const performerPayout = (booking.price_agreed * refundPolicy.performerPayout) / 100;
  
  // Process Stripe refund
  if (refundAmount > 0) {
    await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100), // Convert to pence
      reason: 'requested_by_customer',
      metadata: {
        bookingId,
        refundPolicy: refundPolicy.timeframe,
        cancellationReason
      }
    });
  }
  
  // Adjust platform fee
  await adjustPlatformFeeForRefund(booking, refundPolicy);
  
  // Process performer payout if applicable
  if (performerPayout > 0) {
    await schedulePerformerPayout(booking.performer_id, performerPayout, 'cancellation_fee');
  }
  
  return {
    refundAmount,
    performerPayout,
    adjustedPlatformFee: calculateAdjustedPlatformFee(booking, refundPolicy)
  };
}
```

## 👤 Performer Payout Eligibility & Risk Assessment

### Instant Payout Eligibility Criteria

```typescript
interface InstantPayoutCriteria {
  // Account maturity requirements
  minimumAccountAge: 30;        // Days since account creation
  minimumCompletedBookings: 5;  // Successfully completed bookings
  
  // Performance metrics
  minimumRating: 4.5;          // Average rating threshold
  maximumCancellationRate: 0.05; // 5% maximum cancellation rate
  maximumDisputeRate: 0.01;    // 1% maximum dispute rate
  
  // Verification requirements
  identityVerified: true;       // Government ID verified
  bankAccountVerified: true;    // Bank account verified via Stripe
  addressVerified: true;        // Address verification completed
  
  // Financial thresholds
  maximumSinglePayout: 1000.00; // £1,000 maximum instant payout
  maximumDailyPayouts: 2000.00; // £2,000 maximum daily payouts
  
  // Risk factors (disqualifiers)
  activeDisputes: false;        // No active disputes
  recentChargebacks: false;     // No chargebacks in last 90 days
  suspiciousActivity: false;    // No flagged suspicious activity
}

async function checkInstantPayoutEligibility(performerId: string): Promise<boolean> {
  const performer = await getPerformerWithMetrics(performerId);
  const criteria = InstantPayoutCriteria;
  
  // Check all criteria
  const accountAge = getDaysSince(performer.created_at);
  const completedBookings = await getCompletedBookingsCount(performerId);
  const hasActiveDisputes = await hasActiveDisputes(performerId);
  const recentChargebacks = await hasRecentChargebacks(performerId, 90);
  
  return (
    accountAge >= criteria.minimumAccountAge &&
    completedBookings >= criteria.minimumCompletedBookings &&
    performer.average_rating >= criteria.minimumRating &&
    performer.cancellation_rate <= criteria.maximumCancellationRate &&
    performer.dispute_ratio <= criteria.maximumDisputeRate &&
    performer.identity_verified &&
    performer.bank_account_verified &&
    performer.address_verified &&
    !hasActiveDisputes &&
    !recentChargebacks &&
    !performer.flagged_for_review
  );
}
```

### Payout Hold Periods & Reasons

```typescript
interface PayoutHoldRules {
  newPerformer: {
    duration: 7;                 // Days
    reason: 'Account under 30 days old';
    autoRelease: true;
  };
  
  disputeRisk: {
    duration: 14;                // Days
    reason: 'Recent dispute activity detected';
    autoRelease: false;          // Requires manual review
  };
  
  highValueBooking: {
    duration: 3;                 // Days
    threshold: 500.00;           // £500+ bookings
    reason: 'High-value booking verification';
    autoRelease: true;
  };
  
  riskAssessment: {
    duration: 30;                // Days
    reason: 'Account flagged for manual review';
    autoRelease: false;          // Requires admin approval
  };
  
  vatCompliance: {
    duration: 5;                 // Days
    reason: 'VAT registration verification pending';
    autoRelease: true;           // After VAT number validation
  };
}
```

## 🧾 VAT & Tax Handling

### UK VAT Implementation

```typescript
interface VATConfiguration {
  // Standard UK VAT rates
  standardRate: 0.20;           // 20% standard rate
  reducedRate: 0.05;            // 5% for qualifying services
  zeroRate: 0.00;               // 0% for exports/exempt services
  
  // Registration thresholds
  annualThreshold: 85000;       // £85,000 annual turnover threshold
  
  // Platform VAT handling
  platformFeeVAT: {
    rate: 0.20;                 // 20% VAT on platform fees
    inclusive: false;           // VAT added on top of platform fee
    vatNumber: 'GB123456789';   // Platform's VAT number
  };
  
  // Performer VAT handling
  performerVAT: {
    defaultInclusive: true;     // Prices typically include VAT
    allowExclusive: true;       // Allow VAT-exclusive pricing
    requireRegistration: false; // Don't require VAT registration
  };
}

class VATCalculator {
  static calculateBookingVAT(booking: Booking, performer: Performer) {
    const config = VATConfiguration;
    
    // Platform fee VAT (always applicable)
    const platformFeeVAT = booking.platform_fee * config.platformFeeVAT.rate;
    
    // Performer VAT (if registered)
    let performerVAT = 0;
    let netToPerformer = booking.price_agreed - booking.platform_fee;
    
    if (performer.vat_registered) {
      const vatRate = performer.vat_rate || config.standardRate;
      
      if (booking.vat_inclusive) {
        // VAT is included in the price
        performerVAT = (booking.price_agreed * vatRate) / (1 + vatRate);
        netToPerformer = booking.price_agreed - performerVAT - booking.platform_fee;
      } else {
        // VAT is additional to the price
        performerVAT = booking.price_agreed * vatRate;
        netToPerformer = booking.price_agreed - booking.platform_fee;
      }
    }
    
    return {
      platformFeeVAT,
      performerVAT,
      totalVAT: platformFeeVAT + performerVAT,
      netToPerformer,
      grossToClient: booking.price_agreed + (booking.vat_inclusive ? 0 : performerVAT)
    };
  }
  
  static generateVATInvoice(booking: Booking, vatAmounts: VATBreakdown) {
    return {
      invoiceNumber: `INV-${booking.booking_id}`,
      vatNumber: VATConfiguration.platformFeeVAT.vatNumber,
      items: [
        {
          description: 'Platform Service Fee',
          netAmount: booking.platform_fee,
          vatRate: 0.20,
          vatAmount: vatAmounts.platformFeeVAT,
          grossAmount: booking.platform_fee + vatAmounts.platformFeeVAT
        }
      ],
      totals: {
        netTotal: booking.platform_fee,
        vatTotal: vatAmounts.platformFeeVAT,
        grossTotal: booking.platform_fee + vatAmounts.platformFeeVAT
      }
    };
  }
}
```

## ⚠️ Risk Management & Dispute Handling

### Risk Assessment Framework

```typescript
interface RiskAssessment {
  // Risk levels
  low: {
    score: 0-25;
    actions: ['standard_processing'];
    payoutDelay: 0;
  };
  
  medium: {
    score: 26-50;
    actions: ['enhanced_monitoring', 'payout_review'];
    payoutDelay: 1; // 1 day additional hold
  };
  
  high: {
    score: 51-75;
    actions: ['manual_review', 'payout_hold', 'additional_verification'];
    payoutDelay: 7; // 7 days additional hold
  };
  
  critical: {
    score: 76-100;
    actions: ['account_suspension', 'payout_freeze', 'investigation'];
    payoutDelay: 30; // 30 days hold pending investigation
  };
}

class RiskCalculator {
  static calculateRiskScore(performer: Performer, booking: Booking): number {
    let riskScore = 0;
    
    // Account age factor (newer = higher risk)
    const accountAgeDays = getDaysSince(performer.created_at);
    if (accountAgeDays < 30) riskScore += 20;
    else if (accountAgeDays < 90) riskScore += 10;
    
    // Dispute history
    riskScore += performer.total_dispute_count * 15;
    riskScore += (performer.dispute_ratio * 100) * 2;
    
    // Booking value factor
    if (booking.price_agreed > 1000) riskScore += 15;
    else if (booking.price_agreed > 500) riskScore += 10;
    
    // Performance metrics
    if (performer.average_rating < 4.0) riskScore += 20;
    if (performer.cancellation_rate > 0.10) riskScore += 15;
    
    // Verification status
    if (!performer.identity_verified) riskScore += 25;
    if (!performer.bank_account_verified) riskScore += 20;
    
    // Recent activity patterns
    const recentBookings = await getRecentBookingsCount(performer.id, 30);
    if (recentBookings > 20) riskScore += 10; // Sudden high activity
    
    return Math.min(100, Math.max(0, riskScore));
  }
}
```

### Dispute Management Workflow

```typescript
interface DisputeWorkflow {
  // Dispute stages
  created: {
    actions: ['notify_performer', 'gather_evidence', 'hold_payouts'];
    timeline: '7 days to respond';
    autoActions: true;
  };
  
  evidence_gathering: {
    actions: ['request_documentation', 'compile_evidence', 'submit_to_stripe'];
    timeline: '14 days maximum';
    autoActions: false;
  };
  
  under_review: {
    actions: ['monitor_status', 'provide_additional_evidence'];
    timeline: 'Stripe review period';
    autoActions: true;
  };
  
  resolved: {
    actions: ['update_records', 'release_holds', 'notify_parties'];
    outcomes: ['won', 'lost', 'accepted'];
    autoActions: true;
  };
}

async function handleDispute(disputeId: string, action: string) {
  const dispute = await getDispute(disputeId);
  const booking = await getBookingByChargeId(dispute.charge_id);
  
  switch (action) {
    case 'evidence_submission':
      await submitDisputeEvidence(disputeId, {
        booking_confirmation: booking.confirmation_email,
        service_documentation: booking.service_agreement,
        communication_logs: await getMessageHistory(booking.id),
        performer_credentials: await getPerformerVerification(booking.performer_id)
      });
      break;
      
    case 'accept_dispute':
      await acceptDispute(disputeId);
      await processRefundFromDispute(booking, dispute.amount);
      break;
      
    case 'contest_dispute':
      await contestDispute(disputeId);
      await holdPerformerPayouts(booking.performer_id, 'dispute_pending');
      break;
  }
}
```

## 📊 Financial Reporting & Compliance

### Revenue Recognition Rules

```typescript
interface RevenueRecognition {
  // When revenue is recognized
  platformFeeRecognition: 'on_booking_confirmation';
  
  // Accounting periods
  reportingPeriod: 'monthly';
  vatReportingPeriod: 'quarterly';
  
  // Revenue categories
  categories: {
    platform_fees: 'primary_revenue';
    payment_processing: 'cost_of_sales';
    dispute_fees: 'exceptional_items';
    refund_adjustments: 'revenue_adjustments';
  };
}
```

This comprehensive business logic framework ensures compliant, profitable, and scalable payment operations while maintaining excellent user experience for both clients and performers.
