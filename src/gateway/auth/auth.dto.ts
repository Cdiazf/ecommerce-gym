import { ensureRecord, readString } from '../../common/validation/value-parsers';
import {
  IsString,
  MaxLength,
  MinLength,
} from '../../common/validation/decorators';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  static sanitize(value: unknown): LoginDto {
    const input = ensureRecord(value);

    return {
      username: readString(input, 'username', {
        required: true,
        minLength: 3,
        maxLength: 64,
        lowercase: true,
      }) as string,
      password: readString(input, 'password', {
        required: true,
        minLength: 6,
        maxLength: 128,
      }) as string,
    };
  }
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  static sanitize(value: unknown): RegisterDto {
    const input = ensureRecord(value);

    return {
      username: readString(input, 'username', {
        required: true,
        minLength: 3,
        maxLength: 64,
        lowercase: true,
      }) as string,
      password: readString(input, 'password', {
        required: true,
        minLength: 6,
        maxLength: 128,
      }) as string,
    };
  }
}
