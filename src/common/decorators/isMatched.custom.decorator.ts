import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'check_MongoID', async: false })
export class MongoDBIds implements ValidatorConstraintInterface {
  validate(ids: Types.ObjectId[], args: ValidationArguments) {
    for (const id of ids) {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }
    }
    return true;
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'In-valid mongoDBId format';
  }
}

@ValidatorConstraint({ name: 'check_matching_between_fields', async: false })
export class IsMatchedMethod<T = any> implements ValidatorConstraintInterface {
  validate(value: T, args: ValidationArguments) {
    // console.log({ value, args, con: args.object[args.constraints[0]] });
    return value === args.object[args.constraints[0]];
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'fields not matched';
  }
}

export function IsMatched<T = any>(
  constraints: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: IsMatchedMethod<T>,
    });
  };
}
