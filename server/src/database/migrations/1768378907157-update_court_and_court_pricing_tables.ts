import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCourtAndCourtPricingTables1768378907157 implements MigrationInterface {
    name = 'UpdateCourtAndCourtPricingTables1768378907157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "court_pricings" DROP CONSTRAINT "FK_e50f6a58da4824d23c3196ae727"`);
        await queryRunner.query(`ALTER TABLE "court_pricings" ALTER COLUMN "court_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "court_pricings" ADD CONSTRAINT "FK_e50f6a58da4824d23c3196ae727" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "court_pricings" DROP CONSTRAINT "FK_e50f6a58da4824d23c3196ae727"`);
        await queryRunner.query(`ALTER TABLE "court_pricings" ALTER COLUMN "court_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "court_pricings" ADD CONSTRAINT "FK_e50f6a58da4824d23c3196ae727" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
