import { BaseRestaurant } from './../../../common/types/restaurant';
import { Coordinates } from './../../../common/types/address';
import { Address } from '@common/types/address';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Client, defaultAxiosInstance } from '@googlemaps/google-maps-services-js';

@Injectable()
export class GoogleMapsService {
  private readonly GMapsClient = new Client({});

  async getCoordinatesFromAddress(address: Address) {
    try {
      const data = await this.GMapsClient.geocode({
        params: {
          address: `${address.street} ${address.city} ${address.zip} ${address.country} `,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000,
      });

      const coordinates = data.data.results?.[0]?.geometry?.location ?? null;
      if (!coordinates) throw new Error('No coordinates found');

      return {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      };
    } catch (err) {
      Logger.debug(err, 'GoogleMapsService.getCoordinatesFromAddress');
      throw new BadRequestException('Invalid address');
    }
  }

  async getAddressFromCoordinates(coordinates: Coordinates): Promise<Address> {
    try {
      const data = await this.GMapsClient.reverseGeocode({
        params: {
          latlng: `${coordinates.latitude},${coordinates.longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000,
      });

      return {
        street: data.data.results?.[0]?.address_components?.[0]?.long_name ?? null,
        city: data.data.results?.[0]?.address_components?.[1]?.long_name ?? null,
        zip: data.data.results?.[0]?.address_components?.[6]?.long_name ?? null,
        country: data.data.results?.[0]?.address_components?.[5]?.long_name ?? null,
      };
    } catch (err) {
      Logger.debug(err, 'GoogleMapsService.getAddressFromCoordinates');
      throw new BadRequestException('Invalid coordinates');
    }
  }

  async getRestaurantsNearby(coordinates: Coordinates): Promise<BaseRestaurant[]> {
    try {
      const data = await this.GMapsClient.placesNearby({
        params: {
          location: `${coordinates.latitude},${coordinates.longitude}`,
          radius: 500,
          type: 'restaurant',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000000,
      });

      return data.data.results.map((restaurant) => ({
        name: restaurant.name,
        placeId: restaurant.place_id,
        coordinates: {
          latitude: restaurant.geometry.location.lat,
          longitude: restaurant.geometry.location.lng,
        },
      }));
    } catch (err) {
      Logger.debug(err, 'GoogleMapsService.getRestaurantsNearby');
      throw new BadRequestException('Invalid coordinates');
    }
  }
}
