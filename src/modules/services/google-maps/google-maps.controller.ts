import { GoogleMapsService } from './google-maps.service';
import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('services/google-maps')
@ApiTags('Google Maps')
export class GoogleMapsController {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get('resolve-place-photo/:photoReference')
  resolvePlacePhoto(
    @Param('photoReference') photoReference: string,
    @Query(new ValidationPipe({ transform: true }))
    options: { maxWidth?: number; maxHeight?: number },
  ) {
    return this.googleMapsService.serveImageFromGMapsRef(photoReference, options);
  }

  @Get('place-date/:placeId')
  getPlaceDate(@Param('placeId') placeId: string) {
    return this.googleMapsService.getRestaurantData(placeId);
  }
}
