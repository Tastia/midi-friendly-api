import { LunchGroupService } from '@modules/lunch-group/lunch-group.service';
import { PaginatedQuery } from '@chronicstone/mongoose-search';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';
import { ActiveUser } from '@common/decorators/user.decorator';
import { Body, Controller, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from '@schemas/user.schema';
import { CountQuery } from '@shared/dto/count-query.dto';

@Controller('lunch-group')
export class LunchGroupController {
  constructor(private readonly lunchGroupService: LunchGroupService) {}

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
    return this.lunchGroupService.list(query, count);
  }
}
