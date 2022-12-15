import { RestaurantService } from '@modules/restaurant/restaurant.service';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Restaurant')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  getAllRestaurants() {
    return this.restaurantService.find();
  }

  @Get(':organizationId')
  async getRestaurants(@Param('organizationId') organizationId: string) {
    return this.restaurantService.find({ organization: organizationId });
  }
}
