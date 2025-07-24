# Booking Platform Backend API

A TypeScript/Express backend API for the multi-vendor performer booking platform with JWT authentication, Prisma ORM, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform"
   JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (for development)
   npm run db:push
   
   # Or run migrations (for production)
   npm run db:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001/api`

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🔐 Authentication Endpoints

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+44 7700 900123",
  "userType": "CLIENT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "CLIENT",
      "status": "ACTIVE"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "CLIENT"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### GET /api/users/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "CLIENT",
      "status": "ACTIVE",
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Express rate limit middleware
- **CORS Protection**: Configured for frontend origin
- **Helmet Security**: Security headers middleware
- **Password Strength**: Enforced password complexity rules

## 📊 Database Schema

The API uses PostgreSQL with Prisma ORM. Key entities:

- **Users**: Authentication and basic profile
- **Performers**: Extended performer profiles
- **Categories**: Performance categories
- **Bookings**: Event bookings
- **Reviews**: Customer reviews
- **Messages**: Communication system
- **Transactions**: Payment tracking

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The tests cover:
- User registration and validation
- Authentication flows
- JWT token handling
- Protected route access
- Error handling

## 🔧 Development

### Project Structure
```
src/
├── config/           # Configuration and environment
├── controllers/      # Route controllers
├── lib/             # Utilities (JWT, password, validation)
├── middleware/      # Express middleware
├── routes/          # API routes
├── __tests__/       # Test files
└── index.ts         # Application entry point
```

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Import routes in `src/index.ts`
4. Add validation schemas in `src/lib/validation.ts`
5. Write tests in `src/__tests__/`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiry | 7d |
| `FRONTEND_URL` | CORS origin | http://localhost:3000 |

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` (32+ characters)
- Configure production database
- Set up SSL/TLS certificates
- Configure reverse proxy (nginx/Apache)

### Database Migrations
```bash
npm run db:migrate
```

## 📝 API Documentation

Full API documentation is available in `api-examples.http` with example requests for all endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## Performer Booking Platform Backend

A robust backend system for a multi-vendor performer booking platform built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## Features

- **JWT Authentication**: Secure user authentication with token-based authorization
- **User Management**: Registration, login, profile management
- **Performer Profiles**: Complete CRUD operations for performer profiles
- **Category System**: Hierarchical category management with many-to-many relationships
- **Advanced Search & Filtering**: Location-based search, price ranges, ratings, and more
- **Role-based Access Control**: Support for CLIENT, PERFORMER, and ADMIN roles
- **Password Security**: bcrypt hashing with strength validation
- **Input Validation**: Comprehensive validation using Zod schemas
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting, and comprehensive error handling

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Testing**: Jest with Supertest
- **Security**: Helmet, CORS, express-rate-limit

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform"
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
   JWT_EXPIRES_IN="7d"
   FRONTEND_URL="http://localhost:3000"
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed database with sample data
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:3001`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+44 7700 900123",
  "userType": "CLIENT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "CLIENT"
    },
    "token": "jwt-token"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### GET /api/users/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Performer Endpoints

#### GET /api/performers
Get all performers with optional filtering and search.

**Query Parameters:**
- `category`: Filter by category slug (e.g., "magicians")
- `location`: Filter by location
- `minPrice`: Minimum base price
- `maxPrice`: Maximum base price
- `minRating`: Minimum average rating
- `verified`: Filter verified performers only
- `featured`: Filter featured performers only
- `sortBy`: Sort field (rating, price, reviews, bookings)
- `sortOrder`: Sort direction (asc, desc)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example:**
```
GET /api/performers?category=magicians&location=london&minRating=4&sortBy=rating&sortOrder=desc
```

#### GET /api/performers/:id
Get specific performer profile by ID.

#### POST /api/performers
Create performer profile (requires PERFORMER authentication).

**Headers:**
```
Authorization: Bearer <performer-jwt-token>
```

**Request Body:**
```json
{
  "businessName": "Amazing Magic Shows",
  "bio": "Professional magician with 15 years of experience...",
  "location": "London",
  "postcode": "SW1A 1AA",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "travelDistance": 50,
  "basePrice": 350.00,
  "pricePerHour": 200.00,
  "minimumBookingHours": 2,
  "setupTimeMinutes": 30,
  "websiteUrl": "https://amazingmagicshows.co.uk",
  "categories": [
    {
      "categoryId": "category-id",
      "isPrimary": true
    }
  ]
}
```

#### PUT /api/performers/:id
Update performer profile (requires authentication - performer owner or admin).

### Category Endpoints

#### GET /api/categories
Get all categories with optional pagination.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

#### GET /api/categories/:slug
Get category by slug with featured performers.

## Database Schema

The application uses a comprehensive Prisma schema with the following main entities:

- **Users**: Authentication and basic profile information
- **Performers**: Detailed performer profiles with location, pricing, and services
- **Categories**: Service categories (Magicians, Singers, DJs, etc.)
- **PerformerCategories**: Many-to-many relationship between performers and categories
- **Reviews**: Customer reviews and ratings
- **Bookings**: Booking requests and management
- **Messages**: Communication between clients and performers
- **Transactions**: Payment processing records

## Sample Data

The seeding script creates sample accounts for testing:

- **Magician**: `magician@example.com` / `password123`
- **Singer**: `singer@example.com` / `password123`
- **DJ**: `dj@example.com` / `password123`
- **Client**: `client@example.com` / `password123`

And 8 categories:
- Magicians 🎩
- Singers 🎤
- DJs 🎧
- Comedians 😂
- Caricaturists 🎨
- Bands 🎸
- Dancers 💃
- Children's Entertainers 🎪

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Configurable request rate limiting
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers middleware
- **Error Handling**: Comprehensive error handling with sanitized responses
- **Authorization**: Role-based access control for protected resources

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## API Examples

See `api-examples.http` for comprehensive API request examples including:
- Authentication flows
- Performer CRUD operations
- Category management
- Search and filtering
- Error scenarios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License. for details.
