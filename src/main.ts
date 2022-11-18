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
      transports: [new winston.transports.Console({ stderrLevels: ['error'] })],
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
  SwaggerModule.setup('api', app, document);

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
