import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';
import { LunchGroupModule } from '@modules/lunch-group/lunch-group.module';
import { QueueModule } from '@modules/services/queue/queue.module';
import { Invitation, InvitationSchema } from '@schemas/invitation.schema';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user.schema';
import { BullModule } from '@nestjs/bull';
import { Queues } from '@common/types/queue.type';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.secret'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Invitation.name, schema: InvitationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    QueueModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtStrategy, LocalStrategy],
})
export class AuthModule {}
