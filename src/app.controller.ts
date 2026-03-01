import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  @Get('metrics')
  getMetrics() {
    const memory = process.memoryUsage();

    return {
      service: 'gateway',
      uptimeSeconds: Math.round(process.uptime()),
      memoryRssBytes: memory.rss,
      memoryHeapUsedBytes: memory.heapUsed,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
      summary: this.appService.getHello(),
    };
  }
}
