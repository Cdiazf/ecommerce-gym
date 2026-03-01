import { BadRequestException } from '@nestjs/common';
import {
  ensureRecord,
  readBoolean,
  readNumber,
  readString,
} from '../common/validation/value-parsers';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Type,
  ValidateNested,
} from '../common/validation/decorators';

export class CreateOrderItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  static fromUnknown(value: unknown): CreateOrderItemDto {
    const input = ensureRecord(value, 'order item');

    return {
      productId: readString(input, 'productId', {
        required: true,
        minLength: 1,
        maxLength: 120,
      }) as string,
      quantity: readNumber(input, 'quantity', {
        required: true,
        integer: true,
        min: 1,
      }) as number,
    };
  }
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsIn(['AUTO', 'YAPE'])
  paymentMethod?: 'AUTO' | 'YAPE';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingAddressId?: string;

  static sanitize(value: unknown): CreateOrderDto {
    const input = ensureRecord(value);
    const rawItems = input.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }

    const paymentMethod = readString(input, 'paymentMethod', {
      maxLength: 10,
    });

    if (
      paymentMethod !== undefined &&
      paymentMethod !== 'AUTO' &&
      paymentMethod !== 'YAPE'
    ) {
      throw new BadRequestException('paymentMethod must be AUTO or YAPE');
    }

    return {
      items: rawItems.map((item) => CreateOrderItemDto.fromUnknown(item)),
      paymentMethod: paymentMethod as 'AUTO' | 'YAPE' | undefined,
      shippingAddressId: readString(input, 'shippingAddressId', {
        maxLength: 120,
      }),
    };
  }
}

export class UpsertCartItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  static sanitize(value: unknown): UpsertCartItemDto {
    const input = ensureRecord(value);

    return {
      productId: readString(input, 'productId', {
        required: true,
        minLength: 1,
        maxLength: 120,
      }) as string,
      quantity: readNumber(input, 'quantity', {
        required: true,
        integer: true,
        min: 1,
      }) as number,
    };
  }
}

export class ShippingAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  label!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  recipientName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  region!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  static sanitize(value: unknown): ShippingAddressDto {
    const input = ensureRecord(value);

    return {
      label: readString(input, 'label', {
        required: true,
        minLength: 2,
        maxLength: 80,
      }) as string,
      recipientName: readString(input, 'recipientName', {
        required: true,
        minLength: 2,
        maxLength: 120,
      }) as string,
      phone: readString(input, 'phone', {
        required: true,
        minLength: 6,
        maxLength: 32,
      }) as string,
      line1: readString(input, 'line1', {
        required: true,
        minLength: 5,
        maxLength: 200,
      }) as string,
      line2: readString(input, 'line2', {
        maxLength: 200,
      }) ?? null,
      district: readString(input, 'district', {
        required: true,
        minLength: 2,
        maxLength: 80,
      }) as string,
      city: readString(input, 'city', {
        required: true,
        minLength: 2,
        maxLength: 80,
      }) as string,
      region: readString(input, 'region', {
        required: true,
        minLength: 2,
        maxLength: 80,
      }) as string,
      postalCode: readString(input, 'postalCode', {
        maxLength: 20,
      }) ?? null,
      reference: readString(input, 'reference', {
        maxLength: 200,
      }) ?? null,
      isDefault: readBoolean(input, 'isDefault'),
    };
  }
}

export class ShippingQuoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  addressId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  static sanitize(value: unknown): ShippingQuoteDto {
    const input = ensureRecord(value);
    const rawItems = input.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }

    return {
      addressId: readString(input, 'addressId', {
        required: true,
        minLength: 1,
        maxLength: 120,
      }) as string,
      items: rawItems.map((item) => CreateOrderItemDto.fromUnknown(item)),
    };
  }
}

export class UpdateShipmentStatusDto {
  @IsIn(['CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
  status!: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  static sanitize(value: unknown): UpdateShipmentStatusDto {
    const input = ensureRecord(value);
    const status = readString(input, 'status', {
      required: true,
      maxLength: 20,
    });

    if (
      status !== 'CREATED' &&
      status !== 'IN_TRANSIT' &&
      status !== 'DELIVERED' &&
      status !== 'FAILED'
    ) {
      throw new BadRequestException(
        'status must be CREATED, IN_TRANSIT, DELIVERED or FAILED',
      );
    }

    return {
      status: status as 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED',
      note: readString(input, 'note', {
        maxLength: 255,
      }),
    };
  }
}
