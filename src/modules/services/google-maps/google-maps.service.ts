import { BaseRestaurant } from '@common/types/restaurant';
import { Coordinates } from '@common/types/address';
import { Address } from '@common/types/address';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Client, Place } from '@googlemaps/google-maps-services-js';
import { ExceptionHandler } from 'winston';

@Injectable()
export class GoogleMapsService {
  private readonly GMapsClient = new Client({});

  async getCoordinatesFromAddress(address: Address) {
    Logger.debug(
      `Retriving coordinates for address : ${JSON.stringify(address)}`,
      'GoogleMapsService.getCoordinatesFromAddress',
    );
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
      Logger.error(
        err?.response?.data?.error_message ?? err,
        'GoogleMapsService.getCoordinatesFromAddress',
      );
      throw new BadRequestException(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
      );
    }
  }

  async getAddressFromCoordinates(coordinates: Coordinates): Promise<Address> {
    Logger.debug(
      `Retriving address for coordinates : ${JSON.stringify(coordinates)}`,
      'GoogleMapsService.getAddressFromCoordinates',
    );
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
      Logger.error(
        err?.response?.data?.error_message ?? err,
        'GoogleMapsService.getAddressFromCoordinates',
      );
      throw new BadRequestException(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
      );
    }
  }

  async getRestaurantDetails(placeId: string): Promise<Place> {
    try {
      return this.GMapsClient.placeDetails({
        params: {
          place_id: placeId,
          key: process.env.GOOGLE_MAPS_API_KEY,
          fields: [
            'name',
            'place_id',
            'address_components',
            'geometry',
            'reviews',
            'price_level',
            'photos',
            'opening_hours',
            'website',
            'formatted_phone_number',
          ],
        },
        timeout: 1000,
      }).then((data) => data.data.result);
    } catch (err) {
      Logger.error(
        err?.response?.data?.error_message ?? err,
        'GoogleMapsService.getRestaurantDetails',
      );
      throw new BadRequestException(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
      );
    }
  }

  async mapRestaurantFullData(location: Place): Promise<BaseRestaurant> {
    try {
      const restaurantDetails = await this.getRestaurantDetails(location.place_id);
      return {
        name: restaurantDetails.name,
        placeId: restaurantDetails.place_id,
        address: {
          street: restaurantDetails?.address_components?.[0]?.long_name ?? '',
          city: restaurantDetails?.address_components?.[1]?.long_name ?? '',
          zip: restaurantDetails?.address_components?.[6]?.long_name ?? '',
          country: restaurantDetails?.address_components?.[5]?.long_name ?? '',
        },
        coordinates: {
          latitude: restaurantDetails.geometry.location.lat,
          longitude: restaurantDetails.geometry.location.lng,
        },
        gMapsReviews:
          restaurantDetails.reviews?.map((review) => ({
            authorName: review.author_name,
            authorPhoto: review.profile_photo_url,
            rating: review.rating,
            text: review.text,
            createdAt: review.time,
          })) ?? [],
        priceLevel: restaurantDetails?.price_level ?? 0,
        photos:
          restaurantDetails.photos?.map((photo) => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
          })) ?? [],
        openingHours: restaurantDetails?.opening_hours?.weekday_text ?? [],
        website: restaurantDetails?.website ?? '',
        phoneNumber: restaurantDetails?.formatted_phone_number ?? '',
      };
    } catch (err) {
      Logger.error(
        err?.response?.data?.error_message ?? err,
        'GoogleMapsService.mapRestaurantFullData',
      );
      throw new Error(err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error');
    }
  }

  async getRestaurantsNearby(coordinates: Coordinates): Promise<BaseRestaurant[]> {
    try {
      const locations = await this.GMapsClient.placesNearby({
        params: {
          location: `${coordinates.latitude},${coordinates.longitude}`,
          radius: 500,
          type: 'restaurant',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 1000000,
      }).then((data) => data.data.results);

      const [restaurants] = await this.rateLimitPromiseQueue<BaseRestaurant>(
        locations.map((location) => () => this.mapRestaurantFullData(location)),
        { concurrency: 1, interval: 1000, runsPerInterval: 2 },
      );

      return restaurants;
    } catch (err) {
      Logger.debug(
        err?.response?.data?.error_message ?? err,
        'GoogleMapsService.getRestaurantsNearby',
      );
      throw new BadRequestException(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
      );
    }
  }

  async rateLimitPromiseQueue<T>(
    promises: Array<(options?: { signal?: AbortSignal }) => Promise<T>>,
    options: { concurrency: number; interval: number; runsPerInterval: number },
  ): Promise<[T[], any[]]> {
    return new Promise(async (resolve, reject) => {
      Logger.debug(
        `Rate limiting ${promises.length} promises with concurrency ${options.concurrency} and interval ${options.interval}ms`,
        'GoogleMapsService.rateLimitPromiseQueue',
      );
      try {
        const PQueue = (await import('p-queue')).default;
        const success = [];
        const errors = [];
        const queue = new PQueue({
          concurrency: options.concurrency,
          interval: options.interval,
          intervalCap: options.runsPerInterval,
        });

        queue.on('error', (error) =>
          Logger.error(error, 'GoogleMapsService.rateLimitPromiseQueue'),
        );
        queue.on('completed', (result) => {
          success.push(result);
          Logger.debug(
            `Promise completed, ${queue.size} remaining, ${queue.pending} pending`,
            'GoogleMapsService.rateLimitPromiseQueue',
          );
        });
        queue.on('empty', () => resolve([success, errors]));
        queue.on('error', (error) => errors.push(error));
        queue.addAll(promises);
      } catch (err) {
        reject(err);
      }
    });
  }

  serveImageFromGMapsRef(reference: string, options?: { maxWidth?: number; maxLength?: number }) {
    return this.GMapsClient.placePhoto({
      params: {
        photoreference: reference,
        key: process.env.GOOGLE_MAPS_API_KEY,
        maxwidth: options?.maxWidth ?? 400,
        maxheight: options?.maxLength ?? 400,
      },
      responseType: 'stream',
    });
  }
}
