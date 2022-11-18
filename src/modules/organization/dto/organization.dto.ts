import { Address } from '@common/types/address';
import { IsObject, IsString } from 'class-validator';

export class OrganizationDto {
  @IsString()
  name: string;

  @IsObject()
  address: Address;
}
