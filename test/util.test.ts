import { describe, expect, test } from 'bun:test';
import { datetime, datetimeUTC, filenamify, escapeHtml, html_game_list, resolve, dataDir } from '../src/util.ts';

describe('datetimeUTC', () => {
  test('formats a date as UTC without T or Z', () => {
    const d = new Date('2024-03-15T10:30:45.123Z');
    expect(datetimeUTC(d)).toBe('2024-03-15 10:30:45.123');
  });

  test('returns current time when no arg given', () => {
    const result = datetimeUTC();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});

describe('datetime', () => {
  test('returns a formatted datetime string', () => {
    const result = datetime();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  test('converts to local timezone (differs from UTC by offset)', () => {
    const d = new Date('2024-06-15T12:00:00.000Z');
    const utc = datetimeUTC(d);
    const local = datetime(d);
    // They should be equal only if running in UTC timezone
    const offset = d.getTimezoneOffset();
    if (offset === 0) {
      expect(local).toBe(utc);
    } else {
      expect(local).not.toBe(utc);
    }
  });
});

describe('filenamify', () => {
  test('replaces colons with dots', () => {
    expect(filenamify('2024-03-15 10:30:45.123')).toBe('2024-03-15 10.30.45.123');
  });

  test('replaces special characters with underscores', () => {
    expect(filenamify('Game: The "Best" <One>')).toBe('Game. The _Best_ _One_');
  });

  test('preserves alphanumeric, spaces, hyphens, underscores, dots', () => {
    expect(filenamify('my-game_v2.0 final')).toBe('my-game_v2.0 final');
  });

  test('handles empty string', () => {
    expect(filenamify('')).toBe('');
  });

  test('handles trademark and registered symbols', () => {
    expect(filenamify('Fallout® Classic™')).toBe('Fallout_ Classic_');
  });
});

describe('escapeHtml', () => {
  test('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('handles string with no special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('html_game_list', () => {
  test('formats a single game', () => {
    const games = [{ title: 'Havendock', url: 'https://example.com/havendock', status: 'claimed' }];
    expect(html_game_list(games)).toBe(
      '- <a href="https://example.com/havendock">Havendock</a> (claimed)',
    );
  });

  test('formats multiple games joined by <br>', () => {
    const games = [
      { title: 'Game A', url: 'https://a.com', status: 'claimed' },
      { title: 'Game B', url: 'https://b.com', status: 'failed' },
    ];
    const result = html_game_list(games);
    expect(result).toContain('<br>');
    expect(result.split('<br>')).toHaveLength(2);
  });

  test('escapes HTML in game titles', () => {
    const games = [{ title: '<script>alert("xss")</script>', url: 'https://x.com', status: 'ok' }];
    expect(html_game_list(games)).toContain('&lt;script&gt;');
    expect(html_game_list(games)).not.toContain('<script>');
  });

  test('handles empty array', () => {
    expect(html_game_list([])).toBe('');
  });
});

describe('resolve', () => {
  test('returns null when first arg is "0"', () => {
    expect(resolve('0', 'some', 'path')).toBeNull();
  });

  test('returns resolved path for normal args', () => {
    const result = resolve('/tmp', 'screenshots', 'epic');
    expect(result).toBe('/tmp/screenshots/epic');
  });

  test('returns null for empty args with "0"', () => {
    expect(resolve('0')).toBeNull();
  });
});

describe('dataDir', () => {
  test('returns a path ending with data/<arg>', () => {
    const result = dataDir('browser');
    expect(result).toMatch(/\/data\/browser$/);
  });

  test('returns an absolute path', () => {
    const result = dataDir('screenshots');
    expect(result.startsWith('/')).toBe(true);
  });
});
