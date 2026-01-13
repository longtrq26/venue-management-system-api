import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCoreDomainSchema1768327573284 implements MigrationInterface {
    name = 'InitCoreDomainSchema1768327573284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."operating_hours_day_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TABLE "operating_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "configuration_id" uuid NOT NULL, "day" "public"."operating_hours_day_enum" NOT NULL, "open_time" TIME NOT NULL DEFAULT '06:00:00', "close_time" TIME NOT NULL DEFAULT '22:00:00', "is_closed" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_6713d014e2b0a44ba2787d2d16b" UNIQUE ("configuration_id", "day"), CONSTRAINT "PK_2ada48e2269e8c902ec3f00439e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8b5f0def6fafe8ef50c220706d" ON "operating_hours" ("configuration_id") `);
        await queryRunner.query(`CREATE TABLE "venue_configurations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL DEFAULT 'Venue Management System', "description" text, "slot_duration" integer NOT NULL DEFAULT '30', "booking_window_days" integer NOT NULL DEFAULT '7', "timezone" character varying NOT NULL DEFAULT 'Asia/Hanoi', CONSTRAINT "PK_e285a3e34abfa0adb00d584cf3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'MANAGER', 'CUSTOMER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "phone_number" character varying(20), "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER', "is_verified" boolean NOT NULL DEFAULT false, "verification_token" character varying(255), "verification_token_expiry" TIMESTAMP WITH TIME ZONE, "refresh_token_hash" character varying, "refresh_token_expiry" TIMESTAMP WITH TIME ZONE, "pending_email" character varying, "email_change_token" character varying(255), "email_change_token_expiry" TIMESTAMP WITH TIME ZONE, "password_reset_token" character varying(255), "password_reset_token_expiry" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_17d1817f241f10a3dbafb169fd" ON "users" ("phone_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_981f4b052442ff079fc3c0d0ac" ON "users" ("is_verified") `);
        await queryRunner.query(`CREATE TYPE "public"."court_pricings_type_enum" AS ENUM('SOCCER', 'BADMINTON', 'TENNIS', 'PICKLEBALL')`);
        await queryRunner.query(`CREATE TABLE "court_pricings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "type" "public"."court_pricings_type_enum" NOT NULL, "court_id" uuid NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "price" numeric(12,0) NOT NULL, "priority" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_98905a1303a801da6a1e273a956" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8294de1cbd807778f61580cdbe" ON "court_pricings" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e50f6a58da4824d23c3196ae72" ON "court_pricings" ("court_id") `);
        await queryRunner.query(`CREATE TYPE "public"."courts_type_enum" AS ENUM('SOCCER', 'BADMINTON', 'TENNIS', 'PICKLEBALL')`);
        await queryRunner.query(`CREATE TYPE "public"."courts_status_enum" AS ENUM('ACTIVE', 'MAINTENANCE', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "courts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "type" "public"."courts_type_enum" NOT NULL, "status" "public"."courts_status_enum" NOT NULL DEFAULT 'ACTIVE', "description" text, "version" integer NOT NULL, CONSTRAINT "PK_948a5d356c3083f3237ecbf9897" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1bc883c46e4fd768776c429faf" ON "courts" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_0a4c49faf2514111cc777f193d" ON "courts" ("type") `);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_paymentstatus_enum" AS ENUM('PENDING', 'PARTIAL_PAID', 'PAID', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "court_id" uuid NOT NULL, "user_id" uuid NOT NULL, "group_id" uuid, "booking_date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "price" numeric(12,0) NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'PENDING', "paymentStatus" "public"."bookings_paymentstatus_enum" NOT NULL DEFAULT 'PENDING', CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2bd7e9c03db9f51a4765974abb" ON "bookings" ("court_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_64cd97487c5c42806458ab5520" ON "bookings" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce19ce6def2fbb0922c5da0fab" ON "bookings" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b43f68def0b753efccd9aa68c" ON "bookings" ("booking_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_0012aa4109fa85fcc043e36016" ON "bookings" ("start_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_f52fd18f810c7eccf4652cf89e" ON "bookings" ("end_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_48b267d894e32a25ebde4b207a" ON "bookings" ("status") `);
        await queryRunner.query(`CREATE TABLE "booking_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "totalAmount" numeric(12,0) NOT NULL DEFAULT '0', "is_recurring" boolean NOT NULL DEFAULT false, "note" text, CONSTRAINT "PK_aa835074e17c1686760fc14d4f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ea4431f81822132f8d7992fbdd" ON "booking_groups" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'PARTIAL_PAID', 'PAID', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "order_code" bigint NOT NULL, "amount" numeric(12,0) NOT NULL, "description" text, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "booking_group_id" uuid, "user_id" uuid NOT NULL, "checkout_url" text, "payment_link_id" text, "reference_id" text, "paid_at" TIMESTAMP, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_87606cc142b1a15c00445b647f" ON "payments" ("order_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_44fabca5180333c977f11e59aa" ON "payments" ("booking_group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_427785468fb7d2733f59e7d7d3" ON "payments" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM', 'ACCOUNT_VERIFIED', 'BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'SYSTEM', "is_read" boolean NOT NULL DEFAULT false, "metadata" jsonb, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f12148ce379462ebbb4d06cc13" ON "notifications" ("is_read") `);
        await queryRunner.query(`ALTER TABLE "operating_hours" ADD CONSTRAINT "FK_8b5f0def6fafe8ef50c220706da" FOREIGN KEY ("configuration_id") REFERENCES "venue_configurations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "court_pricings" ADD CONSTRAINT "FK_e50f6a58da4824d23c3196ae727" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_2bd7e9c03db9f51a4765974abb8" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_ce19ce6def2fbb0922c5da0fabf" FOREIGN KEY ("group_id") REFERENCES "booking_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_groups" ADD CONSTRAINT "FK_ea4431f81822132f8d7992fbdd4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_44fabca5180333c977f11e59aae" FOREIGN KEY ("booking_group_id") REFERENCES "booking_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_44fabca5180333c977f11e59aae"`);
        await queryRunner.query(`ALTER TABLE "booking_groups" DROP CONSTRAINT "FK_ea4431f81822132f8d7992fbdd4"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_ce19ce6def2fbb0922c5da0fabf"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_2bd7e9c03db9f51a4765974abb8"`);
        await queryRunner.query(`ALTER TABLE "court_pricings" DROP CONSTRAINT "FK_e50f6a58da4824d23c3196ae727"`);
        await queryRunner.query(`ALTER TABLE "operating_hours" DROP CONSTRAINT "FK_8b5f0def6fafe8ef50c220706da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f12148ce379462ebbb4d06cc13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_427785468fb7d2733f59e7d7d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44fabca5180333c977f11e59aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87606cc142b1a15c00445b647f"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea4431f81822132f8d7992fbdd"`);
        await queryRunner.query(`DROP TABLE "booking_groups"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48b267d894e32a25ebde4b207a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f52fd18f810c7eccf4652cf89e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0012aa4109fa85fcc043e36016"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b43f68def0b753efccd9aa68c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce19ce6def2fbb0922c5da0fab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64cd97487c5c42806458ab5520"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2bd7e9c03db9f51a4765974abb"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_paymentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a4c49faf2514111cc777f193d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1bc883c46e4fd768776c429faf"`);
        await queryRunner.query(`DROP TABLE "courts"`);
        await queryRunner.query(`DROP TYPE "public"."courts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."courts_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e50f6a58da4824d23c3196ae72"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8294de1cbd807778f61580cdbe"`);
        await queryRunner.query(`DROP TABLE "court_pricings"`);
        await queryRunner.query(`DROP TYPE "public"."court_pricings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_981f4b052442ff079fc3c0d0ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17d1817f241f10a3dbafb169fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "venue_configurations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b5f0def6fafe8ef50c220706d"`);
        await queryRunner.query(`DROP TABLE "operating_hours"`);
        await queryRunner.query(`DROP TYPE "public"."operating_hours_day_enum"`);
    }

}
