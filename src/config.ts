import * as dotenv from 'dotenv';
import { dataDir } from './util.ts';

dotenv.config({ path: 'data/config.env' }); // loads env vars from file - will not set vars that are already set

export interface Config {
  debug: boolean;
  debug_network: boolean;
  record: boolean;
  time: boolean;
  interactive: boolean;
  dryrun: boolean;
  nowait: boolean;
  show: boolean;
  readonly headless: boolean;
  width: number;
  height: number;
  timeout: number;
  login_timeout: number;
  novnc_port: string | undefined;
  notify: string | undefined;
  notify_title: string | undefined;
  readonly dir: { browser: string; screenshots: string };
  // Epic Games
  eg_email: string | undefined;
  eg_password: string | undefined;
  eg_otpkey: string | undefined;
  eg_parentalpin: string | undefined;
  eg_mobile: boolean;
  // Prime Gaming
  pg_email: string | undefined;
  pg_password: string | undefined;
  pg_otpkey: string | undefined;
  // GOG
  gog_email: string | undefined;
  gog_password: string | undefined;
  gog_newsletter: boolean;
  // AliExpress
  ae_email: string | undefined;
  ae_password: string | undefined;
  // Experimental
  pg_redeem: boolean;
  lg_email: string | undefined;
  pg_claimdlc: boolean;
  pg_timeLeft: number;
}

export const cfg: Config = {
  debug: process.env.DEBUG == '1' || process.env.PWDEBUG == '1',
  debug_network: process.env.DEBUG_NETWORK == '1',
  record: process.env.RECORD == '1',
  time: process.env.TIME == '1',
  interactive: process.env.INTERACTIVE == '1',
  dryrun: process.env.DRYRUN == '1',
  nowait: process.env.NOWAIT == '1',
  show: process.env.SHOW == '1',
  get headless(): boolean {
    return !this.debug && !this.show;
  },
  width: Number(process.env.WIDTH) || 1920,
  height: Number(process.env.HEIGHT) || 1080,
  timeout: (Number(process.env.TIMEOUT) || 60) * 1000,
  login_timeout: (Number(process.env.LOGIN_TIMEOUT) || 180) * 1000,
  novnc_port: process.env.NOVNC_PORT,
  notify: process.env.NOTIFY,
  notify_title: process.env.NOTIFY_TITLE,
  get dir() {
    return {
      browser: process.env.BROWSER_DIR || dataDir('browser'),
      screenshots: process.env.SCREENSHOTS_DIR || dataDir('screenshots'),
    };
  },
  // auth epic-games
  eg_email: process.env.EG_EMAIL || process.env.EMAIL,
  eg_password: process.env.EG_PASSWORD || process.env.PASSWORD,
  eg_otpkey: process.env.EG_OTPKEY,
  eg_parentalpin: process.env.EG_PARENTALPIN,
  eg_mobile: process.env.EG_MOBILE != '0',
  // auth prime-gaming
  pg_email: process.env.PG_EMAIL || process.env.EMAIL,
  pg_password: process.env.PG_PASSWORD || process.env.PASSWORD,
  pg_otpkey: process.env.PG_OTPKEY,
  // auth gog
  gog_email: process.env.GOG_EMAIL || process.env.EMAIL,
  gog_password: process.env.GOG_PASSWORD || process.env.PASSWORD,
  gog_newsletter: process.env.GOG_NEWSLETTER == '1',
  // auth AliExpress
  ae_email: process.env.AE_EMAIL || process.env.EMAIL,
  ae_password: process.env.AE_PASSWORD || process.env.PASSWORD,
  // experimental
  pg_redeem: process.env.PG_REDEEM == '1',
  lg_email: process.env.LG_EMAIL || process.env.PG_EMAIL || process.env.EMAIL,
  pg_claimdlc: process.env.PG_CLAIMDLC == '1',
  pg_timeLeft: Number(process.env.PG_TIMELEFT),
};
