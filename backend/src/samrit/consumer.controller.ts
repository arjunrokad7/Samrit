import { Body, Controller, Post, BadRequestException, HttpCode, HttpException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ConsumerSearchService, mealSearchInput } from './consumer-search.service';

// Public: food seekers do not need to create an account.
@Controller('api/consumer')
export class ConsumerController {
  private windows = new Map<string, { start: number; count: number }>();
  constructor(private searchService: ConsumerSearchService) {}
  @Post('search')
  @HttpCode(200)
  async search(@Body() body: unknown, @Req() request: Request) {
    const parsed = mealSearchInput.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Enter 2–500 characters and valid allergens.');
    const now = Date.now(), key = request.ip || 'local';
    for (const [ip, window] of this.windows) if (now - window.start > 60000) this.windows.delete(ip);
    if (!this.windows.has(key) && this.windows.size >= 1000) throw new HttpException('Smart search is busy. Try again shortly.', 429);
    const window = this.windows.get(key) || { start: now, count: 0 };
    if (++window.count > 12) throw new HttpException('Please wait a minute before searching again.', 429);
    this.windows.set(key, window);
    return { success: true, data: await this.searchService.search(parsed.data) };
  }
}
