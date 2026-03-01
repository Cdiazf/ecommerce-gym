import { BadRequestException } from '@nestjs/common';

export type ValidationRecord = Record<string, unknown>;

export function ensureRecord(value: unknown, label = 'request body'): ValidationRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${label} must be an object`);
  }

  return value as ValidationRecord;
}

export function readString(
  source: ValidationRecord,
  key: string,
  options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    lowercase?: boolean;
  },
): string | undefined {
  const value = source[key];

  if (value == null) {
    if (options?.required) {
      throw new BadRequestException(`${key} is required`);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${key} must be a string`);
  }

  const trimmed = value.trim();
  if (options?.required && !trimmed) {
    throw new BadRequestException(`${key} is required`);
  }
  if (options?.minLength && trimmed.length < options.minLength) {
    throw new BadRequestException(
      `${key} must be at least ${options.minLength} characters`,
    );
  }
  if (options?.maxLength && trimmed.length > options.maxLength) {
    throw new BadRequestException(
      `${key} must be at most ${options.maxLength} characters`,
    );
  }

  return options?.lowercase ? trimmed.toLowerCase() : trimmed;
}

export function readNumber(
  source: ValidationRecord,
  key: string,
  options?: {
    required?: boolean;
    integer?: boolean;
    min?: number;
  },
): number | undefined {
  const value = source[key];

  if (value == null) {
    if (options?.required) {
      throw new BadRequestException(`${key} is required`);
    }
    return undefined;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BadRequestException(`${key} must be a number`);
  }

  if (options?.integer && !Number.isInteger(value)) {
    throw new BadRequestException(`${key} must be an integer`);
  }

  if (options?.min != null && value < options.min) {
    throw new BadRequestException(`${key} must be >= ${options.min}`);
  }

  return value;
}

export function readBoolean(
  source: ValidationRecord,
  key: string,
): boolean | undefined {
  const value = source[key];

  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${key} must be a boolean`);
  }

  return value;
}
