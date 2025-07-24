# API Contract - Booking System Extension

## 🔗 New API Endpoints

### Booking Management

#### **POST /api/bookings/create**
Create a new booking from an accepted enquiry.

```typescript
interface CreateBookingRequest {
  enquiryId: number;
  priceAgreed: number;
  depositPercentage?: number; // Default: 25%
  eventDetails?: {
    specialRequirements?: string;
    finalizedVenue?: string;
  };
}

interface CreateBookingResponse {
  booking: {
    id: number;
    bookingId: string; // BK-2024-001
    status: 'tentative';
    priceAgreed: number;
    depositAmount: number;
    platformFee: number;
    payoutDueToPerformer: number;
    stripePaymentIntentId?: string;
  };
  paymentUrl?: string; // Stripe Checkout URL
}
```

#### **POST /api/bookings/{bookingId}/confirm**
Confirm a booking with payment.

```typescript
interface ConfirmBookingRequest {
  paymentMethodId: string; // Stripe Payment Method ID
  savePaymentMethod?: boolean;
}

interface ConfirmBookingResponse {
  booking: BookingDetails;
  paymentStatus: 'succeeded' | 'requires_action' | 'failed';
  clientSecret?: string; // For 3D Secure
}
```

#### **POST /api/bookings/{bookingId}/cancel**
Cancel a booking.

```typescript
interface CancelBookingRequest {
  reason: string;
  refundAmount?: number;
  cancellationFee?: number;
}

interface CancelBookingResponse {
  booking: BookingDetails;
  refund?: {
    amount: number;
    estimatedArrival: string; // "5-10 business days"
  };
}
```

#### **GET /api/bookings/{bookingId}**
Get booking details.

```typescript
interface BookingDetails {
  id: number;
  bookingId: string;
  status: 'tentative' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  enquiry: EnquiryDetails;
  client: ClientSummary;
  performer: PerformerSummary;
  pricing: {
    priceAgreed: number;
    depositAmount: number;
    depositPaid: boolean;
    depositPaidAt?: string;
    platformFee: number;
    payoutDueToPerformer: number;
  };
  event: {
    date: string;
    startTime?: string;
    duration?: number;
    venue: VenueDetails;
  };
  timeline: BookingStatusEvent[];
  payments: Transaction[];
  createdAt: string;
  updatedAt: string;
}
```

### Payment & Transaction Management

#### **GET /api/transactions**
List transactions with filters.

```typescript
interface TransactionListRequest {
  bookingId?: string;
  performerId?: number;
  type?: 'payout' | 'platform_fee' | 'refund' | 'chargeback';
  status?: 'pending' | 'succeeded' | 'failed';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface TransactionListResponse {
  transactions: TransactionSummary[];
  pagination: PaginationInfo;
  totals: {
    totalAmount: number;
    pendingAmount: number;
    succeededAmount: number;
  };
}
```

#### **POST /api/transactions/payout**
Process payout to performer.

```typescript
interface ProcessPayoutRequest {
  bookingId: number;
  amount?: number; // Optional override
  description?: string;
}

interface ProcessPayoutResponse {
  transaction: TransactionDetails;
  stripeTransferId: string;
  estimatedArrival: string;
}
```

### Messaging System

#### **GET /api/messages/threads**
List message threads for current user.

```typescript
interface MessageThreadsResponse {
  threads: {
    id: number;
    threadId: string;
    subject?: string;
    participants: {
      client: UserSummary;
      performer: UserSummary;
    };
    relatedTo: {
      type: 'enquiry' | 'booking';
      id: number;
      reference: string;
    };
    lastMessage: {
      text: string;
      sender: UserSummary;
      createdAt: string;
    };
    unreadCount: number;
    isArchived: boolean;
    updatedAt: string;
  }[];
  pagination: PaginationInfo;
}
```

#### **GET /api/messages/thread/{threadId}**
Get messages in a thread.

