import { describe, expect, test } from 'bun:test';
import { filterFreeGames } from '../src/epic-games-api.ts';

// Helper to create a mock catalog element
function mockElement(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    title: 'Test Game',
    urlSlug: 'test-game',
    offerType: 'BASE_GAME',
    catalogNs: {
      mappings: [{ pageSlug: 'test-game-abc123' }],
    },
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: weekAgo.toISOString(),
              endDate: weekFromNow.toISOString(),
              discountSetting: { discountPercentage: 0 },
            },
          ],
        },
      ],
    },
    price: {
      totalPrice: {
        originalPrice: 1999,
        discountPrice: 0,
        discount: 1999,
      },
    },
    ...overrides,
  };
}

describe('filterFreeGames', () => {
  test('identifies a currently free game', () => {
    const elements = [mockElement()];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Game');
    expect(result[0].slug).toBe('test-game-abc123');
    expect(result[0].url).toBe('https://store.epicgames.com/en-US/p/test-game-abc123');
    expect(result[0].offerType).toBe('BASE_GAME');
  });

  test('excludes games that are on sale but not free', () => {
    const elements = [
      mockElement({
        title: 'Discounted Game',
        price: {
          totalPrice: { originalPrice: 1999, discountPrice: 399, discount: 1600 },
        },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0);
  });

  test('excludes games with no active promotions', () => {
    const elements = [
      mockElement({
        title: 'No Promo',
        promotions: { promotionalOffers: [] },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0);
  });

  test('excludes games with null promotions', () => {
    const elements = [
      mockElement({
        title: 'Null Promo',
        promotions: null,
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0);
  });

  test('excludes upcoming free games that have not started yet', () => {
    const futureStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    const elements = [
      mockElement({
        title: 'Future Free Game',
        promotions: {
          promotionalOffers: [
            {
              promotionalOffers: [
                {
                  startDate: futureStart.toISOString(),
                  endDate: futureEnd.toISOString(),
                  discountSetting: { discountPercentage: 0 },
                },
              ],
            },
          ],
        },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0);
  });

  test('excludes expired free games', () => {
    const pastStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const elements = [
      mockElement({
        title: 'Expired Free Game',
        promotions: {
          promotionalOffers: [
            {
              promotionalOffers: [
                {
                  startDate: pastStart.toISOString(),
                  endDate: pastEnd.toISOString(),
                  discountSetting: { discountPercentage: 0 },
                },
              ],
            },
          ],
        },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0);
  });

  test('falls back to urlSlug when catalogNs.mappings is empty', () => {
    const elements = [
      mockElement({
        title: 'Fallback Slug',
        urlSlug: 'fallback-slug',
        catalogNs: { mappings: [] },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('fallback-slug');
  });

  test('handles multiple elements with mixed free/paid', () => {
    const elements = [
      mockElement({ title: 'Free Game 1' }),
      mockElement({
        title: 'Paid Game',
        price: { totalPrice: { originalPrice: 1999, discountPrice: 1999, discount: 0 } },
        promotions: { promotionalOffers: [] },
      }),
      mockElement({ title: 'Free Game 2', urlSlug: 'free-game-2' }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(2);
    expect(result.map(g => g.title)).toEqual(['Free Game 1', 'Free Game 2']);
  });

  test('handles empty elements array', () => {
    expect(filterFreeGames([])).toEqual([]);
  });

  test('handles games with price 0 but no promotions', () => {
    const elements = [
      mockElement({
        title: 'Always Free',
        price: { totalPrice: { originalPrice: 0, discountPrice: 0, discount: 0 } },
        promotions: { promotionalOffers: [] },
      }),
    ];
    const result = filterFreeGames(elements);
    expect(result).toHaveLength(0); // No active promo = not a promotional free game
  });
});
