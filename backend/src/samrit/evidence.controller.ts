import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SamritService } from './samrit.service';
import { EvidenceService } from './evidence.service';
const scan = z
  .object({
    code: z.string().min(10).max(200),
    phase: z.literal('entry'),
    visitId: z.uuid().optional(),
    secret: z.string().min(20).max(100).optional(),
    deviceRecordedAt: z.iso.datetime().optional(),
    method: z.enum(['camera', 'manual']),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracyMeters: z.number().min(0).max(100000),
      })
      .nullable()
      .optional(),
  })
  .strict();
const review = z
  .object({
    visitId: z.uuid(),
    secret: z.string().min(20).max(100),
    sentiment: z.enum(['positive', 'negative']),
    rawText: z.string().trim().max(3000),
  })
  .strict();
function parse<T>(schema: z.ZodType<T>, input: unknown) {
  const r = schema.safeParse(input);
  if (!r.success)
    throw new BadRequestException('Please check the supplied fields.');
  return r.data;
}
@Controller('api')
export class EvidenceController {
  private windows = new Map<string, { time: number; count: number }>();
  constructor(
    private evidence: EvidenceService,
    private service: SamritService,
  ) {}
  private limit(req: any) {
    const now = Date.now();
    for (const [key, w] of this.windows)
      if (now - w.time > 60000) this.windows.delete(key);
    const key = req.ip || 'local',
      w = this.windows.get(key) || { time: now, count: 0 };
    if (this.windows.size >= 2000 || ++w.count > 12)
      throw new HttpException('Please wait before trying again.', 429);
    this.windows.set(key, w);
  }
  @Get('consumer/catalog') async catalog() {
    return { success: true, data: await this.evidence.catalog() };
  }
  @Get('consumer/directory') async directory() {
    return { success: true, data: await this.evidence.directory() };
  }
  @Post('consumer/visits/scan') @HttpCode(200) async scan(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    this.limit(req);
    return { success: true, data: await this.evidence.scan(parse(scan, body)) };
  }
  @Post('consumer/visits/finish') @HttpCode(200) async finish(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    this.limit(req);
    return {
      success: true,
      data: await this.evidence.finishVisit(
        parse(
          z
            .object({ visitId: z.uuid(), secret: z.string().min(20).max(100) })
            .strict(),
          body,
        ),
      ),
    };
  }
  @Post('consumer/visits/review') async review(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    this.limit(req);
    return {
      success: true,
      data: await this.evidence.visitReview(parse(review, body)),
    };
  }
  @Get('admin/visit-reviews') @UseGuards(JwtAuthGuard) async reviews(
    @Req() req: any,
  ) {
    return {
      success: true,
      data: await this.evidence.adminReviews(
        await this.service.activeActor(req.user),
      ),
    };
  }
  @Post('admin/visit-reviews/:id/reviewed')
  @UseGuards(JwtAuthGuard)
  async moderate(@Param('id') id: string, @Req() req: any) {
    return {
      success: true,
      data: await this.evidence.moderateReview(
        parse(z.uuid(), id),
        await this.service.activeActor(req.user),
      ),
    };
  }
  @Post('centers/:id/visit-codes') @UseGuards(JwtAuthGuard) async codes(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return {
      success: true,
      data: await this.evidence.issueVisitCodes(
        parse(z.uuid(), id),
        await this.service.activeActor(req.user),
      ),
    };
  }
  @Post('event-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5242880, files: 1 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    this.limit(req);
    return {
      success: true,
      data: await this.evidence.document(
        file,
        parse(z.enum(['menu', 'invoice']), body.documentType || 'menu'),
        await this.service.activeActor(req.user),
      ),
    };
  }
  @Get('event-documents/:id/original') @UseGuards(JwtAuthGuard) async original(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const file = await this.evidence.original(
      parse(z.uuid(), id),
      await this.service.activeActor(req.user),
    );
    res
      .set({
        'Content-Type': file.mime,
        'Content-Disposition': 'attachment',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(file.buffer);
  }
}
