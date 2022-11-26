import { RestaurantService } from '@modules/restaurant/restaurant.service';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Restaurant')
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get(':organizationId')
  async getRestaurants(@Param('organizationId') organizationId: string) {
    return this.restaurantService.find({ organization: organizationId });
  }
}
