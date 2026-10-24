import { PrismaClient, Role, CrawlStatus, ConfirmationStatus, PostStatus, AssetType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PostDaily database seed...');

  // 1. Clean existing seed data
  await prisma.performanceSnapshot.deleteMany({});
  await prisma.postAsset.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.generationJob.deleteMany({});
  await prisma.businessProfileSource.deleteMany({});
  await prisma.businessSettings.deleteMany({});
  await prisma.businessMembership.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Demo User
  const passwordHash = await bcrypt.hash('demo12345', 10);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'demo@postdaily.local',
      passwordHash,
    },
  });

  console.log(`👤 Created Demo User: ${demoUser.email} (Password: demo12345)`);

  // 3. Create Demo Business
  const demoBusiness = await prisma.business.create({
    data: {
      name: 'Kestrel Coffee & Roastery',
      ownerId: demoUser.id,
      websiteUrl: 'https://kestrelcoffeeroasters.com',
      industry: 'Specialty Coffee & Bakery',
      description: 'Neighborhood micro-roaster offering sustainably sourced direct-trade espresso, seasonal cold brew, and fresh artisan sourdough pastries.',
      location: 'Portland, OR',
      brandTone: 'Warm, artisanal, grounded, and welcoming',
      targetAudience: 'Local neighborhood residents, daily commuters, coffee aficionados, and remote creatives',
      preferredLanguage: 'en',
      status: 'ACTIVE',
      memberships: {
        create: {
          userId: demoUser.id,
          role: Role.OWNER,
        },
      },
      settings: {
        create: {
          timezone: 'America/Los_Angeles',
          defaultPlatform: 'INSTAGRAM',
          defaultLanguage: 'en',
          notificationsEnabled: true,
          dailyReminderTime: '08:30',
          theme: 'system',
        },
      },
    },
  });

  console.log(`🏢 Created Demo Business: ${demoBusiness.name}`);

  // 4. Create BusinessProfileSource
  await prisma.businessProfileSource.create({
    data: {
      businessId: demoBusiness.id,
      sourceUrl: demoBusiness.websiteUrl!,
      crawlStatus: CrawlStatus.COMPLETED,
      userConfirmationStatus: ConfirmationStatus.CONFIRMED,
      extractionTimestamp: new Date(),
      extractedData: {
        name: 'Kestrel Coffee & Roastery',
        category: 'Specialty Coffee & Bakery',
        description: 'Neighborhood micro-roaster offering sustainably sourced direct-trade espresso.',
        productsAndServices: [
          'Direct-trade single-origin pour-overs',
          'Oat milk espresso drinks',
          'House-baked sourdough croissants',
          'Whole bean subscription bags',
        ],
        menuOrProductCategories: ['Espresso Bar', 'Drip & Pour-over', 'Pastries', 'Bags of Coffee'],
        brandMessaging: 'Small batches, direct relationships, roasted with heart.',
        targetAudience: 'Coffee lovers and local community in Portland',
        currentOffers: ['Complimentary drip coffee with any 12oz bag purchase'],
        contactInfo: {
          phone: '(503) 555-0192',
          email: 'hello@kestrelcoffeeroasters.com',
          address: '812 SE Division St, Portland, OR',
        },
        websiteUrl: 'https://kestrelcoffeeroasters.com',
        brandVoiceAndTone: 'Artisanal, sincere, and community-centered',
        publicImageUrls: [
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        ],
        brandColors: ['#2F7D5B', '#FAF8F4', '#1F2421'],
      },
    },
  });

  // 5. Create Sample Historical Posts
  const post1 = await prisma.post.create({
    data: {
      businessId: demoBusiness.id,
      title: 'Behind the Scenes: Tuesday Roasting Day',
      caption: 'Every Tuesday morning, the roaster warms up before the doors open. Today we are profiling an Ethiopian Yirgacheffe with bright jasmine and bergamot notes. Come say hi and smell the roast!',
      hashtags: ['specialtycoffee', 'portlandcoffee', 'coffeeroaster', 'localpdx', 'craftroaster'],
      callToAction: 'Drop by between 7am and 3pm to grab freshly roasted beans.',
      imagePrompt: 'A warm natural-light photo of a commercial vintage coffee roaster in operation, stainless steel hopper glowing in morning light, fresh coffee beans tumbling into a cooling tray.',
      platform: 'INSTAGRAM',
      language: 'en',
      contentGoal: 'BEHIND_THE_SCENES',
      status: PostStatus.PUBLISHED,
      targetDate: '2026-10-23',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      snapshots: {
        create: [
          {
            platform: 'INSTAGRAM',
            metricName: 'likes',
            metricValue: 48,
            source: 'SAMPLE_DEMO',
            recordedAt: new Date(),
          },
          {
            platform: 'INSTAGRAM',
            metricName: 'comments',
            metricValue: 7,
            source: 'SAMPLE_DEMO',
            recordedAt: new Date(),
          },
          {
            platform: 'INSTAGRAM',
            metricName: 'shares',
            metricValue: 3,
            source: 'SAMPLE_DEMO',
            recordedAt: new Date(),
          },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      businessId: demoBusiness.id,
      title: 'Autumn Cardamom Latte Special',
      caption: 'Crisp morning air calls for ground green cardamom, steamed whole milk, and our house double shot. Sweetened gently with raw turbinado.',
      hashtags: ['cardamomlatte', 'fallmenu', 'pdxdrinks', 'artisancoffee'],
      callToAction: 'Available hot or iced all through October.',
      imagePrompt: 'Top-down latte art in a ceramic hunter-green cup resting on a reclaimed wooden tabletop with dried autumn leaves nearby.',
      platform: 'INSTAGRAM',
      language: 'en',
      contentGoal: 'PROMOTE_PRODUCT_OR_SERVICE',
      status: PostStatus.PUBLISHED,
      targetDate: '2026-10-24',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      snapshots: {
        create: [
          {
            platform: 'INSTAGRAM',
            metricName: 'likes',
            metricValue: 62,
            source: 'SAMPLE_DEMO',
            recordedAt: new Date(),
          },
          {
            platform: 'INSTAGRAM',
            metricName: 'comments',
            metricValue: 11,
            source: 'SAMPLE_DEMO',
            recordedAt: new Date(),
          },
          // Note: shares, reach, clicks intentionally omitted (null) according to Data Honesty rules!
        ],
      },
    },
  });

  // Today's Draft Post
  await prisma.post.create({
    data: {
      businessId: demoBusiness.id,
      title: 'Fresh Baked Sourdough Morning Routine',
      caption: 'We bake our country loaves and laminated croissants right at 5:30 AM so they are still warm when you walk in. What is your go-to morning pairing?',
      hashtags: ['sourdough', 'localbakery', 'morningpairing', 'pdxmorning'],
      callToAction: 'Tell us your favorite coffee and pastry pairing in the comments!',
      imagePrompt: 'Golden crust sourdough croissant freshly cut open displaying flaky airy layers next to a warm flat white.',
      platform: 'INSTAGRAM',
      language: 'en',
      contentGoal: 'HIGHLIGHT_CUSTOMER_BENEFIT',
      status: PostStatus.DRAFT,
      targetDate: '2026-10-25',
    },
  });

  console.log(`✅ Seed finished successfully! Seeded 3 posts for '${demoBusiness.name}'.`);
}

main()
  .catch(e => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
