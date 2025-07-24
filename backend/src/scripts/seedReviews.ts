import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedReviewsAndTestimonials() {
  console.log('🌟 Seeding reviews and testimonials...');

  // First, let's get the existing performers and clients
  const performers = await prisma.performer.findMany({
    include: { user: true }
  });

  const clients = await prisma.user.findMany({
    where: { user_type: 'CLIENT' }
  });

  if (performers.length === 0 || clients.length === 0) {
    console.log('⚠️  No performers or clients found. Please run the main seed script first.');
    return;
  }

  // Create additional client users for more realistic reviews
  const additionalClients = [
    {
      email: 'emma.wilson@example.com',
      first_name: 'Emma',
      last_name: 'Wilson',
      phone: '+44 7700 900101'
    },
    {
      email: 'james.brown@example.com',
      first_name: 'James',
      last_name: 'Brown',
      phone: '+44 7700 900102'
    },
    {
      email: 'sophie.davis@example.com',
      first_name: 'Sophie',
      last_name: 'Davis',
      phone: '+44 7700 900103'
    },
    {
      email: 'robert.taylor@example.com',
      first_name: 'Robert',
      last_name: 'Taylor',
      phone: '+44 7700 900104'
    },
    {
      email: 'lisa.anderson@example.com',
      first_name: 'Lisa',
      last_name: 'Anderson',
      phone: '+44 7700 900105'
    }
  ];

  const createdClients: any[] = [];
  for (const clientData of additionalClients) {
    const client = await prisma.user.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        ...clientData,
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
        user_type: 'CLIENT',
        status: 'ACTIVE',
      }
    });
    createdClients.push(client);
  }

  const allClients = [...clients, ...createdClients];

  // Create sample bookings and reviews for each performer
  const reviewsData = [
    // David Magic (Magician) Reviews
    {
      performerEmail: 'magician@example.com',
      reviews: [
        {
          clientEmail: 'emma.wilson@example.com',
          eventType: 'WEDDING' as const,
          eventDate: new Date('2024-06-15'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'David was absolutely incredible at our wedding! His close-up magic during the cocktail hour had all our guests mesmerized. The kids loved his balloon animals, and his stage show was the perfect entertainment between dinner courses. Professional, punctual, and genuinely funny. Could not recommend more highly!',
          photos: [
            'https://picsum.photos/800/600?random=1',
            'https://picsum.photos/800/600?random=2'
          ]
        },
        {
          clientEmail: 'james.brown@example.com',
          eventType: 'BIRTHDAY' as const,
          eventDate: new Date('2024-07-22'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 4,
          writtenReview: 'Hired David for my daughter\'s 8th birthday party and he was fantastic! The kids were completely engaged for the full hour. His magic tricks were age-appropriate and he really knew how to work with children. Great value for money and would definitely book again.',
          photos: []
        },
        {
          clientEmail: 'sophie.davis@example.com',
          eventType: 'CORPORATE' as const,
          eventDate: new Date('2024-05-10'),
          ratingOverall: 4,
          ratingQuality: 5,
          ratingCommunication: 4,
          writtenReview: 'David performed at our company\'s annual dinner and was a real hit. His corporate-friendly humor and impressive magic skills made for great entertainment. A few minor timing issues with setup, but overall a great experience. Our colleagues are still talking about his card tricks!',
          photos: []
        },
        {
          clientEmail: 'robert.taylor@example.com',
          eventType: 'OTHER' as const,
          eventDate: new Date('2024-08-05'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'Booked David for our charity fundraiser and he donated his time at a reduced rate. Not only is he incredibly talented, but he\'s also a genuinely nice person. His performance helped us raise an extra £500 through the entertainment value alone. Highly recommended!',
          photos: ['https://picsum.photos/800/600?random=3']
        }
      ],
      testimonials: [
        {
          authorName: 'Wedding Planner Sarah Mitchell',
          quote: 'I\'ve worked with David on over 20 weddings and he never fails to impress. Professional, reliable, and his magic genuinely adds that special touch that makes weddings memorable. Couples always rave about him in their feedback.',
          eventType: 'WEDDING' as const,
          isFeatured: true
        },
        {
          authorName: 'Corporate Events Manager',
          quote: 'David has been our go-to entertainer for corporate events for the past 3 years. His ability to adapt his performance to different audiences and maintain professionalism while being entertaining is unmatched.',
          eventType: 'CORPORATE' as const,
          isFeatured: false
        }
      ]
    },

    // Sarah Melody (Singer) Reviews
    {
      performerEmail: 'singer@example.com',
      reviews: [
        {
          clientEmail: 'lisa.anderson@example.com',
          eventType: 'WEDDING' as const,
          eventDate: new Date('2024-06-28'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'Sarah\'s voice is absolutely stunning! She sang during our ceremony and reception, and there wasn\'t a dry eye in the house during our first dance. Her song selection was perfect and she was so accommodating with our special requests. A true professional and incredibly talented artist.',
          photos: [
            'https://picsum.photos/800/600?random=4',
            'https://picsum.photos/800/600?random=5'
          ]
        },
        {
          clientEmail: 'client@example.com',
          eventType: 'CORPORATE' as const,
          eventDate: new Date('2024-07-15'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 4,
          writtenReview: 'Sarah performed at our company\'s 25th anniversary celebration. Her jazz repertoire was perfect for the sophisticated atmosphere we wanted to create. She interacted beautifully with our guests and her professionalism shone through. Excellent value and we\'ll definitely book her again.',
          photos: []
        },
        {
          clientEmail: 'emma.wilson@example.com',
          eventType: 'BIRTHDAY' as const,
          eventDate: new Date('2024-08-12'),
          ratingOverall: 4,
          ratingQuality: 5,
          ratingCommunication: 4,
          writtenReview: 'Hired Sarah for my mother\'s 60th birthday party. Her classical and jazz selections were perfect for the occasion. She has an incredible voice and stage presence. Only minor issue was a slight delay in arrival due to traffic, but she made up for it with an extended performance.',
          photos: ['https://picsum.photos/800/600?random=6']
        },
        {
          clientEmail: 'james.brown@example.com',
          eventType: 'OTHER' as const,
          eventDate: new Date('2024-05-20'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'Sarah performed at our local charity gala and was absolutely phenomenal. Her ability to connect with the audience and her incredible vocal range made the evening truly special. She helped us create the perfect atmosphere for our fundraising event.',
          photos: []
        },
        {
          clientEmail: 'sophie.davis@example.com',
          eventType: 'WEDDING' as const,
          eventDate: new Date('2024-04-14'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'Sarah made our wedding day absolutely perfect! From the ceremony to the reception, her voice was like an angel. She learned our special song requests and performed them flawlessly. Our guests are still complimenting us on the entertainment. Worth every penny!',
          photos: []
        }
      ],
      testimonials: [
        {
          authorName: 'Music Director James Patterson',
          quote: 'Sarah is one of the most versatile and professional vocalists I\'ve had the pleasure of working with. Her technical skill combined with her emotional delivery makes every performance memorable. She\'s my first recommendation for any client looking for exceptional vocal entertainment.',
          eventType: 'OTHER' as const,
          isFeatured: true
        }
      ]
    },

    // Mike Beats (DJ) Reviews
    {
      performerEmail: 'dj@example.com',
      reviews: [
        {
          clientEmail: 'robert.taylor@example.com',
          eventType: 'WEDDING' as const,
          eventDate: new Date('2024-07-06'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 5,
          writtenReview: 'Mike absolutely smashed it at our wedding! The dance floor was packed all night long. He read the crowd perfectly and played exactly the right mix of music for our diverse group of guests. His equipment was top-notch and he was incredibly professional throughout. Highly recommend!',
          photos: [
            'https://picsum.photos/800/600?random=7'
          ]
        },
        {
          clientEmail: 'lisa.anderson@example.com',
          eventType: 'BIRTHDAY' as const,
          eventDate: new Date('2024-08-18'),
          ratingOverall: 4,
          ratingQuality: 4,
          ratingCommunication: 5,
          writtenReview: 'Mike DJ\'d my husband\'s 40th birthday party and did a great job. He was very responsive to our music requests and kept the energy up all night. The sound quality was excellent. Only small issue was that some of the music was a bit too loud early in the evening, but he adjusted when we asked.',
          photos: []
        },
        {
          clientEmail: 'sophie.davis@example.com',
          eventType: 'CORPORATE' as const,
          eventDate: new Date('2024-06-03'),
          ratingOverall: 5,
          ratingQuality: 5,
          ratingCommunication: 4,
          writtenReview: 'Mike provided the perfect soundtrack for our corporate summer party. He understood the brief perfectly - background music during networking, then ramping up the energy for dancing later. Professional setup, great music selection, and he helped make our event a huge success.',
          photos: []
        },
        {
          clientEmail: 'client@example.com',
          eventType: 'OTHER' as const,
          eventDate: new Date('2024-05-25'),
          ratingOverall: 4,
          ratingQuality: 4,
          ratingCommunication: 4,
          writtenReview: 'Hired Mike for our community festival and he delivered exactly what we needed. Good variety of music that appealed to all ages, reliable equipment, and he was flexible with our changing schedule. Would recommend for similar events.',
          photos: []
        }
      ],
      testimonials: [
        {
          authorName: 'Event Coordinator Rachel Green',
          quote: 'Mike has been our preferred DJ for corporate events for over 2 years. His professionalism, extensive music library, and ability to read a crowd make him invaluable. He consistently delivers exactly what our clients are looking for.',
          eventType: 'CORPORATE' as const,
          isFeatured: false
        },
        {
          authorName: 'Wedding Venue Manager',
          quote: 'We\'ve worked with many DJs over the years, but Mike stands out for his reliability and quality. He always arrives early, his equipment is professional-grade, and he knows how to keep a wedding reception flowing perfectly. Couples love him!',
          eventType: 'WEDDING' as const,
          isFeatured: true
        }
      ]
    }
  ];

  // Create admin user for testimonial submissions
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
      first_name: 'Admin',
      last_name: 'User',
      phone: '+44 7700 900000',
      user_type: 'ADMIN',
      status: 'ACTIVE',
    }
  });

  // Process each performer's reviews and testimonials
  for (const performerData of reviewsData) {
    const performer = performers.find((p: any) => p.user.email === performerData.performerEmail);
    if (!performer) {
      console.log(`⚠️  Performer with email ${performerData.performerEmail} not found`);
      continue;
    }

    console.log(`📝 Creating reviews for ${performer.user.first_name} ${performer.user.last_name}...`);

    // Create bookings and reviews
    for (const reviewData of performerData.reviews) {
      const client = allClients.find((c: any) => c.email === reviewData.clientEmail);
      if (!client) {
        console.log(`⚠️  Client with email ${reviewData.clientEmail} not found`);
        continue;
      }

      // Create enquiry first
      const enquiry = await prisma.enquiry.create({
        data: {
          client_id: client.id,
          performer_id: performer.id,
          event_type: reviewData.eventType,
          event_date: reviewData.eventDate,
          event_time: '19:00',
          event_duration: 3,
          event_location: 'Sample Event Venue, London',
          guest_count: 50,
          budget_min: 200,
          budget_max: 500,
          message: 'Looking forward to working with you!',
          status: 'ACCEPTED',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          enquiry_id: enquiry.id,
          client_id: client.id,
          performer_id: performer.id,
          event_date: reviewData.eventDate,
          event_time: '19:00',
          event_duration: 3,
          event_location: 'Sample Event Venue, London',
          guest_count: 50,
          confirmed_price: 350.00,
          deposit_amount: 87.50,
          platform_fee: 17.50,
          performer_amount: 332.50,
          deposit_paid: true,
          status: 'COMPLETED'
        }
      });

      // Create review
      await prisma.review.create({
        data: {
          booking_id: booking.id,
          client_id: client.id,
          performer_id: performer.id,
          rating_overall: reviewData.ratingOverall,
          rating_quality: reviewData.ratingQuality,
          rating_communication: reviewData.ratingCommunication,
          written_review: reviewData.writtenReview,
          event_type: reviewData.eventType,
          photos: reviewData.photos,
          is_verified: true
        }
      });
    }

    // Create testimonials
    console.log(`💬 Creating testimonials for ${performer.user.first_name} ${performer.user.last_name}...`);
    for (const testimonialData of performerData.testimonials) {
      await prisma.testimonial.create({
        data: {
          performer_id: performer.id,
          author_name: testimonialData.authorName,
          quote: testimonialData.quote,
          event_type: testimonialData.eventType,
          is_featured: testimonialData.isFeatured,
          submitted_by_user_id: adminUser.id
        }
      });
    }

    // Update performer's average rating and review count
    const reviews = await prisma.review.findMany({
      where: { performer_id: performer.id }
    });

    if (reviews.length > 0) {
      const totalOverall = reviews.reduce((sum: number, review: any) => sum + review.rating_overall, 0);
      const totalQuality = reviews.reduce((sum: number, review: any) => sum + review.rating_quality, 0);
      const totalCommunication = reviews.reduce((sum: number, review: any) => sum + review.rating_communication, 0);

      const avgOverall = totalOverall / reviews.length;
      const avgQuality = totalQuality / reviews.length;
      const avgCommunication = totalCommunication / reviews.length;
      const avgRating = (avgOverall + avgQuality + avgCommunication) / 3;

      await prisma.performer.update({
        where: { id: performer.id },
        data: {
          average_rating: avgRating,
          total_reviews: reviews.length,
        }
      });
    }
  }

  console.log('✅ Reviews and testimonials seeding completed!');
  console.log('\n📊 Summary:');
  
  const totalReviews = await prisma.review.count();
  const totalTestimonials = await prisma.testimonial.count();
  const featuredTestimonials = await prisma.testimonial.count({ where: { is_featured: true } });
  
  console.log(`📝 Total reviews created: ${totalReviews}`);
  console.log(`💬 Total testimonials created: ${totalTestimonials}`);
  console.log(`⭐ Featured testimonials: ${featuredTestimonials}`);
  console.log(`👥 Additional client accounts created: ${additionalClients.length}`);
  console.log(`🔐 Admin account: admin@example.com / password123`);
}
