import { registerAs } from '@nestjs/config';

export default registerAs('worker', () => ({
  skipTemplates: true,
  port: parseInt(process.env.WORKER_PORT, 10) || 3000,
  url: process.env.WORKER_URL,
  env: process.env.APP_ENV,
  containerIndex: parseInt(process.env.NOMAD_ALLOC_INDEX, 10) || 0,
  database: {
    url: process.env.DATABASE_URL,
  },
}));
