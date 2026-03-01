import { ValidationPipe } from '@nestjs/common';
import { SimpleValidationPipe } from './simple-validation.pipe';

function hasValidationPackages(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    require.resolve('class-validator');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    require.resolve('class-transformer');
    return true;
  } catch {
    return false;
  }
}

export function createGlobalValidationPipe(): ValidationPipe | SimpleValidationPipe {
  if (hasValidationPackages()) {
    return new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: false,
      },
    });
  }

  return new SimpleValidationPipe();
}
