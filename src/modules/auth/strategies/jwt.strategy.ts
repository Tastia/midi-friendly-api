import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User, UserDocument } from '@schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.secret'),
    });
  }

  async validate(payload: any): Promise<User> {
    // pending - one time
    if (
      payload?.action &&
      payload?.status &&
      payload?.email &&
      ((payload.action === 'create' && payload.status === 'pending') ||
        (payload.action === 'confirm' && payload.status === 'active') ||
        payload.action === 'reset')
    )
      return payload;

    // default - account
    return this.userModel.findOne({ _id: payload._id });
  }
}
