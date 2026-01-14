import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { CourtStatus } from '../../common/enums/court-status.enum';
import { CourtType } from '../../common/enums/court-type.enum';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { Role } from '../../common/enums/role.enum';
import { CourtPricing } from '../../modules/court/entities/court-pricing.entity';
import { Court } from '../../modules/court/entities/court.entity';
import { User } from '../../modules/user/entities/user.entity';
import { OperatingHour } from '../../modules/venue/entities/operating-hour.entity';
import { VenueConfiguration } from '../../modules/venue/entities/venue-configuration.entity';
import dataSource from '../data-source';

dotenv.config();

const seed = async () => {
  console.log('🌱 Starting seed...');

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Seed Users
      console.log('Creating users...');
      const password = 'Password@123!';
      const passwordHash = await argon2.hash(password);

      const users = [
        {
          email: 'admin@example.com',
          fullName: 'System Admin',
          role: Role.ADMIN,
          isVerified: true,
          passwordHash,
        },
        {
          email: 'manager@example.com',
          fullName: 'Venue Manager',
          role: Role.MANAGER,
          isVerified: true,
          passwordHash,
        },
        {
          email: 'user@example.com',
          fullName: 'Regular User',
          role: Role.CUSTOMER,
          isVerified: true,
          passwordHash,
        },
      ];

      for (const userData of users) {
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: userData.email },
        });

        if (!existingUser) {
          const user = queryRunner.manager.create(User, userData);
          await queryRunner.manager.save(user);
          console.log(`Created user: ${userData.email}`);
        } else {
          console.log(`User already exists: ${userData.email}`);
        }
      }

      // 2. Seed Venue Configuration
      console.log('Creating venue configuration...');
      let venueConfig = await queryRunner.manager.findOne(VenueConfiguration, { where: {} });
      if (!venueConfig) {
        venueConfig = queryRunner.manager.create(VenueConfiguration, {
          name: 'Zen8Labs Venue',
          description: 'Premium Sports Complex',
          slotDuration: 30, // 30 minutes
          bookingWindowDays: 7,
          timezone: 'Asia/Hanoi',
        });
        venueConfig = await queryRunner.manager.save(venueConfig);
        console.log('Created venue configuration');

        if (!venueConfig) {
          throw new Error('Failed to create venue configuration');
        }

        // Create default operating hours
        const days = Object.values(DayOfWeek);
        const operatingHours = days.map((day) => ({
          configurationId: venueConfig!.id,
          day: day,
          openTime: '06:00:00',
          closeTime: '22:00:00',
          isClosed: false,
        }));

        await queryRunner.manager.save(OperatingHour, operatingHours);
        console.log('Created operating hours');
      }

      // 3. Seed Courts
      console.log('Creating courts...');
      const courtsData = [
        {
          name: 'Court A - Badminton',
          type: CourtType.BADMINTON,
          pricePerHour: 50000,
          status: CourtStatus.ACTIVE,
        },
        {
          name: 'Court B - Soccer',
          type: CourtType.SOCCER,
          pricePerHour: 200000,
          status: CourtStatus.ACTIVE,
        },
        {
          name: 'Court C - Pickleball',
          type: CourtType.PICKLEBALL,
          pricePerHour: 80000,
          status: CourtStatus.ACTIVE,
        },
      ];

      for (const courtData of courtsData) {
        const existingCourt = await queryRunner.manager.findOne(Court, {
          where: { name: courtData.name },
        });
        if (!existingCourt) {
          const { pricePerHour, ...rest } = courtData;
          const court = queryRunner.manager.create(Court, {
            ...rest,
            description: `${rest.type} court`,
          });
          const savedCourt = await queryRunner.manager.save(court);

          // Create default pricing for court (Global pricing vs Specific pricing)
          // Let's create a specific pricing for this court as default
          const pricing = queryRunner.manager.create(CourtPricing, {
            courtId: savedCourt.id,
            type: savedCourt.type,
            price: pricePerHour / 2, // Price per slot (30 min)
            startTime: '00:00:00',
            endTime: '24:00:00',
            priority: 1,
          });
          await queryRunner.manager.save(pricing);
          console.log(`Created court: ${court.name} with price ${pricing.price}/slot`);
        }
      }

      await queryRunner.commitTransaction();
      console.log('✅ Seed completed successfully!');
    } catch (err) {
      console.error('❌ Seed failed:', err);
      await queryRunner.rollbackTransaction();
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
