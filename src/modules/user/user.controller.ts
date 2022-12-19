import { AuthGuard } from '@nestjs/passport';
import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { SetAdminAccessDto } from './dto/set-admin-access.dto';
import { UserService } from './user.service';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @JWTAuth()
  @Get()
  getUsers() {
    return this.userService.find({}, ['organizations']);
  }

  @JWTAuth()
  @Post('set-admin-access')
  setAdminAccess(@Body(ValidationPipe) createUserDto: SetAdminAccessDto) {
    return this.userService.updateOne(
      { _id: createUserDto.userId },
      { admin: createUserDto.allowAccess },
    );
  }
}
