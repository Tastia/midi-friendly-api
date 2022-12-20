import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

  sesRegion: process.env.AWS_SES_REGION,
  sesAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  sesSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sesSourceEmail: process.env.AWS_SES_SOURCE_EMAIL,

  apiVersion: process.env.AWS_API_VERSION,
  s3Region: process.env.AWS_S3_REGION,
  s3Bucket: process.env.AWS_S3_BUCKET,
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
}));
