import { OrganizationSchema, Organization } from '@schemas/oraganization.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersController } from './filters.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }])],
  providers: [FiltersService],
  controllers: [FiltersController],
})
export class FiltersModule {}
