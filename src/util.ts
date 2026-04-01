import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { JSONFilePreset } from 'lowdb/node';
import type { BrowserContext } from 'patchright';
import type { NotifyGame } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = (s: string): string => path.resolve(__dirname, '..', 'data', s);

/** Modified path.resolve that returns null if first argument is '0', used to disable screenshots */
export const resolve = (...a: string[]): string | null =>
  a.length && a[0] == '0' ? null : path.resolve(...a);

/** JSON database backed by a file in data/ */
export const jsonDb = <T>(file: string, defaultData: T) =>
  JSONFilePreset<T>(dataDir(file), defaultData);

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Date and time as UTC in readable/sortable format: 2022-10-06 12:05:27.313 */
export const datetimeUTC = (d = new Date()): string =>
  d.toISOString().replace('T', ' ').replace('Z', '');

/** Same as datetimeUTC but for local timezone */
export const datetime = (d = new Date()): string =>
  datetimeUTC(new Date(d.getTime() - d.getTimezoneOffset() * 60000));

/** Sanitize a string for use as a filename */
export const filenamify = (s: string): string =>
  s.replaceAll(':', '.').replace(/[^a-z0-9 _\-.]/gi, '_');

/** Handle SIGINT (Ctrl-C) gracefully, closing the browser context to save recordings */
export const handleSIGINT = (context: BrowserContext | null = null): void => {
  process.on('SIGINT', async () => {
    console.error('\nInterrupted by SIGINT. Exit!');
    process.exitCode = 130;
    if (context) await context.close();
  });
};

// --- Prompts via Enquirer ---
// @ts-expect-error - enquirer has no type definitions
import Enquirer from 'enquirer';
const enquirer = new Enquirer();

// Lazy-import config to avoid circular dependency at module load time
let _cfg: { login_timeout: number } | null = null;
const getCfg = async () => {
  if (!_cfg) {
    const mod = await import('./config.ts');
    _cfg = mod.cfg;
  }
  return _cfg!;
};

const timeoutPlugin = (timeout: number) => (enq: { on: Function }) => {
  enq.on('prompt', (p: { hint: () => string; cancel: () => void; on: Function }) => {
    const t = setTimeout(() => {
      p.hint = () => 'timeout';
      p.cancel();
    }, timeout);
    p.on('submit', () => clearTimeout(t));
    p.on('cancel', () => clearTimeout(t));
  });
};

// Apply timeout plugin — needs async init
let _pluginApplied = false;
const ensurePlugin = async () => {
  if (!_pluginApplied) {
    const c = await getCfg();
    enquirer.use(timeoutPlugin(c.login_timeout));
    _pluginApplied = true;
  }
};

interface PromptOptions {
  type?: string;
  message?: string;
  validate?: (value: string) => boolean | string;
  [key: string]: unknown;
}

/** Single prompt that returns the value (not an object). Returns undefined on cancel/escape. */
export const prompt = async (o: PromptOptions = {}): Promise<string | undefined> => {
  await ensurePlugin();
  return enquirer
    .prompt({ name: 'name', type: 'input', message: 'Enter value', ...o })
    .then((r: { name: string }) => r.name)
    .catch(() => undefined);
};

export const confirm = (o: PromptOptions = {}): Promise<string | undefined> =>
  prompt({ type: 'confirm', message: 'Continue?', ...o });

// --- Notifications via apprise CLI ---

export const notify = (html: string): Promise<void> => new Promise((resolve, reject) => {
  const notifyUrl = process.env.NOTIFY;
  if (!notifyUrl) {
    return resolve();
  }
  const args = [notifyUrl, '-i', 'html', '-b', `'${html}'`];
  const notifyTitle = process.env.NOTIFY_TITLE;
  if (notifyTitle) args.push('-t', notifyTitle);
  execFile('apprise', args, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (error.message.includes('command not found')) {
        console.info('Run `pip install apprise`. See https://github.com/vogler/free-games-claimer#notifications');
      }
      return reject(error);
    }
    if (stderr) console.error(`stderr: ${stderr}`);
    if (stdout) console.log(`stdout: ${stdout}`);
    resolve();
  });
});

// --- HTML helpers ---

export const escapeHtml = (unsafe: string): string =>
  unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');

export const html_game_list = (games: NotifyGame[]): string =>
  games.map(g => `- <a href="${g.url}">${escapeHtml(g.title)}</a> (${g.status})`).join('<br>');
