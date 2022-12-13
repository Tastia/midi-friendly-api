import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.API_PORT, 10) || 3000,
  url: process.env.API_URL,
  secret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
  accessTokenExpiration: process.env.JWT_TOKEN_EXPIRATION,
  invitationTokenExpiration: process.env.JWT_INVITATION_EXPIRATION,
  env: process.env.APP_ENV,
  database: {
    url: process.env.DATABASE_URL,
  },
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT, 10) || 8080,
  },
  appUrls: {
    client: process.env.CLIENT_APP_URL,
    admin: process.env.ADMIN_APP_URL,
  },
}));
