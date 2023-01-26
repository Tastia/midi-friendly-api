import { S3Service } from './../aws/s3/s3.service';
import { BaseRestaurant } from '@common/types/restaurant';
import { Coordinates } from '@common/types/address';
import { Address } from '@common/types/address';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AddressType, Client, Place, PlacePhoto } from '@googlemaps/google-maps-services-js';
import { rateLimitPromiseQueue } from '@shared/utils/rate-limit-promise-queue';

@Injectable()
export class GoogleMapsService {
  private readonly GMapsClient = new Client({});

  constructor(private readonly s3Service: S3Service) {}

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

  async resolveAndSavePhoto(photo: PlacePhoto, placeId: string) {
    Logger.debug(
      `Retriving photo for placeId : ${placeId} and photo reference : ${photo.photo_reference}`,
      'GoogleMapsService.resolveAndSavePhoto',
    );
    try {
      const filePath = `restaurants/${placeId}/photos/${photo.photo_reference}_${Date.now()}.jpg`;
      const fileBody = await this.resolvePlacePhoto(photo.photo_reference);
      await this.s3Service.uploadImageFromBuffer(fileBody, filePath);

      Logger.debug(
        `Photo for placeId : ${placeId} and photo reference : ${photo.photo_reference} saved`,
        'GoogleMapsService.resolveAndSavePhoto',
      );

      return {
        url: filePath,
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      };
    } catch (err) {
      Logger.error(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS/AWS unknown error',
        'GoogleMapsService.resolveAndSavePhoto',
      );
      throw new BadRequestException(
        err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
      );
    }
  }

  async mapRestaurantFullData(location: Place): Promise<BaseRestaurant> {
    Logger.debug(
      `Retriving full restaurant data for placeId :  ${location.place_id}`,
      'GoogleMapsService.mapRestaurantFullData',
    );
    try {
      const restaurantDetails = await this.getRestaurantDetails(location.place_id);
      const [photos] = await rateLimitPromiseQueue<{
        url: string;
        reference: string;
        width: number;
        height: number;
      }>(
        (restaurantDetails?.photos ?? []).map(
          (photo) => () => this.resolveAndSavePhoto(photo, location.place_id),
        ),
        { concurrency: 1, interval: 1500, runsPerInterval: 10 },
      );
      return {
        name: restaurantDetails.name,
        placeId: restaurantDetails.place_id,
        address: this.formatAddressFromString(restaurantDetails),
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
        photos: photos ?? [],
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
    Logger.debug(
      `Retriving restaurants nearby for coordinates : ${JSON.stringify(coordinates)}`,
      'GoogleMapsService.getRestaurantsNearby',
    );
    try {
      let page = 1;
      let nextToken = '';
      let resolvingComplete = false;
      const locations = [];

      while (!resolvingComplete) {
        try {
          Logger.debug(
            `Retriving page ${page} of restaurants nearby - page token : ${nextToken}`,
            'GoogleMapsService.getRestaurantsNearby',
          );
          if (page > 1) await this.sleep(2500);
          const data = await this.GMapsClient.placesNearby({
            params: {
              location: `${coordinates.latitude},${coordinates.longitude}`,
              radius: 500,
              type: 'restaurant',
              key: process.env.GOOGLE_MAPS_API_KEY,
              ...(nextToken && { pagetoken: nextToken }),
            },
            timeout: 1000000,
          }).then((data) => data.data);

          locations.push(...data.results);
          if (data.next_page_token) nextToken = data.next_page_token;
          else resolvingComplete = true;
          page++;
        } catch (err) {
          nextToken = '';
          resolvingComplete = true;
          Logger.error(
            `Unable to retrive page ${page} of restaurants nearby - page token : ${nextToken}`,
            'GoogleMapsService.getRestaurantsNearby',
          );
          Logger.error(
            err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error',
            'GoogleMapsService.getRestaurantsNearby',
          );
        }
      }

      const [restaurants] = await rateLimitPromiseQueue<BaseRestaurant>(
        locations.map((location) => () => this.mapRestaurantFullData(location)),
        { concurrency: 1, interval: 1500, runsPerInterval: 1 },
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

  async resolvePlacePhoto(reference: string, options?: { maxWidth?: number; maxLength?: number }) {
    try {
      return Buffer.from(
        await this.GMapsClient.placePhoto({
          params: {
            photoreference: reference,
            key: process.env.GOOGLE_MAPS_API_KEY,
            maxwidth: options?.maxWidth ?? 1000,
            maxheight: options?.maxLength ?? 1000,
          },
          responseType: 'arraybuffer',
        }).then((data) => data.data),
      );
    } catch (err) {
      Logger.error(
        err?.response?.data?.error_message ??
          `Unexpected GMAPS unknown error for reference : ${reference}`,
        'GoogleMapsService.getPlacePhotoBuffer',
      );
      throw new Error(err?.response?.data?.error_message ?? 'Unexpected GMAPS unknown error');
    }
  }

  formatAddressFromString(place: Place): Address {
    if (place.adr_address)
      return {
        street: place.adr_address.match(/(?<=<span class="street-address">)(.*?)(?=<\/span>)/g)[0],
        city: place.adr_address.match(/(?<=<span class="locality">)(.*?)(?=<\/span>)/g)[0],
        zip: place.adr_address.match(/(?<=<span class="postal-code">)(.*?)(?=<\/span>)/g)[0],
        country: place.adr_address.match(/(?<=<span class="country-name">)(.*?)(?=<\/span>)/g)[0],
      };
    else if (place.address_components.length)
      return {
        street:
          `${
            place.address_components.find((component) =>
              component.types.includes('street_number' as AddressType),
            )?.long_name
          } ${
            place.address_components.find((component) =>
              component.types.includes('route' as AddressType),
            )?.long_name
          }` || 'N/A',
        city:
          place.address_components.find((component) =>
            component.types.includes('locality' as AddressType),
          )?.long_name ?? 'N/A',
        zip:
          place.address_components.find((component) =>
            component.types.includes('postal_code' as AddressType),
          )?.long_name ?? 'N/A',
        country:
          place.address_components.find((component) =>
            component.types.includes('country' as AddressType),
          )?.long_name ?? 'N/A',
      };
  }

  async getRestaurantData(placeId: string) {
    const placeData = await this.GMapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }).then((data) => data.data.result);

    return this.mapRestaurantFullData(placeData);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
