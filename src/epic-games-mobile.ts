import type { BrowserContext, Page } from 'patchright';
import type { MobileGame } from './types.ts';

interface MobileOffer {
  content: {
    title: string;
    mapping: { slug: string };
    purchase: Array<{ price: { decimalPrice: number }; purchaseType: string }>;
  };
}

interface MobileTopic {
  topicId: string;
  type: string;
  offers: MobileOffer[];
}

interface MobileApiResponse {
  data: MobileTopic[];
}

const buildUrl = (slug: string): string =>
  `https://store.epicgames.com/en-US/p/${slug}`;

const fetchPlatformJson = async (page: Page, platform: string): Promise<MobileApiResponse> => {
  await page.goto(
    `https://egs-platform-service.store.epicgames.com/api/v2/public/discover/home?count=10&country=DE&locale=en&platform=${platform}&start=0&store=EGS`,
  );
  const response = await page.innerText('body');
  return JSON.parse(response) as MobileApiResponse;
};

export const getPlatformGames = async (page: Page, platform: string): Promise<MobileGame[]> => {
  const json = await fetchPlatformJson(page, platform);
  const freeGameTopic = json.data.find(x => x.type === 'freeGame');
  if (!freeGameTopic) return [];
  return freeGameTopic.offers.map(offer => ({
    title: offer.content.title,
    url: buildUrl(offer.content.mapping.slug),
  }));
};

export const getMobileGames = async (context: BrowserContext): Promise<MobileGame[]> => {
  const page = await context.newPage();
  try {
    const android = await getPlatformGames(page, 'android');
    const ios = await getPlatformGames(page, 'ios');
    return [...android, ...ios];
  } finally {
    await page.close();
  }
};