```typescript
interface MessageThreadResponse {
  thread: MessageThreadDetails;
  messages: {
    id: number;
    sender: UserSummary;
    messageText: string;
    attachments?: FileAttachment[];
    isSystemMessage: boolean;
    messageType: 'text' | 'image' | 'file' | 'system';
    readAt?: string;
    createdAt: string;
    editedAt?: string;
  }[];
  pagination: PaginationInfo;
}
```

#### **POST /api/messages/thread/{threadId}/send**
Send a message in a thread.

```typescript
interface SendMessageRequest {
  messageText: string;
  attachments?: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  messageType?: 'text' | 'image' | 'file';
}

interface SendMessageResponse {
  message: MessageDetails;
  thread: MessageThreadSummary;
}
```

#### **POST /api/messages/thread/{threadId}/mark-read**
Mark messages as read.

```typescript
interface MarkReadRequest {
  messageIds?: number[]; // If not provided, marks all as read
}

interface MarkReadResponse {
  markedCount: number;
  thread: MessageThreadSummary;
}
```

### Performer Pricing Management

#### **GET /api/performers/{performerId}/pricing**
Get performer pricing packages.

```typescript
interface PerformerPricingResponse {
  pricing: {
    id: number;
    eventType: string;
    durationMinutes: number;
    packageName: string;
    price: number;
    currency: string;
    isDefault: boolean;
    notes?: string;
    isActive: boolean;
  }[];
}
```

#### **POST /api/performers/{performerId}/pricing**
Create new pricing package.

```typescript
interface CreatePricingRequest {
  eventType: string;
  durationMinutes: number;
  packageName: string;
  price: number;
  isDefault?: boolean;
  notes?: string;
}

interface CreatePricingResponse {
  pricing: PerformerPricingDetails;
}
```

#### **PUT /api/performers/{performerId}/pricing/{pricingId}**
Update pricing package.

```typescript
interface UpdatePricingRequest {
  packageName?: string;
  price?: number;
  durationMinutes?: number;
  isDefault?: boolean;
  notes?: string;
  isActive?: boolean;
}
```

## 🔄 Stripe Connect Integration Flow

### Performer Onboarding Flow

```typescript
// 1. Create Stripe Connect Account
POST /api/performers/stripe/connect-account
{
  performerId: number;
  countryCode: 'GB';
  businessType: 'individual' | 'company';
}

// Response includes account setup URL
{
  stripeAccountId: 'acct_xxx';
  accountLinkUrl: 'https://connect.stripe.com/setup/...';
  expiresAt: '2024-01-01T12:00:00Z';
}

// 2. Handle Stripe Connect Webhook
POST /webhooks/stripe/connect
{
  type: 'account.updated';
  data: {
    object: {
      id: 'acct_xxx';
      charges_enabled: true;
      payouts_enabled: true;
    }
  }
}

// 3. Update performer status
PATCH /api/performers/{performerId}
{
  stripeAccountId: 'acct_xxx';
  payoutsEnabled: true;
}
```

### Payment Flow Pseudocode

```typescript
// Client booking confirmation flow
async function confirmBooking(bookingId: string, paymentMethodId: string) {
  const booking = await getBooking(bookingId);
  
  // Create payment intent with application fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.depositAmount * 100, // Convert to cents
    currency: 'gbp',
    payment_method: paymentMethodId,
    confirm: true,
    application_fee_amount: booking.platformFee * 100,
    transfer_data: {
      destination: booking.performer.stripeAccountId,
    },
    metadata: {
      bookingId: booking.bookingId,
      clientId: booking.clientId.toString(),
      performerId: booking.performerId.toString(),
    }
  });
  
  if (paymentIntent.status === 'succeeded') {
    await updateBookingStatus(bookingId, 'confirmed');
    await createTransaction({
      bookingId,
      type: 'platform_fee',
      amount: booking.platformFee,
      stripeTransactionId: paymentIntent.id,
      status: 'succeeded'
    });
    
    // Send confirmation messages
    await sendSystemMessage(booking.messageThreadId, 
      `Booking confirmed! Deposit of £${booking.depositAmount} has been processed.`
    );
  }
  
  return paymentIntent;
}

// Performer payout flow
async function processPerformerPayout(bookingId: string) {
  const booking = await getBooking(bookingId);
  
  if (booking.status !== 'completed') {
    throw new Error('Booking must be completed before payout');
  }
  
  // Create transfer to performer
  const transfer = await stripe.transfers.create({
    amount: booking.payoutDueToPerformer * 100,
    currency: 'gbp',
    destination: booking.performer.stripeAccountId,
    metadata: {
      bookingId: booking.bookingId,
      performerId: booking.performerId.toString(),
    }
  });
  
  await createTransaction({
    bookingId,
    type: 'payout',
    amount: booking.payoutDueToPerformer,
    stripeTransferId: transfer.id,
    status: 'succeeded'
  });
  
  return transfer;
}
```

