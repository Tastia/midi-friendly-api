import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-custom';
import { User } from '@schemas/user.schema';
``;
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(request: Request): Promise<User> {
    const { type, email, password, userId } = await request.body;
    if (type === 'email' && (!email || !password)) throw new BadRequestException();
    if (type === 'invitation' && (!email || !userId)) throw new BadRequestException();

    const user = await this.authService.validate({ type, email, password, userId });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
