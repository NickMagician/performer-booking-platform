import { PrismaClient } from '@prisma/client';
import { seedReviewsAndTestimonials } from './seedReviews';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories
  const categories = [
    {
      name: 'Magicians',
      slug: 'magicians',
      description: 'Professional magicians for all types of events',
      icon_url: '🎩',
      sort_order: 1,
    },
    {
      name: 'Singers',
      slug: 'singers',
      description: 'Talented vocalists and musical performers',
      icon_url: '🎤',
      sort_order: 2,
    },
    {
      name: 'DJs',
      slug: 'djs',
      description: 'Professional DJs and music entertainment',
      icon_url: '🎧',
      sort_order: 3,
    },
    {
      name: 'Comedians',
      slug: 'comedians',
      description: 'Stand-up comedians and comedy entertainers',
      icon_url: '😂',
      sort_order: 4,
    },
    {
      name: 'Caricaturists',
      slug: 'caricaturists',
      description: 'Artists creating fun caricature drawings',
      icon_url: '🎨',
      sort_order: 5,
    },
    {
      name: 'Bands',
      slug: 'bands',
      description: 'Live bands and musical groups',
      icon_url: '🎸',
      sort_order: 6,
    },
    {
      name: 'Dancers',
      slug: 'dancers',
      description: 'Professional dancers and dance troupes',
      icon_url: '💃',
      sort_order: 7,
    },
    {
      name: 'Children\'s Entertainers',
      slug: 'childrens-entertainers',
      description: 'Specialized entertainment for children\'s parties',
      icon_url: '🎪',
      sort_order: 8,
    },
  ];

  console.log('📂 Creating categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  // Create sample users and performers
  const sampleUsers = [
    {
      email: 'magician@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
      first_name: 'David',
      last_name: 'Magic',
      phone: '+44 7700 900001',
      user_type: 'PERFORMER' as const,
      status: 'ACTIVE' as const,
      performer: {
        business_name: 'Magic Dave Entertainment',
        bio: 'Professional magician with over 10 years of experience entertaining audiences of all ages. Specializing in close-up magic, stage shows, and children\'s parties.',
        location: 'London',
        postcode: 'SW1A 1AA',
        latitude: 51.5074,
        longitude: -0.1278,
        travel_distance: 50,
        base_price: 250.00,
        price_per_hour: 150.00,
        minimum_booking_hours: 2,
        setup_time_minutes: 30,
        website_url: 'https://magicdave.co.uk',
        is_verified: true,
        is_featured: true,
        average_rating: 4.8,
        total_reviews: 24,
        total_bookings: 156,
      },
      categories: ['magicians'],
    },
    {
      email: 'singer@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
      first_name: 'Sarah',
      last_name: 'Melody',
      phone: '+44 7700 900002',
      user_type: 'PERFORMER' as const,
      status: 'ACTIVE' as const,
      performer: {
        business_name: 'Sarah Melody Vocals',
        bio: 'Award-winning vocalist with a repertoire spanning jazz, pop, and classical music. Perfect for weddings, corporate events, and private parties.',
        location: 'Manchester',
        postcode: 'M1 1AA',
        latitude: 53.4808,
        longitude: -2.2426,
        travel_distance: 75,
        base_price: 400.00,
        price_per_hour: 200.00,
        minimum_booking_hours: 3,
        setup_time_minutes: 45,
        website_url: 'https://sarahmelody.com',
        facebook_url: 'https://facebook.com/sarahmelodymusic',
        instagram_url: 'https://instagram.com/sarahmelody',
        is_verified: true,
        is_featured: true,
        average_rating: 4.9,
        total_reviews: 31,
        total_bookings: 89,
      },
      categories: ['singers'],
    },
    {
      email: 'dj@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
      first_name: 'Mike',
      last_name: 'Beats',
      phone: '+44 7700 900003',
      user_type: 'PERFORMER' as const,
      status: 'ACTIVE' as const,
      performer: {
        business_name: 'DJ Mike Beats',
        bio: 'Professional DJ with state-of-the-art equipment and an extensive music library. Specializing in weddings, corporate events, and club nights.',
        location: 'Birmingham',
        postcode: 'B1 1AA',
        latitude: 52.4862,
        longitude: -1.8904,
        travel_distance: 100,
        base_price: 300.00,
        price_per_hour: 100.00,
        minimum_booking_hours: 4,
        setup_time_minutes: 60,
        website_url: 'https://djmikebeats.co.uk',
        instagram_url: 'https://instagram.com/djmikebeats',
        youtube_url: 'https://youtube.com/djmikebeats',
        is_verified: true,
        is_featured: false,
        average_rating: 4.7,
        total_reviews: 18,
        total_bookings: 67,
      },
      categories: ['djs'],
    },
  ];

  console.log('👥 Creating sample users and performers...');
  
  for (const userData of sampleUsers) {
    const { performer: performerData, categories: categoryNames, ...userInfo } = userData;
    
    // Create user
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {},
      create: userInfo,
    });

    // Get category IDs
    const categories = await prisma.category.findMany({
      where: { slug: { in: categoryNames } },
      select: { id: true },
    });

    // Create performer profile
    await prisma.performer.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        ...performerData,
        user_id: user.id,
        categories: {
          create: categories.map((cat, index) => ({
            category_id: cat.id,
            is_primary: index === 0, // First category is primary
          })),
        },
      },
    });
  }

  // Create a sample client user
  console.log('👤 Creating sample client user...');
  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
      first_name: 'John',
      last_name: 'Client',
      phone: '+44 7700 900100',
      user_type: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('🎩 Magician: magician@example.com / password123');
  console.log('🎤 Singer: singer@example.com / password123');
  console.log('🎧 DJ: dj@example.com / password123');
  console.log('👤 Client: client@example.com / password123');

  // Seed reviews and testimonials
  await seedReviewsAndTestimonials();
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
