import mongoose, { mongo } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

/**
 * Check if a string is valid mongoose objectId
 * @param id
 */
export function isValidObjectId(id: string): boolean {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return String(new mongoose.Types.ObjectId(id)) === id;
  }
  return false;
}

export function toObjectId({ value, key }): mongoose.Types.ObjectId {
  if (isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  } else {
    throw new BadRequestException(`${key} is not a valid MongoId`);
  }
}
