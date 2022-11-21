import { Transform } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class GetPlacePhotoDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxWidth?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxHeight?: number;
}
