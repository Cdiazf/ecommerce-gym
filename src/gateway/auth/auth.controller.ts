import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthRateLimit } from './auth-rate-limit.decorator';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AuthRateLimit('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @AuthRateLimit('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }
}
