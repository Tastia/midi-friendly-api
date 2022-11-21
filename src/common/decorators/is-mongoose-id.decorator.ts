import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { isValidObjectId } from '@shared/utils/db.utils';

/**
 * Is a MongoDB ObjectId
 * @param validationOptions
 * @constructor
 */
export function IsId(validationOptions?: ValidationOptions) {
  if (!validationOptions) {
    validationOptions = {
      message: 'provided value is not a valid MongoDB Object Id',
    };
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          return typeof value === 'string' && isValidObjectId(value);
        },
      },
    });
  };
}
