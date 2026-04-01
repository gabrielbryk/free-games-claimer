export interface GameEntry {
  title: string;
  time: string;
  url: string;
  status?: string;
  store?: string;
  code?: string;
}

export interface GameDb {
  [username: string]: {
    [gameId: string]: GameEntry;
  };
}

export interface NotifyGame {
  title: string;
  url: string;
  status: string;
}

export interface FreeGame {
  title: string;
  slug: string;
  url: string;
  offerType: string;
}

export interface MobileGame {
  title: string;
  url: string;
}
