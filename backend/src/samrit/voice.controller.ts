import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { VoiceService, voiceInput } from './voice.service';

@Controller('api/consumer/voice')
export class VoiceController {
  private windows = new Map<string, { start: number; count: number }>();
  private active = 0;
  constructor(private voice: VoiceService) {}
  private async limited<T>(req: Request, run: () => Promise<T>): Promise<T> {
    const now = Date.now();
    for (const [key, value] of this.windows)
      if (now - value.start > 60000) this.windows.delete(key);
    const key = req.ip || 'local';
    if (
      (!this.windows.has(key) && this.windows.size >= 1000) ||
      this.active >= 3
    )
      throw new HttpException(
        'Voice assistant is busy. Try again shortly.',
        429,
      );
    const window = this.windows.get(key) || { start: now, count: 0 };
    this.windows.set(key, window);
    if (++window.count > 30)
      throw new HttpException('Please wait a minute before continuing.', 429);
    this.active++;
    try {
      return await run();
    } finally {
      this.active--;
    }
  }
  @Post('turn')
  @HttpCode(200)
  turn(@Body() body: unknown, @Req() req: Request) {
    const parsed = voiceInput.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Invalid assistant message or context.');
    return this.limited(req, async () => ({
      success: true,
      data: await this.voice.turn(parsed.data),
    }));
  }
  @Post('transcribe')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  transcribe(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.limited(req, async () => ({
      success: true,
      data: await this.voice.transcribe(file),
    }));
  }
  @Post('speak')
  @HttpCode(200)
  async speak(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const parsed = z
      .object({ text: z.string().trim().min(1).max(1200) })
      .strict()
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid speech text.');
    const audio = await this.limited(req, () =>
      this.voice.speak(parsed.data.text),
    );
    res
      .set({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(audio);
  }
}
