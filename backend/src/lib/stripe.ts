import Stripe from 'stripe';
import { config } from '../config';

if (!config.stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe Connect configuration
export const STRIPE_CONNECT_CONFIG = {
  // URLs for Stripe Connect onboarding
  RETURN_URL: `${config.frontendUrl}/dashboard/payments/success`,
  REFRESH_URL: `${config.frontendUrl}/dashboard/payments/onboard`,
  
  // Account type for performers
  ACCOUNT_TYPE: 'express' as const,
  
  // Required capabilities for performers
  CAPABILITIES: {
    transfers: { requested: true },
    card_payments: { requested: true },
  },
  
  // Business profile requirements
  BUSINESS_PROFILE: {
    product_description: 'Entertainment and performance services',
    support_email: config.supportEmail || 'support@bookperformers.com',
  },
} as const;
