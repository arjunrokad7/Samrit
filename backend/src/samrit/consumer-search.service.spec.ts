import {
  ConsumerSearchService,
  mealSearchInput,
} from './consumer-search.service';
import { CONSUMER_MEALS } from '../../../shared/types/consumer-meals';
import { GeminiGateway } from './gemini.gateway';
import { EvidenceService } from './evidence.service';
const matches = CONSUMER_MEALS.map((m) => ({
  id: m.id,
  match: m.servingTemperature === 'cold' ? 'no' : 'yes',
  reason: 'Explicit serving temperature.',
}));
describe('database-backed Gemini meal matching', () => {
  const setup = (result: unknown = matches) => {
    const generate = jest.fn().mockResolvedValue({ data: { matches: result } });
    return {
      service: new ConsumerSearchService(
        { generate } as unknown as GeminiGateway,
        { catalog: async () => CONSUMER_MEALS } as unknown as EvidenceService,
      ),
      generate,
    };
  };
  it('matches the current catalog and retains cold-food exclusions', async () => {
    const { service, generate } = setup();
    const result = await service.search({
      text: 'cant eat cold fooood',
      allergens: [],
    });
    expect(result.matches.filter((m) => m.match === 'yes')).toHaveLength(2);
    expect(generate.mock.calls[0][1]).toContain('servingTemperature');
  });
  it('applies allergens before any LLM matching', async () => {
    const { service, generate } = setup(matches.slice(1));
    await service.search({ text: 'hot food', allergens: ['Wheat'] });
    const prompt = generate.mock.calls[0][1];
    expect(prompt).not.toContain('east-village');
  });
  it('rejects invented IDs and incomplete results', async () => {
    const { service } = setup([{ id: 'invented', match: 'yes', reason: 'x' }]);
    await expect(
      service.search({ text: 'hot food', allergens: [] }),
    ).rejects.toThrow('verify every meal');
  });
  it('keeps uncertainty distinct from supported matches', async () => {
    const { service } = setup(matches.map((m) => ({ ...m, match: 'unknown' })));
    expect(
      (
        await service.search({ text: 'lower sodium', allergens: [] })
      ).matches.every((m) => m.match === 'unknown'),
    ).toBe(true);
  });
  it('validates public input', () => {
    expect(mealSearchInput.safeParse({ text: 'a' }).success).toBe(false);
    expect(
      mealSearchInput.safeParse({ text: 'hot', apiKey: 'no' }).success,
    ).toBe(false);
  });
});
