import { JWTAuth } from '@common/decorators/jwt-auth.decorator';
import { FiltersService } from './filters.service';
import { Controller, Get } from '@nestjs/common';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { Organization } from '@schemas/oraganization.schema';

@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @JWTAuth()
  @Get('organizations')
  getOrganizations() {
    return this.filtersService.getOrganizations();
  }

  @JWTAuth()
  @Get('restaurants')
  getRestaurants(@ActiveOrganization() organization?: Organization) {
    return this.filtersService.getRestaurants(organization);
  }
}
