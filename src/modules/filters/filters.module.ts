import { Module } from '@nestjs/common';
import { FiltersService } from './filters.service';

@Module({
  providers: [FiltersService]
})
export class FiltersModule {}
