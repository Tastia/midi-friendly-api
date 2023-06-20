import { PaginatedQuery } from '@chronicstone/mongoose-search';
import { CurrentApp, RequesterApp } from '@common/decorators/app.decorator';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { ActiveUser } from '@common/decorators/user.decorator';
import { RestaurantService } from '@modules/restaurant/restaurant.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Organization } from '@schemas/oraganization.schema';
import { User } from '@schemas/user.schema';
import { CountQuery } from '@shared/dto/count-query.dto';

@ApiTags('Restaurant')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post('/list')
  @JWTAuth()
  @ApiOperation({ summary: 'Find all accounts (paginated)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(
    @Query() { count }: CountQuery,
    @Body(new ValidationPipe({ transform: true })) query: PaginatedQuery,
    @ActiveUser() user: User,
  ) {
    return this.restaurantService.list(query, count);
  }

  @JWTAuth()
  @Get()
  getAllRestaurants() {
    return this.restaurantService.find({}, ['organization']);
  }

  @JWTAuth()
  @Get(':organizationId')
  async getRestaurants(
    @Param('organizationId') organizationId: string,
    @CurrentApp() app: RequesterApp,
  ) {
    return this.restaurantService.find({
      organization: organizationId,
      ...(app === 'client' ? { $or: [{ disabled: false }, { disabled: { $exists: false } }] } : {}),
    });
  }

  @JWTAuth()
  @Post('insert-restaurant-by-place-id/:placeId')
  async insertRestaurantByPlaceId(
    @ActiveOrganization() organization: Organization,
    @Param('placeId') placeId: string,
  ) {
    return this.restaurantService.manuallyInsertRestaurant(organization._id.toString(), placeId);
  }

  @Patch('toggle-restaurant/:restaurantId')
  async toggleRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.toggleRestaurant(restaurantId);
  }

  @Get('test')
  test() {
    return 'test';
  }
}
