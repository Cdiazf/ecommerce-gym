import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_PG_POOL, AuthUserRepository } from './auth-user.repository';
import { ShippingAddressRepository } from './shipping-address.repository';
import { createPostgresPool } from '../../shared/postgres/postgres.config';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'AUTH_DB_NAME',
          defaultDatabase: 'auth_db',
        }),
    },
    AuthUserRepository,
    ShippingAddressRepository,
    AuthService,
    RolesGuard,
  ],
  exports: [AuthService, RolesGuard, AuthUserRepository, ShippingAddressRepository],
})
export class AuthModule {}
