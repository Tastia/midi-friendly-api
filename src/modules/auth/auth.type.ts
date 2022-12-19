import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AvailableOrganization {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}

export class ActiveAccount {
  @ApiProperty({
    example: '61a4ddc0c3150de171779ee3',
    description: 'Account Id',
  })
  @Type(() => String)
  readonly _id: string;

  @ApiProperty({
    description: 'First name',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
  })
  lastName: string;

  @ApiProperty({
    description: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'avatar',
  })
  avatar: string;

  @ApiProperty({
    description: 'admin access',
  })
  admin?: boolean;
}

export class AccessTokenResponse {
  @ApiProperty({
    description: 'access token',
    example:
      'eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2MWFlNGNmMjkzN2EzNDY4MTNkYmRjNjMiLCJsYXN0TmFtZSI6IkFkbWluIiwiZmlyc3ROYW1lI',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User organizations',
    type: [AvailableOrganization],
  })
  organizations: AvailableOrganization[];

  @ApiProperty({ description: 'Account data', type: ActiveAccount })
  account: ActiveAccount;
}
