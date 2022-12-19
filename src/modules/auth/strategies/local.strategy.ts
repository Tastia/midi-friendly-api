import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-custom';
import { User } from '@schemas/user.schema';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(request: Request): Promise<User> {
    if (!request.headers['x-application']) throw new BadRequestException('Application is missing');
    const adminAuth = request.headers['x-application'] === 'admin';
    const { type, email, password, userId } = request.body;
    if (type === 'email' && (!email || !password))
      throw new BadRequestException('Email or password is missing');
    if (type === 'invitation' && (!email || !userId))
      throw new BadRequestException('Email or userId is missing');

    const user = await this.authService.validate({ type, email, password, userId }, adminAuth);
    if (!user) {
      throw new UnauthorizedException('Username, password or provider validation failed');
    }
    return user;
  }
}