## 🎣 Stripe Webhook Handlers

### Payment Intent Webhooks

```typescript
// Handle successful payments
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const bookingId = paymentIntent.metadata.bookingId;
  
  await updateBookingPaymentStatus(bookingId, {
    stripePaymentIntentId: paymentIntent.id,
    depositPaidAt: new Date(),
    status: 'confirmed'
  });
  
  // Send confirmation email and in-app message
  await sendBookingConfirmationNotifications(bookingId);
}

// Handle failed payments
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const bookingId = paymentIntent.metadata.bookingId;
  
  await updateBookingStatus(bookingId, 'tentative');
  await sendSystemMessage(bookingId, 
    `Payment failed: ${paymentIntent.last_payment_error?.message}. Please try again.`
  );
}
```

### Transfer & Payout Webhooks

```typescript
// Handle successful transfers to performers
async function handleTransferCreated(event: Stripe.Event) {
  const transfer = event.data.object as Stripe.Transfer;
  const bookingId = transfer.metadata.bookingId;
  
  await updateTransactionStatus(transfer.id, 'succeeded');
  await sendSystemMessage(bookingId, 
    `Payout of £${transfer.amount / 100} has been sent to performer.`
  );
}

// Handle payout failures
async function handleTransferFailed(event: Stripe.Event) {
  const transfer = event.data.object as Stripe.Transfer;
  
  await updateTransactionStatus(transfer.id, 'failed');
  await notifyAdminOfPayoutFailure(transfer);
}
```

## 📊 Database Query Examples

### Get Booking with Full Details

```sql
SELECT 
  b.*,
  bs.status_name as status,
  uc.first_name as client_first_name,
  uc.last_name as client_last_name,
  up.first_name as performer_first_name,
  up.last_name as performer_last_name,
  p.stage_name as performer_stage_name,
  p.slug as performer_slug
FROM bookings b
JOIN booking_statuses bs ON b.status_id = bs.id
JOIN users uc ON b.client_id = uc.id
JOIN users up ON b.performer_id = up.id
JOIN performers p ON b.performer_id = p.id
WHERE b.booking_id = $1;
```

### Get Performer Revenue Analytics

```sql
SELECT 
  p.id,
  p.stage_name,
  COUNT(b.id) as total_bookings,
  SUM(CASE WHEN bs.status_name = 'completed' THEN b.payout_due_to_performer ELSE 0 END) as total_earned,
  SUM(CASE WHEN bs.status_name = 'completed' THEN b.platform_fee ELSE 0 END) as platform_fees_generated,
  AVG(b.price_agreed) as average_booking_value
FROM performers p
LEFT JOIN bookings b ON p.id = b.performer_id
LEFT JOIN booking_statuses bs ON b.status_id = bs.id
WHERE p.is_active = true
GROUP BY p.id, p.stage_name
ORDER BY total_earned DESC;
```

This comprehensive API contract provides all the endpoints needed to handle the complete booking lifecycle, from enquiry to payment to completion, with robust messaging and transaction tracking.
