import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Demo Data Seeder ---');

  // 1. Ensure Demo Users
  const corePasswordHash = await bcrypt.hash('CorePassword123!', 10);
  const execPasswordHash = await bcrypt.hash('ExecutivePassword123!', 10);

  const coreUser = await prisma.user.upsert({
    where: { email: 'core@acm.org' },
    update: {},
    create: {
      email: 'core@acm.org',
      name: 'Dr. Sarah Jenkins',
      passwordHash: corePasswordHash,
      role: 'CORE',
      isActive: true
    }
  });

  const execUser = await prisma.user.upsert({
    where: { email: 'executive@acm.org' },
    update: {},
    create: {
      email: 'executive@acm.org',
      name: 'Alex Rivera',
      passwordHash: execPasswordHash,
      role: 'EXECUTIVE',
      isActive: true
    }
  });

  console.log('Demo accounts verified:', coreUser.email, execUser.email);

  // 2. Active Semester Budget
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 5, 0);

  const budget = await prisma.budget.upsert({
    where: {
      name_startsAt_endsAt: {
        name: 'ACM 2026-27 Semester Operational Fund',
        startsAt: startMonth,
        endsAt: endMonth
      }
    },
    update: {
      totalAmount: 95000.00
    },
    create: {
      name: 'ACM 2026-27 Semester Operational Fund',
      period: 'SEMESTER',
      startsAt: startMonth,
      endsAt: endMonth,
      totalAmount: 95000.00,
      createdById: coreUser.id
    }
  });

  console.log('Active Budget created/updated:', budget.name, '₹', budget.totalAmount.toString());

  // Clean existing events/expenses to prevent duplicate accumulation if rerun
  await prisma.activityLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.event.deleteMany({});

  // 3. Create Events
  const hackathonStart = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
  hackathonStart.setHours(10, 0, 0, 0);
  const hackathonEnd = new Date(hackathonStart.getTime() + 36 * 3600 * 1000);

  const eventHackathon = await prisma.event.create({
    data: {
      title: 'ACM Incursion: 36-Hour National Hackathon',
      description: 'The flagship annual hackathon of the ACM Student Chapter. Over 300 builders gather to solve challenges across AI, Web3, Distributed Systems, and Open Source. Mentorship, API sponsors, and high-energy demos.',
      category: 'Hackathon',
      startsAt: hackathonStart,
      endsAt: hackathonEnd,
      timezone: 'Asia/Kolkata',
      venue: 'Main Auditorium Hall A',
      expectedAudience: 'All students, developers, designers',
      organizer: 'ACM Core Team',
      campusRelevant: true,
      status: 'PUBLISHED',
      createdById: coreUser.id
    }
  });

  // Conflicting event intentionally placed in same venue & time
  const conflictStart = new Date(hackathonStart.getTime() + 4 * 3600 * 1000);
  const conflictEnd = new Date(conflictStart.getTime() + 4 * 3600 * 1000);

  const eventConflict = await prisma.event.create({
    data: {
      title: 'Campus Robotics & Automation Expo',
      description: 'Annual project showcase for autonomous robots, drones, and edge embedded devices. High attendance expected across all engineering disciplines.',
      category: 'Exhibition',
      startsAt: conflictStart,
      endsAt: conflictEnd,
      timezone: 'Asia/Kolkata',
      venue: 'Main Auditorium Hall A',
      expectedAudience: 'All students, engineering departments',
      organizer: 'Robotics Society & ACM Partner',
      campusRelevant: true,
      status: 'DRAFT',
      createdById: execUser.id
    }
  });

  // Workshop 1
  const workshopStart = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
  workshopStart.setHours(11, 0, 0, 0);
  const workshopEnd = new Date(workshopStart.getTime() + 3 * 3600 * 1000);

  const eventWorkshop = await prisma.event.create({
    data: {
      title: 'Deep Learning & Vision Transformers Workshop',
      description: 'Hands-on architectural deep dive into self-attention in vision transformers (ViT), fine-tuning Hugging Face models, and running edge inference with PyTorch.',
      category: 'Workshop',
      startsAt: workshopStart,
      endsAt: workshopEnd,
      timezone: 'Asia/Kolkata',
      venue: 'Turing Lab 402',
      expectedAudience: 'CS & AI Majors, ACM Members',
      organizer: 'ACM AI Research Wing',
      campusRelevant: false,
      status: 'PUBLISHED',
      createdById: coreUser.id
    }
  });

  // Tech Talk
  const talkStart = new Date(now.getTime() + 8 * 24 * 3600 * 1000);
  talkStart.setHours(16, 0, 0, 0);
  const talkEnd = new Date(talkStart.getTime() + 2 * 3600 * 1000);

  const eventTalk = await prisma.event.create({
    data: {
      title: 'Systems Design & Microservices at Scale',
      description: 'An interactive session with staff engineers discussing real-world distributed consistency, CQRS patterns, message queues, and high-throughput databases.',
      category: 'Tech Talk',
      startsAt: talkStart,
      endsAt: talkEnd,
      timezone: 'Asia/Kolkata',
      venue: 'Seminar Hall B',
      expectedAudience: 'Sophomores, Juniors, Seniors',
      organizer: 'ACM Alumni Network',
      campusRelevant: true,
      status: 'PUBLISHED',
      createdById: coreUser.id
    }
  });

  // Past Event
  const pastStart = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
  pastStart.setHours(14, 0, 0, 0);
  const pastEnd = new Date(pastStart.getTime() + 3 * 3600 * 1000);

  const eventPast = await prisma.event.create({
    data: {
      title: 'Introduction to Open Source & Git Collaboration',
      description: 'Getting started with GitHub, submitting first pull requests, understanding open source licensing, and participating in Hacktoberfest.',
      category: 'Workshop',
      startsAt: pastStart,
      endsAt: pastEnd,
      timezone: 'Asia/Kolkata',
      venue: 'Auditorium Hall C',
      expectedAudience: 'First year engineering students',
      organizer: 'ACM Student Chapter',
      campusRelevant: true,
      status: 'PUBLISHED',
      createdById: coreUser.id
    }
  });

  console.log('Events seeded successfully!');

  // 4. Create Expenses
  const expensesData = [
    {
      amount: 12500.00,
      category: 'Workshop Supplies',
      transactionDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      description: 'Cloud GPU instance compute credits and testing sandboxes for hackathon tracks',
      eventId: eventHackathon.id,
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      createdById: coreUser.id
    },
    {
      amount: 18000.00,
      category: 'Speaker Honorarium',
      transactionDate: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
      description: 'Industry keynote speaker roundtrip travel arrangement & honorarium grant',
      eventId: eventTalk.id,
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      createdById: coreUser.id
    },
    {
      amount: 14250.00,
      category: 'Prizes & Swag',
      transactionDate: new Date(now.getTime() - 6 * 24 * 3600 * 1000),
      description: 'Custom embroidered ACM zip hoodies, stickers, and laser-cut acrylic winner trophies',
      eventId: eventHackathon.id,
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      createdById: coreUser.id
    },
    {
      amount: 7800.00,
      category: 'Food & Catering',
      transactionDate: new Date(now.getTime() - 8 * 24 * 3600 * 1000),
      description: 'High tea, refreshments, and artisan coffee catering for workshop participants',
      eventId: eventWorkshop.id,
      receiptUrl: null,
      createdById: execUser.id
    },
    {
      amount: 6500.00,
      category: 'Marketing & Printing',
      transactionDate: new Date(now.getTime() - 9 * 24 * 3600 * 1000),
      description: 'Full-bleed campus standees, entrance arch banners, and vinyl directional signs',
      eventId: eventHackathon.id,
      receiptUrl: null,
      createdById: execUser.id
    },
    {
      amount: 4200.00,
      category: 'Logistics & Venue',
      transactionDate: new Date(now.getTime() - 12 * 24 * 3600 * 1000),
      description: 'Heavy duty power extension cords, HDMI-to-USB-C splitters, and wireless presenter clickers',
      eventId: null,
      receiptUrl: null,
      createdById: coreUser.id
    }
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({ data: exp });
  }
  console.log(`Created ${expensesData.length} expense records.`);

  // 5. Activity Logs
  const activities = [
    {
      actorId: coreUser.id,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: eventHackathon.id,
      metadata: { title: eventHackathon.title }
    },
    {
      actorId: execUser.id,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: eventConflict.id,
      metadata: { title: eventConflict.title }
    },
    {
      actorId: coreUser.id,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      metadata: { title: 'Cloud GPU compute credits', amount: '12500.00' }
    },
    {
      actorId: execUser.id,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      metadata: { title: 'High tea & refreshments', amount: '7800.00' }
    },
    {
      actorId: coreUser.id,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: eventWorkshop.id,
      metadata: { title: eventWorkshop.title }
    }
  ];

  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }
  console.log('Activity logs seeded.');

  console.log('--- Demo Data Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
