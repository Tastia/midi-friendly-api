import { ConfigService } from '@nestjs/config';
import { S3, SES } from 'aws-sdk';
import {
  AsyncModuleProvider,
  AwsService,
  AwsServiceConfigurationOptionsFactory,
  AwsServiceType,
  AwsServiceWithServiceOptions,
} from 'nest-aws-sdk/dist/lib/types';
import awsConfig from '@config/aws.config';

export function awsHandlerConfig(): {
  defaultServiceOptions?: AsyncModuleProvider<AwsServiceConfigurationOptionsFactory>;
  services?: Array<AwsServiceType<AwsService> | AwsServiceWithServiceOptions>;
} {
  const configService = new ConfigService(awsConfig());
  return {
    services: [
      {
        service: SES,
        serviceOptions: {
          region: configService.get<string>('sesRegion'),
          accessKeyId: configService.get<string>('sesAccessKeyId'),
          secretAccessKey: configService.get<string>('sesSecretAccessKey'),
        },
      },
      {
        service: S3,
        serviceOptions: {
          region: configService.get<string>('s3Region'),
          accessKeyId: configService.get<string>('accessKeyId'),
          secretAccessKey: configService.get<string>('secretAccessKey'),
          signatureVersion: 'v4',
        },
      },
    ],
  };
}
