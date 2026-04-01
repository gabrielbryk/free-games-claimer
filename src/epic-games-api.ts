import type { FreeGame } from './types.ts';

const API_URL = 'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions';

interface PromotionalOffer {
  startDate: string;
  endDate: string;
  discountSetting: { discountPercentage: number };
}

interface CatalogElement {
  title: string;
  urlSlug: string;
  productSlug?: string;
  offerType: string;
  catalogNs?: {
    mappings?: Array<{ pageSlug: string }>;
  };
  promotions?: {
    promotionalOffers?: Array<{
      promotionalOffers: PromotionalOffer[];
    }>;
    upcomingPromotionalOffers?: Array<{
      promotionalOffers: PromotionalOffer[];
    }>;
  };
  price?: {
    totalPrice: {
      originalPrice: number;
      discountPrice: number;
      discount: number;
    };
  };
}

interface ApiResponse {
  data: {
    Catalog: {
      searchStore: {
        elements: CatalogElement[];
      };
    };
  };
}

export function filterFreeGames(elements: CatalogElement[]): FreeGame[] {
  const now = new Date();

  const freeGames = elements.filter(el => {
    const promos = el.promotions?.promotionalOffers;
    if (!promos?.length) return false;
    const offers = promos[0]?.promotionalOffers || [];
    return offers.some(o => {
      const start = new Date(o.startDate);
      const end = new Date(o.endDate);
      return start <= now && now <= end;
    }) && el.price?.totalPrice?.discountPrice === 0;
  });

  return freeGames.map(el => {
    const slug = el.catalogNs?.mappings?.[0]?.pageSlug || el.urlSlug || el.productSlug || '';
    return {
      title: el.title,
      slug,
      url: `https://store.epicgames.com/en-US/p/${slug}`,
      offerType: el.offerType,
    };
  });
}

export async function getFreeGamesFromApi(
  locale = 'en-US',
  country = 'US',
): Promise<FreeGame[]> {
  const url = `${API_URL}?locale=${locale}&country=${country}&allowCountries=${country}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(`Promotions API returned ${resp.status}`);
    return [];
  }
  const data = (await resp.json()) as ApiResponse;
  const elements = data?.data?.Catalog?.searchStore?.elements || [];
  return filterFreeGames(elements);
}
