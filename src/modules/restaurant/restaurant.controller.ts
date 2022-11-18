import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Restaurant')
@Controller('restaurant')
export class RestaurantController {}
