import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

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
