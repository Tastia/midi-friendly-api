import { Coordinates } from './address';

export interface BaseRestaurant {
  name: string;
  placeId: string;
  coordinates: Coordinates;
}
