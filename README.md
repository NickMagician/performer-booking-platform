# Multi-Vendor Performer Booking Platform

A comprehensive booking marketplace platform similar to Poptop.uk.com, connecting event organizers with professional performers across the UK.

## 🎯 Project Overview

This platform enables users to:
- Browse and search performers by category, location, price, and availability
- View detailed performer profiles with media galleries and reviews
- Send enquiries and receive personalized quotes
- Book performers with secure payment processing via Stripe Connect
- Leave reviews and ratings after events

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with React Router v6
- **State Management**: React Query for server state, Context API for search filters
- **Styling**: Custom CSS with responsive design
- **Key Features**: 
  - SEO-friendly URL routing
  - Dynamic search filters with URL synchronization
  - Mobile-first responsive design
  - Real-time search and filtering

### Backend (API Contract Defined)
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: Stripe Connect for multi-vendor payouts
- **Authentication**: JWT-based authentication
- **File Storage**: Cloud storage for performer media

## 📁 Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service layer
│   │   └── App.css         # Global styles
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── database_schema.sql      # Complete database schema
├── prisma_schema_updated.prisma  # Prisma schema with Stripe integration
├── api_contract_booking_system.md  # Complete API documentation
├── stripe_advanced_payment_flows.md  # Stripe implementation guide
├── stripe_business_logic_rules.md   # Business rules and compliance
├── database_erd.md         # Entity Relationship Diagram
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Stripe account for payments

### Frontend Setup

1. **Install Node.js**
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_USE_MOCK_API=true
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

### Backend Setup (When Ready)

1. **Database Setup**
   - Create PostgreSQL database
   - Run the SQL schema from `database_schema.sql`
   - Or use Prisma: `npx prisma db push`

2. **Environment Variables**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   JWT_SECRET="your-jwt-secret"
   ```

3. **Stripe Connect Setup**
   - Configure Stripe Connect for multi-vendor payouts
   - Set up webhooks as documented in `stripe_advanced_payment_flows.md`

## 🎨 Key Features Implemented

### Frontend Components
- **Header**: Navigation with search functionality
- **Footer**: Links and contact information
- **HomePage**: Hero section, categories, featured performers
- **SearchResultsPage**: Filterable performer listings
- **PerformerProfilePage**: Detailed performer information
- **CategoryPage**: Category-specific performer listings
- **SearchFilters**: Live filtering with URL synchronization
- **PerformerCard**: Reusable performer display component

### Pages
- **Home**: Landing page with hero section and featured content
- **Categories**: Browse all performer categories
- **Search Results**: Filtered performer listings
- **Performer Profiles**: Dynamic performer detail pages
- **About**: Company information and mission
- **FAQ**: Frequently asked questions
- **Terms**: Terms and conditions
- **404**: Custom error page

### Advanced Features
- **SEO-Friendly URLs**: `/magicians/london`, `/performer/john-smith`
- **Mobile Responsive**: Optimized for all device sizes
- **Loading States**: Smooth user experience with loading indicators
- **Error Handling**: Graceful error states and fallbacks
- **Mock API**: Development-ready with fallback data

## 💳 Payment System

### Stripe Connect Integration
- **Multi-vendor payouts** with automatic fee distribution
- **Advanced refund policies** with tiered cancellation fees
- **Payment retry logic** with exponential backoff
- **Dispute management** and chargeback handling
- **VAT compliance** for UK performers
- **Payout delays** for new performers and risk assessment

### Business Logic
- **Platform Fee**: 10% of booking value (min £5, max £500)
- **Instant Payouts**: Available for verified, established performers
- **Risk Assessment**: Automated holds for high-risk transactions
- **Refund Policies**: Time-based cancellation terms

## 🔍 Search & Filtering

### Filter Options
- **Category**: Magicians, Singers, DJs, etc.
- **Location**: City, region, or postcode
- **Price Range**: Min/max budget filtering
- **Rating**: Minimum star rating
- **Features**: Special skills or equipment
- **Availability**: Date-based availability

### URL Structure
- `/categories` - All categories
- `/magicians` - Category page
- `/magicians/london` - Category + location
- `/performer/john-smith` - Performer profile
- `/search?category=magicians&location=london&price=100-500`

## 📊 Database Schema

### Core Entities
- **Users**: Client and performer accounts
- **Performers**: Performer profiles and settings
- **Categories**: Performance categories
- **Bookings**: Event bookings and status
- **Reviews**: Customer feedback and ratings
- **Transactions**: Payment and payout records
- **Messages**: Communication between parties

### Key Relationships
- Performers can have multiple categories
- Bookings link users, performers, and transactions
- Reviews are tied to completed bookings
- Messages facilitate booking communication

## 🛠️ Development

### Mock API
The frontend includes a mock API service for development without a backend:
- Sample performer data
- Category listings
- Location data
- Review examples

### Environment Modes
- **Development**: Uses mock API by default
- **Production**: Connects to real backend API

### Code Organization
- **Components**: Reusable UI elements
- **Pages**: Route-specific components
- **Context**: Global state management
- **Services**: API abstraction layer

## 🚀 Deployment

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to hosting service (Netlify, Vercel, etc.)
3. Configure environment variables for production API

### Backend Deployment
1. Set up production database
2. Configure Stripe webhooks
3. Deploy API server with environment variables
4. Run database migrations

## 📈 Next Steps

### Immediate Priorities
1. **Backend API Development**: Implement the documented API endpoints
2. **Integration Testing**: Connect frontend to real backend
3. **Payment Testing**: Test Stripe integration in sandbox mode
4. **Content Management**: Add real performer data and content

### Future Enhancements
1. **Admin Panel**: Performer and booking management
2. **Mobile App**: Native iOS/Android applications
3. **Advanced Analytics**: Performance metrics and reporting
4. **Multi-language Support**: Internationalization
5. **AI Recommendations**: Smart performer matching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 Documentation

- **API Contract**: `api_contract_booking_system.md`
- **Database Schema**: `database_schema.sql` and `prisma_schema_updated.prisma`
- **Payment Flows**: `stripe_advanced_payment_flows.md`
- **Business Rules**: `stripe_business_logic_rules.md`
- **ERD**: `database_erd.md`

## 📞 Support

For questions or support:
- Email: hello@bookperformers.co.uk
- Phone: 0800 123 4567

---

**Built with ❤️ for connecting amazing performers with unforgettable events**
