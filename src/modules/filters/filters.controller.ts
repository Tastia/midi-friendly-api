import { FiltersService } from './filters.service';
import { Controller, Get } from '@nestjs/common';

@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('organizations')
  getOrganizations() {
    return this.filtersService.getOrganizations();
  }
}
