import { AuthGuard } from '@nestjs/passport';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { SetAdminAccessDto } from './dto/set-admin-access.dto';
import { UserService } from './user.service';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';
import { PaginatedQuery } from '@chronicstone/mongoose-search';
import { User } from '@schemas/user.schema';
import { CountQuery } from '@shared/dto/count-query.dto';
import { AggregatePaginateResult } from 'mongoose';
import { ActiveUser } from '@common/decorators/user.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @JWTAuth()
  @Get()
  getUsers() {
    return this.userService.find({}, ['organizations']);
  }

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
    return this.userService.list(query, count);
  }

  @JWTAuth()
  @Post('set-admin-access')
  setAdminAccess(@Body(ValidationPipe) createUserDto: SetAdminAccessDto) {
    return this.userService.updateOne(
      { _id: createUserDto.userId },
      { admin: createUserDto.allowAccess },
    );
  }

  @Delete(':id')
  deleteUser(@Body('id') userId: string) {
    return this.userService.deleteOne({ _id: userId });
  }
}
