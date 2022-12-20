import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { json } from 'express';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';

import {
  AsyncApiDocumentBuilder,
  AsyncApiModule,
  AsyncApiService,
  AsyncServerObject,
} from 'nestjs-asyncapi';

const errorPrinter = winston.format((info) => {
  if (!info.error) return info;
  const errorMsg = info.error.stack || info.error.toString();
  info.message += `\n${errorMsg}`;
  return info;
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        errorPrinter(),
        nestWinstonModuleUtilities.format.nestLike('midi-friendly-api', {
          prettyPrint: true,
        }),
      ),
      transports: [
        new winston.transports.Console({ stderrLevels: ['error'] }),
        ...(process.env.NODE_ENV === 'production'
          ? [
              new WinstonCloudWatch({
                logGroupName: process.env.AWS_CLOUDWATCH_API_GROUP_NAME,
                logStreamName: `${process.env.AWS_CLOUDWATCH_API_GROUP_NAME}-${process.env.NODE_ENV}`,
                awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
                awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
                awsRegion: process.env.AWS_CLOUDWATCH_REGION,
                messageFormatter: function (item) {
                  return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta);
                },
              }),
            ]
          : []),
      ],
    }),
  });

  app.use(json({ limit: '50mb' }));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('MIDI FRIENDLY API')
    .setDescription('Midi friendly API documentation')
    .setVersion('0.0.1')
    .addTag('MIDI-FRIENDLY')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  SwaggerModule.setup('api-docs', app, document);

  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle('Midi friendly gateways API')
    .setDescription('WebSocket Gatways docs for Midi friendly services')
    .setVersion('0.1.0')
    .setDefaultContentType('application/json')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addServer('midi-friendly-server', {
      url: 'http://localhost:8080', //`http://localhost:${app.get(ConfigService).get('app.port')}/`,
      protocol: 'socket.io',
      protocolVersion: '4',
      description: 'Allows you to connect using the websocket protocol to our Socket.io server.',
      variables: {
        port: {
          description: `Secure connection (TLS) is available through port ${app
            .get(ConfigService)
            .get('app.port')}.`,
          default: `${app.get(ConfigService).get('app.port')}`,
        },
      },
      bindings: {},
    })
    .build();

  const asyncapiDocument = await AsyncApiModule.createDocument(app, asyncApiOptions);
  await AsyncApiModule.setup('websocket-docs', app, asyncapiDocument);

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    },
  });

  app.enableCors();
  const port = app.get(ConfigService).get('app.port');

  await app.listen(port);
}

// noinspection JSIgnoredPromiseFromCall
bootstrap();
