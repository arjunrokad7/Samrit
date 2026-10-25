import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GeminiGateway } from './gemini.gateway';
import { SamritAI } from './ai.service';
import { z } from 'zod';
describe('shared Gemini gateway', () => {
  afterEach(() => jest.restoreAllMocks());
  const setup = (key = 'test-key') => {
    const query = jest.fn().mockResolvedValue([]);
    const gateway = new GeminiGateway(
      {
        get: (n: string) =>
          n === 'GEMINI_API_KEY'
            ? key
            : n === 'GEMINI_MODEL'
              ? 'test-model'
              : undefined,
      } as ConfigService,
      { query } as unknown as DataSource,
    );
    return { gateway, query };
  };
  const response = (data: unknown) =>
    ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }],
      }),
    }) as Response;
  it('uses the same server key and audits validated results without saving input text', async () => {
    const fetcher = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(response({ ok: true }));
    const { gateway, query } = setup();
    await gateway.generate(
      'meal_filter',
      'private preference',
      z.object({ ok: z.boolean() }),
    );
    expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty(
      'x-goog-api-key',
      'test-key',
    );
    expect(JSON.stringify(query.mock.calls)).not.toContain(
      'private preference',
    );
    expect(query.mock.calls[1][0]).toContain("status='completed'");
  });
  it('rejects malformed model output and marks the job failed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ ok: 'wrong' }));
    const { gateway, query } = setup();
    await expect(
      gateway.generate('menu_ocr', 'extract', z.object({ ok: z.boolean() })),
    ).rejects.toThrow('failed validation');
    expect(query.mock.calls.at(-1)[1][1]).toBe('invalid_output');
  });
  it('requires the configured key instead of silently using unrelated providers', async () => {
    const { gateway } = setup('');
    await expect(
      gateway.generate('menu_ocr', 'extract', z.object({})),
    ).rejects.toThrow('manual entry');
  });
  it('preserves unknown OCR quantities and handling for human confirmation', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        response({
          items: [
            {
              name: 'Lentils',
              ingredients: null,
              allergens: null,
              estimatedServings: null,
              handlingRequirement: 'unknown',
              quantity: 2,
              unit: 'bags',
              sourceReference: 'page 1 line 2',
              itemType: 'ingredient',
            },
          ],
        }),
      );
    const { gateway } = setup();
    const result = await new SamritAI(gateway).menu(
      {
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-'),
      } as Express.Multer.File,
      'invoice',
    );
    expect(result.items[0].estimatedServings).toBeNull();
    expect(result.items[0].handlingRequirement).toBe('unknown');
    expect(result.requiresHumanVerification).toBe(true);
  });
  it('keeps review intake open with explicit manual review when Gemini fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(Error('offline'));
    const { gateway } = setup();
    const result = await new SamritAI(gateway).analyze('Long line, no food', {
      elapsedMinutes: 45,
    });
    expect(result.mode).toBe('manual_review');
    expect(result.requiresHumanReview).toBe(true);
    expect(result.consistency).toBe('insufficient_evidence');
  });
});
