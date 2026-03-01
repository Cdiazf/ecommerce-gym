import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { AuthUserRepository } from './auth-user.repository';
import type { AuthenticatedUser, JwtPayload, UserRole } from './auth.types';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly tokenSecret =
    process.env.AUTH_TOKEN_SECRET ?? 'replace-this-secret-in-production';

  private readonly tokenExpiresInSeconds = Number(
    process.env.AUTH_TOKEN_EXPIRES_IN ?? 60 * 60,
  );

  constructor(private readonly userRepository: AuthUserRepository) {}

  async onModuleInit(): Promise<void> {
    this.validateSecurityConfiguration();

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const demoPassword = process.env.DEMO_PASS ?? '123456';

    await this.userRepository.ensureUser({
      id: 'admin-001',
      username: process.env.ADMIN_USER ?? 'admin',
      passwordHash: this.hashPassword(adminPassword),
      role: 'ADMIN',
    });

    await this.userRepository.ensureUser({
      id: 'customer-001',
      username: process.env.DEMO_USER ?? 'cliente',
      passwordHash: this.hashPassword(demoPassword),
      role: 'USER',
    });
  }

  private validateSecurityConfiguration(): void {
    const isProduction = (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
    const insecureMarkers = ['replace-', 'change-me', 'example.com'];

    if (!isProduction) {
      return;
    }

    if (
      this.tokenSecret.length < 32 ||
      insecureMarkers.some((marker) => this.tokenSecret.includes(marker))
    ) {
      throw new Error(
        'AUTH_TOKEN_SECRET is not production-safe. Use a long random secret.',
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

    if (
      adminPassword.length < 12 ||
      insecureMarkers.some((marker) => adminPassword.includes(marker))
    ) {
      throw new Error(
        'ADMIN_PASSWORD is not production-safe. Use a strong non-placeholder password.',
      );
    }
  }

  async register(input: {
    username: string;
    password: string;
  }): Promise<{ id: string; username: string; role: UserRole }> {
    const username = input.username.trim().toLowerCase();

    if (!username || input.password.length < 6) {
      throw new BadRequestException(
        'Username required and password must be at least 6 chars',
      );
    }

    const existing = await this.userRepository.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const created = await this.userRepository.createUser({
      id: randomUUID(),
      username,
      passwordHash: this.hashPassword(input.password),
      role: 'USER',
    });

    return {
      id: created.id,
      username: created.username,
      role: created.role,
    };
  }

  async login(
    usernameRaw: string,
    password: string,
  ): Promise<{ accessToken: string; expiresIn: number; role: UserRole }> {
    const username = usernameRaw.trim().toLowerCase();
    const user = await this.userRepository.findByUsername(username);

    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: now,
      exp: now + this.tokenExpiresInSeconds,
    };

    return {
      accessToken: this.signJwt(payload),
      expiresIn: this.tokenExpiresInSeconds,
      role: user.role,
    };
  }

  verifyToken(token: string): AuthenticatedUser {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const headerJson = Buffer.from(encodedHeader, 'base64url').toString('utf8');
    const header = JSON.parse(headerJson) as { alg?: string; typ?: string };

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new UnauthorizedException('Invalid token header');
    }

    const signedData = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.makeSignature(signedData);

    const providedBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString(
      'utf8',
    );
    const payload = JSON.parse(payloadJson) as JwtPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }

  private signJwt(payload: JwtPayload): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signedData = `${encodedHeader}.${encodedPayload}`;
    const signature = this.makeSignature(signedData);

    return `${signedData}.${signature}`;
  }

  private makeSignature(content: string): string {
    return createHmac('sha256', this.tokenSecret)
      .update(content)
      .digest('base64url');
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');

    if (!salt || !hash) {
      return false;
    }

    const computed = scryptSync(password, salt, 64).toString('hex');

    const providedBuffer = Buffer.from(computed);
    const expectedBuffer = Buffer.from(hash);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }
}
