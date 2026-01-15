import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CourtType } from 'src/common/enums/court-type.enum';
import { VenueService } from 'src/modules/venue/services/venue.service';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Brackets, Repository } from 'typeorm';
import { CreateCourtPricingDto } from '../dtos/create-court-pricing.dto';
import { UpdateCourtPricingDto } from '../dtos/update-court-pricing.dto';
import { CourtPricing } from '../entities/court-pricing.entity';

@Injectable()
export class CourtPricingService {
  private readonly CONTEXT = CourtPricingService.name;

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(CourtPricing)
    private readonly courtPricingRepository: Repository<CourtPricing>,

    private readonly venueService: VenueService,
  ) {
    this.logger.log('CourtPricingService initialized with dependencies', this.CONTEXT);
  }

  async createCourtPricing(dto: CreateCourtPricingDto) {
    try {
      this.logger.debug(
        `Creating court pricing rule - Type: ${dto.type}, Time: ${dto.startTime}-${dto.endTime}, Priority: ${dto.priority}`,
        this.CONTEXT,
      );

      // validate time range
      if (dto.startTime >= dto.endTime) {
        this.logger.warn(
          `Invalid time range for court pricing: ${dto.startTime} >= ${dto.endTime}`,
          this.CONTEXT,
        );
        throw new BadRequestException('Start time must be before end time');
      }

      // validate time alignment with slot duration (e.g. 08:00 is valid and 08:15 is invalid if slot duration is 30 minutes)
      await this.validateTimeAlignment(dto.startTime, dto.endTime);

      // validate overlap
      const hasOverlap = await this.checkRuleOverlapping(dto);
      if (hasOverlap) {
        this.logger.warn(
          `Pricing rule overlap detected for type ${dto.type}, time ${dto.startTime}-${dto.endTime}, priority ${dto.priority}`,
          this.CONTEXT,
        );
        throw new ConflictException('Time slot overlaps with another rule of the same priority');
      }

      // create and save
      const pricingRule = this.courtPricingRepository.create(dto);
      const savedRule = await this.courtPricingRepository.save(pricingRule);

      this.logger.log(
        `Court pricing rule created - ID: ${savedRule.id}, Type: ${dto.type}, Price: ${dto.price}`,
        this.CONTEXT,
      );

      return savedRule;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to create court pricing rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async getPricingRules(type: CourtType, courtId?: string) {
    try {
      const query = this.courtPricingRepository
        .createQueryBuilder('rule')
        .where('rule.type = :type', { type })
        .orderBy('rule.priority', 'DESC');

      if (courtId) {
        // Fetch global rules (courtId is null) OR specific rules for this court
        query.andWhere(
          new Brackets((qb) => {
            qb.where('rule.courtId = :courtId', { courtId }).orWhere('rule.courtId IS NULL');
          }),
        );
      } else {
        query.andWhere('rule.courtId IS NULL');
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to fetch pricing rules for type ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  calculatePriceFromRules(rules: CourtPricing[], slotStart: string): number {
    // 🛠️ FIX: Chuẩn hóa format thời gian về HH:mm trước khi so sánh
    // Database lưu startTime/endTime dạng 'HH:mm:ss', nhưng input có thể là 'HH:mm'
    const normalizeTime = (timeStr: string): string => {
      // Nếu có seconds (HH:mm:ss), chỉ lấy HH:mm
      return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
    };

    const normalizedSlotStart = normalizeTime(slotStart);

    this.logger.debug(
      `Calculating price for slot ${slotStart} (normalized: ${normalizedSlotStart}) with ${rules.length} rules`,
      this.CONTEXT,
    );

    // Rules are already sorted by priority DESC from DB
    // Find the first rule that matches the time slot
    const matchedRule = rules.find((rule) => {
      const normalizedStart = normalizeTime(rule.startTime);
      const normalizedEnd = normalizeTime(rule.endTime);

      const matches = normalizedStart <= normalizedSlotStart && normalizedEnd > normalizedSlotStart;

      this.logger.debug(
        `Checking rule ${rule.id}: ${normalizedStart}-${normalizedEnd}, priority ${rule.priority}, price ${rule.price} -> matches: ${matches}`,
        this.CONTEXT,
      );

      return matches;
    });

    const finalPrice = Number(matchedRule?.price) || 0;
    this.logger.debug(
      `Final price for slot ${slotStart}: ${finalPrice} (from rule ${matchedRule?.id || 'none'})`,
      this.CONTEXT,
    );

    return finalPrice;
  }

  async calculatePrice(type: CourtType, slotStart: string, courtId?: string): Promise<number> {
    try {
      // Optimized: Fetch all potentially matching rules once, then filter in memory
      // However, for single calculation, the previous method was fine.
      // But consistent strategy is better.
      // Let's keep original logic for single call if needed, OR redirect to new logic.
      // Redirecting might actually be slower for single call due to fetching ALL rules.
      // But rules count is usually small (< 50).

      const rules = await this.getPricingRules(type, courtId);
      return this.calculatePriceFromRules(rules, slotStart);
    } catch (error) {
      this.logger.error(
        `Failed to calculate price for court type ${type} at ${slotStart}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async updateCourtPricing(id: string, dto: UpdateCourtPricingDto) {
    try {
      this.logger.debug(
        `Updating court pricing rule ${id} with fields: ${Object.keys(dto).join(', ')}`,
        this.CONTEXT,
      );

      const pricing = await this.courtPricingRepository.findOne({ where: { id } });
      if (!pricing) {
        this.logger.warn(`Court pricing rule not found: ${id}`, this.CONTEXT);
        throw new NotFoundException('Pricing rule not found');
      }

      const isChanged = Object.keys(dto).some((key) => {
        if (dto[key] === undefined) return false;

        if (typeof dto[key] === 'number') {
          return dto[key] != pricing[key];
        }

        return dto[key] !== pricing[key];
      });

      if (!isChanged) {
        this.logger.debug(`No changes detected for rule ${id}, skipping update`, this.CONTEXT);
        return pricing;
      }

      this.logger.debug(
        `Updating court pricing rule ${id} with fields: ${Object.keys(dto).join(', ')}`,
        this.CONTEXT,
      );

      // merge dto with existing pricing to perform validation
      const type = dto.type || pricing.type;
      const startTime = dto.startTime || pricing.startTime;
      const endTime = dto.endTime || pricing.endTime;
      const priority = dto.priority !== undefined ? dto.priority : pricing.priority;
      const courtId = dto.courtId !== undefined ? dto.courtId : pricing.courtId;

      // validate time range
      if (startTime >= endTime) {
        this.logger.warn(
          `Invalid time range in update: ${startTime} >= ${endTime} for rule ${id}`,
          this.CONTEXT,
        );
        throw new BadRequestException('Start time must be before end time');
      }

      // validate time alignment
      if (dto.startTime || dto.endTime) {
        await this.validateTimeAlignment(startTime, endTime);
      }

      // check for overlap
      const hasOverlap = await this.checkRuleOverlapping(
        { type, startTime, endTime, priority, courtId },
        id,
      );
      if (hasOverlap) {
        this.logger.warn(
          `Pricing rule overlap detected during update for rule ${id}, type ${type}, time ${startTime}-${endTime}`,
          this.CONTEXT,
        );
        throw new ConflictException(
          'Update failed: New time slot overlaps with another rule of the same priority',
        );
      }

      // update pricing
      Object.assign(pricing, dto);
      const updatedRule = await this.courtPricingRepository.save(pricing);

      this.logger.log(
        `Court pricing rule updated - ID: ${id}, Type: ${type}, Price: ${updatedRule.price}`,
        this.CONTEXT,
      );

      return updatedRule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update court pricing rule ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async deleteCourtPricing(id: string) {
    try {
      const courtPricing = await this.courtPricingRepository.findOneBy({ id });
      if (!courtPricing) {
        this.logger.warn(`Court pricing rule not found for deletion: ${id}`, this.CONTEXT);
        throw new NotFoundException('Court pricing rule not found');
      }

      await this.courtPricingRepository.softDelete(id);

      this.logger.log(
        `Court pricing rule soft-deleted - ID: ${id}, Type: ${courtPricing.type}, Price: ${courtPricing.price}`,
        this.CONTEXT,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to soft-delete court pricing rule ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  async restoreCourtPricing(id: string) {
    try {
      const courtPricing = await this.courtPricingRepository.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!courtPricing) {
        this.logger.warn(`Court pricing rule not found for restoration: ${id}`, this.CONTEXT);
        throw new NotFoundException('Court pricing rule not found');
      }

      await this.courtPricingRepository.restore(id);

      this.logger.log(
        `Court pricing rule restored - ID: ${id}, Type: ${courtPricing.type}, Price: ${courtPricing.price}`,
        this.CONTEXT,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to restore court pricing rule ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  private async checkRuleOverlapping(
    params: {
      type: CourtType;
      startTime: string;
      endTime: string;
      priority?: number;
      courtId?: string | null;
    },
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const query = this.courtPricingRepository
        .createQueryBuilder('rule')
        // so sánh với cùng type
        .where('rule.type = :type', { type: params.type })
        // so sánh với cùng priority (nếu không truyền priority thì so sánh với priority = 1)
        .andWhere('rule.priority = :priority', { priority: params.priority || 1 });

      // Nếu có courtId thì check theo courtId, ngược lại check global (courtId is null)
      if (params.courtId) {
        query.andWhere('rule.courtId = :courtId', { courtId: params.courtId });
      } else {
        query.andWhere('rule.courtId IS NULL');
      }

      // (startA - endA) trùng (startB - endB) khi startA < endB và endA > startB
      query
        .andWhere('rule.startTime < :endTime', { endTime: params.endTime })
        .andWhere('rule.endTime > :startTime', { startTime: params.startTime });

      // nếu đang update thì loại chính rule đang sửa ra để tránh tự báo trùng với chính mình
      if (excludeId) {
        query.andWhere('rule.id != :excludeId', { excludeId });
      }

      const overlap = await query.getOne();

      // chuyển đổi kết quả thành boolean (true nếu có trùng nhau, false nếu không trùng nhau)
      const hasOverlap = !!overlap;

      if (hasOverlap) {
        this.logger.debug(
          `Pricing rule overlap found for type ${params.type}, time ${params.startTime}-${params.endTime}, priority ${params.priority}`,
          this.CONTEXT,
        );
      }

      return hasOverlap;
    } catch (error) {
      this.logger.error(
        `Error checking pricing rule overlap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }

  private async validateTimeAlignment(startTime: string, endTime: string) {
    try {
      // lấy slot duration từ venue config
      const config = await this.venueService.getVenueConfig();
      const slotDuration = config?.slotDuration || 30;

      // chuyển đổi giờ từ "HH:mm" thành phút (e.g. "14:30" -> 14 * 60 + 30 = 870)
      const toMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const startMinutes = toMinutes(startTime);
      const endMinutes = toMinutes(endTime);

      // nếu tổng số phút chia hết cho slotDuration (dư 0) thì hợp lệ
      // kiểm tra giờ bắt đầu
      if (startMinutes % slotDuration !== 0) {
        this.logger.warn(
          `Start time ${startTime} (${startMinutes}min) not aligned with slot duration ${slotDuration}min`,
          this.CONTEXT,
        );
        throw new BadRequestException(
          `Start time (${startTime}) does not align with the slot duration configuration (${slotDuration} minutes).`,
        );
      }

      // kiểm tra giờ kết thúc
      if (endMinutes % slotDuration !== 0) {
        this.logger.warn(
          `End time ${endTime} (${endMinutes}min) not aligned with slot duration ${slotDuration}min`,
          this.CONTEXT,
        );
        throw new BadRequestException(
          `End time (${endTime}) does not align with the slot duration configuration (${slotDuration} minutes).`,
        );
      }

      this.logger.debug(
        `Time alignment validated: ${startTime}-${endTime} with slot duration ${slotDuration}min`,
        this.CONTEXT,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error validating time alignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
