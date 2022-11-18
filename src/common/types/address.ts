import { Prop } from '@nestjs/mongoose';

export class Address {
  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  zip: string;
}

export class Coordinates {
  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
}
