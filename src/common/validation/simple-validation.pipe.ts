import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

type SanitizingDtoClass = {
  sanitize?: (value: unknown) => unknown;
};

@Injectable()
export class SimpleValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' || !metadata.metatype) {
      return value;
    }

    const metatype = metadata.metatype as SanitizingDtoClass;
    if (typeof metatype.sanitize !== 'function') {
      return value;
    }

    try {
      return metatype.sanitize(value);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid request payload');
    }
  }
}
