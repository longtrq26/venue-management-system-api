import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Booking } from '../../modules/booking/entities/booking.entity';
import { Court } from '../../modules/court/entities/court.entity';
import { User } from '../../modules/user/entities/user.entity';
import dataSource from '../data-source';

dotenv.config();

const BATCH_SIZE = 1000;
const TOTAL_RECORDS = 1_000_000; // 1 Million Records

const seed = async () => {
  console.log('🚀 Starting BIG DATA seed...');
  console.log(`🎯 Target: ${TOTAL_RECORDS.toLocaleString()} bookings`);

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // We don't use transaction for the whole lot, to avoid exploding transaction log
    // We will batch inserts.

    try {
      // 1. Fetch Prerequisites
      const [users, courts] = await Promise.all([
        queryRunner.manager.find(User, { select: ['id'] }),
        queryRunner.manager.find(Court, { select: ['id'] }),
      ]);

      if (users.length === 0 || courts.length === 0) {
        throw new Error('❌ Please run "npm run seed:run" first to create Users and Courts.');
      }

      console.log(`ℹ️ Found ${users.length} users and ${courts.length} courts.`);

      const bookingRepository = queryRunner.manager.getRepository(Booking);

      let createdCount = 0;
      const startTime = Date.now();

      while (createdCount < TOTAL_RECORDS) {
        const bookingsBatch: Partial<Booking>[] = [];

        for (let i = 0; i < BATCH_SIZE; i++) {
          if (createdCount + i >= TOTAL_RECORDS) break;

          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomCourt = courts[Math.floor(Math.random() * courts.length)];

          // Random date within last 2 years
          const date = dayjs()
            .subtract(Math.floor(Math.random() * 730), 'day')
            .format('YYYY-MM-DD');

          // Random start time (06:00 to 20:00)
          const startHour = 6 + Math.floor(Math.random() * 14);
          const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
          const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`;

          bookingsBatch.push({
            userId: randomUser.id,
            courtId: randomCourt.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            price: parseFloat(faker.commerce.price({ min: 50000, max: 200000, dec: 0 })),
            status: faker.helpers.arrayElement([
              BookingStatus.CONFIRMED,
              BookingStatus.COMPLETED,
              BookingStatus.CANCELLED,
            ]),
            paymentStatus: faker.helpers.arrayElement([
              PaymentStatus.PAID,
              PaymentStatus.PENDING,
              PaymentStatus.CANCELLED,
            ]),
            groupId: null, // Skipping group logic for speed
          });
        }

        // Bulk Insert
        await bookingRepository
          .createQueryBuilder()
          .insert()
          .into(Booking)
          .values(bookingsBatch)
          .execute();

        createdCount += bookingsBatch.length;

        if (createdCount % 50000 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          const progress = ((createdCount / TOTAL_RECORDS) * 100).toFixed(1);
          console.log(
            `⏳ Progress: ${progress}% (${createdCount.toLocaleString()} records) - ${elapsed}s`,
          );
        }
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ BIG DATA Seed completed in ${totalTime}s!`);
    } catch (err) {
      console.error('❌ Seed failed:', err);
    } finally {
      await queryRunner.release();
      await dataSource.destroy();
    }
  } catch (error) {
    console.error('❌ DataSource initialization failed:', error);
    process.exit(1);
  }
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
