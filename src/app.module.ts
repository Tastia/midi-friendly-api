import awsConfig from '@config/aws.config';
import { LunchGroupModule } from '@modules/lunch-group/lunch-group.module';
import appConfig from '@config/app.config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '@modules/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './modules/services/services.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { FiltersModule } from './modules/filters/filters.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { HttpLoggerMiddleware } from '@common/middlewares/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, awsConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.database.url'),
        useNewUrlParser: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    LunchGroupModule,
    ServicesModule,
    AuthModule,
    MailerModule,
    FiltersModule,
    InvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
