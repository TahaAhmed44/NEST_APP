import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}
  transform(value: any, metadata: ArgumentMetadata) {
    const { success, error } = this.schema.safeParse(value);
    if (!success) {
      throw new BadRequestException({
        message: 'validation Error',
        issues: error.issues.map((issue) => {
          return { path: issue.path, message: issue.message };
        }),
      });
    }
    return value;
  }
}
