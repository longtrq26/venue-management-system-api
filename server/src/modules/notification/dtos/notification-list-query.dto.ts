import { PartialType } from '@nestjs/swagger';
import { ListQueryDto } from 'src/common/dtos/list-query.dto';

export class NotificationListQueryDto extends PartialType(ListQueryDto) {}
