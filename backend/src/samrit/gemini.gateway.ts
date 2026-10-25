import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';
export type AITask =
  | 'voice_assistant'
  | 'meal_filter'
  | 'menu_ocr'
  | 'invoice_ocr'
  | 'feedback_analysis'
  | 'review_analysis';
@Injectable()
export class GeminiGateway {
  private active = 0;
  constructor(
    private config: ConfigService,
    private db: DataSource,
  ) {}
  get configured() {
    return !!this.config.get('GEMINI_API_KEY');
  }
  async generate<T>(
    task: AITask,
    prompt: string,
    schema: z.ZodType<T>,
    options: {
      file?: Express.Multer.File;
      actorId?: string;
      relatedId?: string;
      relatedType?: string;
    } = {},
  ) {
    if (!this.configured)
      throw new ServiceUnavailableException(
        'Gemini is unavailable. Continue with manual entry or NGO review.',
      );
    if (this.active >= 3)
      throw new ServiceUnavailableException(
        'AI processing is busy. Try again shortly.',
      );
    const id = randomUUID(),
      model =
        this.config.get<string>('GEMINI_MODEL') || 'gemini-flash-lite-latest';
    const hash = createHash('sha256')
      .update(prompt)
      .update(options.file?.buffer || '')
      .digest('hex');
    await this.db.query(
      `INSERT INTO app.ai_jobs(id,task,actor_id,related_type,related_id,model,prompt_version,input_sha256,status) VALUES($1,$2,$3,$4,$5,$6,'v1',$7,'running')`,
      [
        id,
        task,
        options.actorId || null,
        options.relatedType || null,
        options.relatedId || null,
        model,
        hash,
      ],
    );
    this.active++;
    try {
      const parts: any[] = [{ text: prompt }];
      if (options.file)
        parts.push({
          inline_data: {
            mime_type: options.file.mimetype,
            data: options.file.buffer.toString('base64'),
          },
        });
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.config.get<string>('GEMINI_API_KEY')!,
          },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,
              maxOutputTokens: 4096,
            },
          }),
        },
      );
      if (!response.ok)
        throw new ServiceUnavailableException(
          'Gemini could not complete this request. Use manual entry or try later.',
        );
      const body: any = await response.json();
      let data: T;
      try {
        data = schema.parse(
          JSON.parse(
            body.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text || '')
              .join('') || '',
          ),
        );
      } catch {
        throw new BadRequestException(
          'AI output failed validation. Please verify manually.',
        );
      }
      await this.db.query(
        "UPDATE app.ai_jobs SET status='completed',result=$2,finished_at=now() WHERE id=$1",
        [
          id,
          task === 'voice_assistant'
            ? JSON.stringify({
                proposedAction: (data as any).action?.type || null,
              })
            : JSON.stringify(data),
        ],
      );
      return { data, jobId: id, mode: 'gemini' as const };
    } catch (e) {
      await this.db.query(
        "UPDATE app.ai_jobs SET status='failed',error_code=$2,finished_at=now() WHERE id=$1",
        [
          id,
          e instanceof BadRequestException
            ? 'invalid_output'
            : 'provider_unavailable',
        ],
      );
      throw e;
    } finally {
      this.active--;
    }
  }
}
