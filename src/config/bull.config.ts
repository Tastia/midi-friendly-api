import { registerAs } from '@nestjs/config';

export default registerAs('bull', () => ({
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || '0.0.0.0',
  url: process.env.REDIS_URL || 'redis:6379',
}));
