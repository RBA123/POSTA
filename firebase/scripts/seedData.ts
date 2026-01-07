/**
 * Seed script to populate Firestore with test data
 * 
 * Usage:
 *   npx ts-node firebase/scripts/seedData.ts
 * 
 * Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * or use Firebase Admin SDK with service account key
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
// In production, use service account key or default credentials
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Use your Firebase project configuration
      // You can also use Application Default Credentials
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

/**
 * Create a test admin user
 */
async function createTestAdmin() {
  const adminId = 'test-admin-123';
  const adminRef = db.collection('users').doc(adminId);

  await adminRef.set({
    uid: adminId,
    email: 'admin@liberta.com',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1990-01-01')),
    countryCode: 'AR',
    friendCode: 'ADMIN123',
    virtualBalance: 1000,
    totalPositions: 0,
    activePositions: 0,
    winRate: 0,
    totalWinnings: 0,
    totalLosses: 0,
    notificationsEnabled: true,
    notificationPreferences: {
      liveMarkets: true,
      marketResults: true,
      promotions: true,
    },
    createdAt: now,
    updatedAt: now,
    isAdmin: true,
  });

  console.log('✅ Created test admin user:', adminId);
  return adminId;
}

/**
 * Create test markets
 */
async function createTestMarkets(adminId: string) {
  const markets = [
    // EN VIVO markets
    {
      question: '¿Messi mete el penal?',
      category: 'en_vivo' as const,
      isUrgent: true,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60000)), // 1 min ago
      lockAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 120000)), // 2 min from now
    },
    {
      question: '¿Mbappé mete el penal?',
      category: 'en_vivo' as const,
      isUrgent: true,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30000)), // 30 sec ago
      lockAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 90000)), // 1.5 min from now
    },
    {
      question: '¿Hay un gol en los próximos 5 minutos?',
      category: 'en_vivo' as const,
      isUrgent: true,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10000)), // 10 sec ago
      lockAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 110000)), // ~2 min from now
    },
    // PARTIDOS markets
    {
      question: 'México vs Sudáfrica: ¿Gana México?',
      category: 'partidos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
    },
    {
      question: 'Francia vs Senegal: ¿Gana Francia?',
      category: 'partidos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1800000)), // 30 min ago
    },
    {
      question: 'Inglaterra vs Croacia: ¿Gana Inglaterra?',
      category: 'partidos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
    },
    // TORNEOS markets
    {
      question: '¿Qué país gana la Copa del Mundo 2026?',
      category: 'torneos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
    },
    {
      question: '¿Qué continente gana la Copa del Mundo 2026?',
      category: 'torneos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 days ago
    },
    {
      question: '¿Argentina llega a la final del Mundial 2026?',
      category: 'torneos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 259200000)), // 3 days ago
    },
    // FASE DE GRUPOS markets
    {
      question: '¿Quién gana el Grupo A del Mundial 2026?',
      category: 'fase_grupos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 43200000)), // 12 hours ago
    },
    {
      question: '¿Argentina clasifica a octavos de final?',
      category: 'fase_grupos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
    },
    {
      question: '¿Brasil termina primero en su grupo?',
      category: 'fase_grupos' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 129600000)), // 1.5 days ago
    },
    // JUGADORES markets
    {
      question: '¿Lionel Messi juega el Mundial 2026?',
      category: 'jugadores' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 259200000)), // 3 days ago
    },
    {
      question: '¿Mbappé es el goleador del Mundial 2026?',
      category: 'jugadores' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 345600000)), // 4 days ago
    },
    {
      question: '¿Quién gana el Balón de Oro 2026?',
      category: 'jugadores' as const,
      isUrgent: false,
      openAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 432000000)), // 5 days ago
    },
  ];

  const marketRefs = [];

  for (const market of markets) {
    const marketRef = db.collection('markets').doc();
    await marketRef.set({
      id: marketRef.id,
      question: market.question,
      category: market.category,
      siProbability: 50,
      noProbability: 50,
      totalVolume: 0,
      totalBets: 0,
      uniqueBettors: 0,
      siVolume: 0,
      noVolume: 0,
      status: 'open' as const,
      isUrgent: market.isUrgent,
      openAt: market.openAt,
      lockAt: market.lockAt || null,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
      tags: [],
    });

    marketRefs.push(marketRef.id);
    console.log(`✅ Created market: ${market.question}`);
  }

  return marketRefs;
}

/**
 * Create a test regular user
 */
async function createTestUser() {
  const userId = 'test-user-456';
  const userRef = db.collection('users').doc(userId);

  await userRef.set({
    uid: userId,
    email: 'user@liberta.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1995-05-15')),
    countryCode: 'AR',
    friendCode: 'TEST456',
    virtualBalance: 100,
    totalPositions: 0,
    activePositions: 0,
    winRate: 0,
    totalWinnings: 0,
    totalLosses: 0,
    notificationsEnabled: true,
    notificationPreferences: {
      liveMarkets: true,
      marketResults: true,
      promotions: true,
    },
    createdAt: now,
    updatedAt: now,
    isAdmin: false,
  });

  console.log('✅ Created test user:', userId);
  return userId;
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    // Create admin user
    const adminId = await createTestAdmin();
    console.log('');

    // Create test user
    const userId = await createTestUser();
    console.log('');

    // Create markets
    const marketIds = await createTestMarkets(adminId);
    console.log('');

    console.log('✅ Seed completed successfully!');
    console.log(`   - Admin ID: ${adminId}`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Markets created: ${marketIds.length}`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seed, createTestAdmin, createTestUser, createTestMarkets };

