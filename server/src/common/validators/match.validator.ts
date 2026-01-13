import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'Match', async: false })
export class Match implements ValidatorConstraintInterface {
  validate(value: unknown, validationArguments: ValidationArguments): Promise<boolean> | boolean {
    // extract the related property name from the constraints
    const [relatedPropertyName] = validationArguments.constraints as [string];

    // access object instance
    const object = validationArguments.object as Record<string, unknown>;

    // get related property value
    const relatedValue = object[relatedPropertyName];

    // compare values
    return value === relatedValue;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    // extract the related property name from the constraints
    const [relatedPropertyName] = validationArguments.constraints as [string];

    // return the default message
    return `${relatedPropertyName} does not match ${validationArguments.property}`;
  }
}
