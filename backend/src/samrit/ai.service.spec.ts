import { ConfigService } from '@nestjs/config';
import { SamritAI } from './ai.service';

function configuration(values: Record<string, string> = {}) {
  return { get: (key: string) => values[key] } as ConfigService;
}
describe('Samrit AI gateway', () => {
  afterEach(() => jest.restoreAllMocks());
  it('never invents menu OCR when provider credentials are absent', async () => {
    const ai = new SamritAI(configuration());
    expect(ai.configured).toBe(false);
    await expect(
      ai.menu({ buffer: Buffer.from('image'), mimetype: 'image/png' } as any),
    ).rejects.toThrow('not configured');
  });
  it('labels local fallback classification honestly', async () => {
    const ai = new SamritAI(configuration());
    const result = await ai.flags(
      'The packaging leaked and the food smelled spoiled.',
    );
    expect(result.mode).toBe('local_rules');
    expect(result.flags).toEqual(
      expect.arrayContaining(['spoiled_food', 'unsafe_packaging']),
    );
  });
  it('rotates configured keys without retrying a failed provider request', async () => {
    const ai = new SamritAI(
      configuration({
        GEMINI_MODEL: 'configured-test-model',
        KEY1: 'key-one',
        KEY2: 'key-two',
      }),
    );
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false } as Response);
    await ai.flags('First test review');
    await ai.flags('Second test review');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      (fetchMock.mock.calls[0][1].headers as Record<string, string>)[
        'x-goog-api-key'
      ],
    ).toBe('key-one');
    expect(
      (fetchMock.mock.calls[1][1].headers as Record<string, string>)[
        'x-goog-api-key'
      ],
    ).toBe('key-two');
  });
  it('rejects invalid model JSON and keeps a labeled fallback', async () => {
    const ai = new SamritAI(
      configuration({
        QWEN_BASE_URL: 'http://localhost:11434/v1',
        QWEN_MODEL: 'test-local-model',
      }),
    );
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"flags":["invented_flag"]}' } }],
        }),
      } as Response);
    expect((await ai.flags('No issue reported')).mode).toBe('local_rules');
  });
});
