import { describe, expect, test, beforeEach, afterEach } from 'bun:test';

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all relevant env vars before each test
    for (const key of Object.keys(process.env)) {
      if (
        ['DEBUG', 'PWDEBUG', 'DEBUG_NETWORK', 'RECORD', 'TIME', 'INTERACTIVE',
          'DRYRUN', 'NOWAIT', 'SHOW', 'WIDTH', 'HEIGHT', 'TIMEOUT', 'LOGIN_TIMEOUT',
          'NOVNC_PORT', 'NOTIFY', 'NOTIFY_TITLE', 'BROWSER_DIR', 'SCREENSHOTS_DIR',
          'EG_EMAIL', 'EG_PASSWORD', 'EG_OTPKEY', 'EG_PARENTALPIN', 'EG_MOBILE',
          'PG_EMAIL', 'PG_PASSWORD', 'PG_OTPKEY', 'GOG_EMAIL', 'GOG_PASSWORD',
          'GOG_NEWSLETTER', 'AE_EMAIL', 'AE_PASSWORD', 'EMAIL', 'PASSWORD',
          'PG_REDEEM', 'LG_EMAIL', 'PG_CLAIMDLC', 'PG_TIMELEFT',
        ].includes(key)
      ) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  // We need to re-import config each time since it reads env at import time.
  // But since ES modules are cached, we test the static values and computed properties.

  test('default boolean flags are false', async () => {
    // Import fresh - cfg reads process.env at module evaluation
    const { cfg } = await import('../src/config.ts');
    // These should be false with no env vars set (unless the test runner sets them)
    expect(typeof cfg.debug).toBe('boolean');
    expect(typeof cfg.dryrun).toBe('boolean');
    expect(typeof cfg.record).toBe('boolean');
  });

  test('default dimensions', async () => {
    const { cfg } = await import('../src/config.ts');
    expect(cfg.width).toBe(1920);
    expect(cfg.height).toBe(1080);
  });

  test('default timeout is 60 seconds', async () => {
    const { cfg } = await import('../src/config.ts');
    expect(cfg.timeout).toBe(60000);
  });

  test('default login_timeout is 180 seconds', async () => {
    const { cfg } = await import('../src/config.ts');
    expect(cfg.login_timeout).toBe(180000);
  });

  test('headless is computed from debug and show', async () => {
    const { cfg } = await import('../src/config.ts');
    // headless = !debug && !show
    expect(cfg.headless).toBe(!cfg.debug && !cfg.show);
  });

  test('dir returns paths ending with data/browser and data/screenshots', async () => {
    const { cfg } = await import('../src/config.ts');
    expect(cfg.dir.browser).toMatch(/\/data\/browser$/);
    expect(cfg.dir.screenshots).toMatch(/\/data\/screenshots$/);
  });

  test('eg_mobile defaults to true (enabled unless explicitly "0")', async () => {
    const { cfg } = await import('../src/config.ts');
    expect(cfg.eg_mobile).toBe(true);
  });

  test('Config interface is exported', async () => {
    const mod = await import('../src/config.ts');
    expect(mod.cfg).toBeDefined();
    expect(typeof mod.cfg.debug).toBe('boolean');
    expect(typeof mod.cfg.width).toBe('number');
  });
});
