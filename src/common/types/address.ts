import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class Address {
  @ApiProperty()
  @Prop()
  street: string;

  @ApiProperty()
  @Prop()
  city: string;

  @ApiProperty()
  @Prop()
  country: string;

  @ApiProperty()
  @Prop()
  zip: string;
}

export class Coordinates {
  @ApiProperty()
  @Prop()
  latitude: number;

  @ApiProperty()
  @Prop()
  longitude: number;
}
