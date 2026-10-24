import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseFilters,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { ExceptionFilter } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SamritService } from './samrit.service';
import { SamritAI } from './ai.service';
import {
  batchSchema,
  eventSchema,
  centerSchema,
  matchSchema,
  linkSchema,
  scanSchema,
  reviewSchema,
  photoSchema,
} from './contracts';
const ok = (data: any, code = 200) => ({ success: true, data, code });
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; '),
    );
  return result.data;
}
@Catch()
class SamritErrors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const code = error instanceof HttpException ? error.getStatus() : 500;
    const detail: any =
      error instanceof HttpException ? error.getResponse() : null;
    host
      .switchToHttp()
      .getResponse()
      .status(code)
      .json({
        success: false,
        data: null,
        error:
          typeof detail === 'string'
            ? detail
            : detail?.message || 'Unable to complete this request.',
        code,
      });
  }
}
const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
};
@Controller('api')
@ApiTags('Samrit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(SamritErrors)
export class SamritController {
  constructor(
    private service: SamritService,
    private ai: SamritAI,
  ) {}
  private actor(req: any) {
    return this.service.activeActor(req.user);
  }
  @Get('samrit/overview') async overview(@Req() req: any) {
    return ok(await this.service.overview(await this.actor(req)));
  }
  @Post('events') async event(@Body() body: unknown, @Req() req: any) {
    return ok(
      await this.service.event(parse(eventSchema, body), await this.actor(req)),
      201,
    );
  }
  @Put('centers/profile') async center(@Body() body: unknown, @Req() req: any) {
    return ok(
      await this.service.center(
        parse(centerSchema, body),
        await this.actor(req),
      ),
    );
  }
  @Patch('centers/:id/approve') async approve(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return ok(
      await this.service.approve(parse(z.uuid(), id), await this.actor(req)),
    );
  }
  @Post('batches') async batch(@Body() body: unknown, @Req() req: any) {
    return ok(
      await this.service.batch(parse(batchSchema, body), await this.actor(req)),
      201,
    );
  }
  @Patch('batches/:id/reject') async reject(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const input = parse(
      z.object({ reason: z.string().trim().min(5).max(500) }).strict(),
      body,
    );
    return ok(
      await this.service.reject(
        parse(z.uuid(), id),
        input.reason,
        await this.actor(req),
      ),
    );
  }
  @Post('photos')
  @UseInterceptors(FileInterceptor('image', uploadOptions))
  async photo(
    @Body() body: unknown,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: any,
  ) {
    return ok(
      await this.service.upload(
        image,
        parse(photoSchema, body),
        await this.actor(req),
      ),
      201,
    );
  }
  @Put('batches/:id/photo')
  @UseInterceptors(FileInterceptor('image', uploadOptions))
  async attach(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: any,
  ) {
    const actor = await this.actor(req);
    const input = parse(
      photoSchema.extend({ sticker: z.string().max(120).optional() }),
      body,
    );
    const photo = await this.service.upload(image, input, actor);
    return ok(
      await this.service.attach(
        parse(z.uuid(), id),
        photo.photoId,
        input.sticker,
        input,
        actor,
      ),
    );
  }
  @Post('logistics/match') @HttpCode(200) async match(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return ok(
      await this.service.match(parse(matchSchema, body), await this.actor(req)),
    );
  }
  @Post('logistics/scan') @HttpCode(200) async scan(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return ok(
      await this.service.scan(parse(scanSchema, body), await this.actor(req)),
    );
  }
  @Post('logistics/link-qr') @HttpCode(200) async link(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return ok(
      await this.service.link(parse(linkSchema, body), await this.actor(req)),
    );
  }
  @Post('reviews/process') async review(
    @Body() body: unknown,
    @Req() req: any,
  ) {
    return ok(
      await this.service.review(
        parse(reviewSchema, body),
        await this.actor(req),
      ),
      201,
    );
  }
  @Post('llm/ocr')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', uploadOptions))
  async ocr(@UploadedFile() image: Express.Multer.File, @Req() req: any) {
    this.service.require(await this.actor(req), ['DONOR']);
    if (
      !image ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimetype)
    )
      throw new BadRequestException('Upload a JPEG, PNG, or WebP menu image.');
    return ok(await this.ai.menu(image));
  }
}
