import { ConfigService } from '@nestjs/config';
import { VoiceService, voiceInput, voiceReply } from './voice.service';
import { VoiceController } from './voice.controller';
import { GeminiGateway } from './gemini.gateway';
describe('optional voice assistance', () => {
  it('submits a ready review directly and handles repeated requests without another submission', async () => {
    const generate = jest.fn();
    const service = new VoiceService(config(), {
      generate,
    } as unknown as GeminiGateway);
    const context = {
      page: 'visit' as const,
      checkedIn: true,
      finished: true,
      sentiment: 'positive',
      complete: false,
    };
    for (const message of [
      'submit my review',
      'Yes, submit it now',
      'please send my feedback',
    ]) {
      expect((await service.turn({ message, context })).action).toEqual({
        type: 'submit_review',
      });
    }
    const again = await service.turn({
      message: 'submit my review',
      context: { ...context, complete: true },
    });
    expect(again.action).toBeNull();
    expect(again.reply).toContain('already been submitted');
    expect(generate).not.toHaveBeenCalled();
  });
  it('accepts one clear submission invitation and asks only for missing sentiment', async () => {
    const service = new VoiceService(config(), {} as GeminiGateway);
    const context = {
      page: 'visit' as const,
      checkedIn: true,
      finished: true,
      sentiment: 'negative',
    };
    expect(
      (
        await service.turn({
          message: 'yes please',
          context,
          history: [
            {
              role: 'assistant',
              text: 'Would you like me to submit your review?',
            },
          ],
        })
      ).action,
    ).toEqual({ type: 'submit_review' });
    const missing = await service.turn({
      message: 'submit my review',
      context: { ...context, sentiment: '' },
    });
    expect(missing.action).toBeNull();
    expect(missing.reply).toContain('good experience');
  });
  it('turns direct feedback after check-in into a finish-then-draft workflow', async () => {
    const generate = jest.fn().mockResolvedValue({
      data: {
        reply: 'Draft review.',
        action: {
          type: 'review',
          sentiment: 'negative',
          details: 'I waited and got no food.',
        },
      },
    });
    const service = new VoiceService(config(), {
      generate,
    } as unknown as GeminiGateway);
    const result = await service.turn({
      message: 'Leave a review: I waited and got no food.',
      history: [],
      context: { page: 'visit', checkedIn: true, finished: false },
    });
    expect(result.action).toEqual({
      type: 'start_review',
      sentiment: 'negative',
      details: 'I waited and got no food.',
    });
  });
  it('replaces out-of-scope replies with a refusal and options for the current visit stage', async () => {
    const generate = jest.fn().mockResolvedValue({
      data: {
        reply: 'Ignored provider prose.',
        unsupported: true,
        action: { type: 'finish' },
      },
    });
    const service = new VoiceService(config(), {
      generate,
    } as unknown as GeminiGateway);
    const result = await service.turn({
      message: 'Tell me the weather',
      history: [],
      context: { page: 'visit', checkedIn: true, finished: false },
    });
    expect(result.action).toBeNull();
    expect(result.reply).toContain('Sorry, I can’t help with that.');
    expect(result.reply).toContain('leave a private review');
    expect(result.reply).not.toContain('scan the venue QR');
  });
  afterEach(() => jest.restoreAllMocks());
  const config = (values: Record<string, string> = {}) =>
    ({ get: (key: string) => values[key] }) as ConfigService;
  it('rejects unknown tools, invalid allergens, secrets and oversized conversation history', () => {
    expect(
      voiceReply.safeParse({ reply: 'ok', action: { type: 'execute_sql' } })
        .success,
    ).toBe(false);
    expect(
      voiceReply.safeParse({
        reply: 'ok',
        action: {
          type: 'filters',
          allergens: ['Anything'],
          preferences: '',
          area: '',
        },
      }).success,
    ).toBe(false);
    expect(
      voiceInput.safeParse({
        message: 'hi',
        context: { page: 'visit', secret: 'private' },
      }).success,
    ).toBe(false);
    expect(
      voiceInput.safeParse({
        message: 'hi',
        context: { page: 'meals' },
        history: Array(11).fill({ role: 'user', text: 'hello' }),
      }).success,
    ).toBe(false);
  });
  it('uses Gemini only for a validated proposal and never executes the proposal', async () => {
    const reply = {
      reply: 'Review these filters.',
      action: {
        type: 'filters',
        allergens: ['Peanuts'],
        preferences: 'Hot meals',
        area: 'East Village',
      },
    };
    const generate = jest.fn().mockResolvedValue({ data: reply });
    const service = new VoiceService(config(), {
      generate,
    } as unknown as GeminiGateway);
    expect(
      await service.turn({
        message: 'No peanuts and hot food',
        history: [],
        context: { page: 'meals' },
      }),
    ).toEqual(reply);
    expect(generate.mock.calls[0][0]).toBe('voice_assistant');
    expect(generate.mock.calls[0][1]).toContain('Preserve existing allergens');
  });
  it('rejects absent/unsupported audio before contacting ElevenLabs', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch');
    const service = new VoiceService(config(), {} as GeminiGateway);
    await expect(service.transcribe()).rejects.toThrow('supported audio');
    await expect(
      service.transcribe({
        size: 10,
        mimetype: 'text/html',
      } as Express.Multer.File),
    ).rejects.toThrow('supported audio');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('proxies recorded audio as a file to ElevenLabs and returns only its transcript', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Avoid peanuts', words: ['not retained'] }),
    } as unknown as Response);
    const service = new VoiceService(
      config({ ELEVENLABS_API_KEY: 'server-only' }),
      {} as GeminiGateway,
    );
    expect(
      await service.transcribe({
        size: 4,
        mimetype: 'audio/webm',
        buffer: Buffer.from('data'),
      } as Express.Multer.File),
    ).toEqual({ text: 'Avoid peanuts' });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.elevenlabs.io/v1/speech-to-text');
    expect((options!.body as FormData).get('model_id')).toBe('scribe_v2');
    expect(options!.headers).toEqual({ 'xi-api-key': 'server-only' });
  });
  it('returns playable speech bytes and hides provider error bodies', async () => {
    const fetcher = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
      } as Response)
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    const service = new VoiceService(
      config({ ELEVENLABS_API_KEY: 'server-only' }),
      {} as GeminiGateway,
    );
    expect(await service.speak('Hello')).toEqual(Buffer.from([1, 2]));
    expect(fetcher.mock.calls[0][0]).toContain('/text-to-speech/');
    await expect(service.speak('Hello')).rejects.toThrow('Continue with text');
  });
  it('limits public paid-provider calls and rejects invalid messages', async () => {
    const voice = {
      turn: jest.fn().mockResolvedValue({ reply: 'Hi', action: null }),
    };
    const controller = new VoiceController(voice as unknown as VoiceService);
    const req = { ip: 'test' } as any;
    expect(() =>
      controller.turn({ message: '', context: { page: 'meals' } }, req),
    ).toThrow('Invalid');
    for (let i = 0; i < 30; i++)
      await controller.turn({ message: 'hi', context: { page: 'meals' } }, req);
    await expect(
      controller.turn({ message: 'hi', context: { page: 'meals' } }, req),
    ).rejects.toThrow('wait a minute');
    expect(voice.turn).toHaveBeenCalledTimes(30);
  });
});
