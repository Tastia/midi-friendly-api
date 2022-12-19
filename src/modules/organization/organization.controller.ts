import { Organization } from '@schemas/oraganization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Body, Controller, Get, Param, Post, ValidationPipe } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';

@ApiTags('Organization')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @JWTAuth()
  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiOkResponse({ description: 'Success', type: [Organization] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getOrganizations() {
    return this.organizationService.find();
  }

  @JWTAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiOkResponse({ description: 'Success', type: Organization })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getOrganizationById(@Param('id') organizationId: string) {
    return this.organizationService.findOne({ _id: organizationId }, [{ path: 'restaurants' }]);
  }

  @JWTAuth()
  @Post()
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiOkResponse({ description: 'Success', type: Organization })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createOrganization(
    @Body(new ValidationPipe({ transform: true })) organizationDto: CreateOrganizationDto,
  ) {
    return this.organizationService.create(organizationDto);
  }
}
