import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/database';

describe('Authentication Endpoints', () => {
  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'CLIENT' as const,
  };

  // Clean up test user after tests
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user account', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            userType: testUser.userType,
            status: 'ACTIVE',
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should reject duplicate email addresses', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS',
      });
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: 'test2@example.com',
          password: '123',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'WEAK_PASSWORD',
      });
    });

    it('should reject invalid email addresses', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            userType: testUser.userType,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should reject non-existent users', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  describe('GET /api/users/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            userType: testUser.userType,
            status: 'ACTIVE',
          },
        },
      });
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN',
      });
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    });
  });
});
