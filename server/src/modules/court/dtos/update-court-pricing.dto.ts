import { PartialType } from '@nestjs/swagger';
import { CreateCourtPricingDto } from './create-court-pricing.dto';

export class UpdateCourtPricingDto extends PartialType(CreateCourtPricingDto) {}
