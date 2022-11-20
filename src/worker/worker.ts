import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';

const errorPrinter = winston.format((info) => {
  if (!info.error) return info;

  // Handle case where Error has no stack.
  const errorMsg = info.error.stack || info.error.toString();
  info.message += `\n${errorMsg}`;

  return info;
});

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(WorkerModule, new FastifyAdapter(), {
    logger: WinstonModule.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        errorPrinter(),
        nestWinstonModuleUtilities.format.nestLike('atc-worker', {
          prettyPrint: true,
        }),
      ),
      transports: [new winston.transports.Console({ stderrLevels: ['error'] })],
    }),
  });

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get('bull.port');
  const host = app.get(ConfigService).get('bull.host');
  console.log(`${host} Port: ${port}`);
  await app.init();
}

// noinspection JSIgnoredPromiseFromCall
bootstrap();
