/// <reference types="jest" />
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

/* ─────────────────────────────────────────────────────────────────
 * Mock HTMLCanvasElement.getContext pour Chart.js / ng2-charts
 * jsdom ne supporte pas canvas nativement
 * ───────────────────────────────────────────────────────────────── */
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    fill: () => {},
    closePath: () => {},
    measureText: () => ({ width: 0 }),
    fillText: () => {},
    strokeText: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
    rotate: () => {},
    translate: () => {},
    transform: () => {},
    drawImage: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => null,
    setLineDash: () => {},
    getLineDash: () => [],
    clip: () => {},
    putImageData: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(0) }),
    canvas: { width: 0, height: 0 },
  }),
  writable: true,
});

/* ─────────────────────────────────────────────────────────────────
 * Custom matchers: toBeTrue / toBeFalse
 * ───────────────────────────────────────────────────────────────── */
expect.extend({
  toBeTrue(received: unknown) {
    return {
      pass: received === true,
      message: () => `Expected ${received} to be true`,
    };
  },
  toBeFalse(received: unknown) {
    return {
      pass: received === false,
      message: () => `Expected ${received} to be false`,
    };
  },
});

/* ─────────────────────────────────────────────────────────────────
 * Jasmine-style spy helper: wraps jest.fn() with .and.returnValue()
 * ───────────────────────────────────────────────────────────────── */
function createJasmineSpy(name: string): jest.Mock & { and: any; calls: any } {
  const spy = jest.fn() as jest.Mock & { and: any; calls: any };

  spy.and = {
    returnValue: (val: unknown) => { spy.mockReturnValue(val); return spy; },
    returnValues: (...vals: unknown[]) => {
      vals.forEach(v => spy.mockReturnValueOnce(v));
      return spy;
    },
    callFake: (fn: (...a: unknown[]) => unknown) => { spy.mockImplementation(fn); return spy; },
    throwError: (err: unknown) => {
      spy.mockImplementation(() => {
        throw typeof err === 'string' ? new Error(err) : err;
      });
      return spy;
    },
    callThrough: () => spy,
    stub: () => { spy.mockImplementation(() => undefined); return spy; },
  };

  spy.calls = {
    count: () => spy.mock.calls.length,
    any: () => spy.mock.calls.length > 0,
    reset: () => spy.mockClear(),
    allArgs: () => spy.mock.calls,
    mostRecent: () => ({
      args: spy.mock.calls[spy.mock.calls.length - 1],
      returnValue: spy.mock.results[spy.mock.results.length - 1]?.value,
    }),
    first: () => ({ args: spy.mock.calls[0] }),
    all: () =>
      spy.mock.calls.map((args: unknown[], i: number) => ({
        args,
        returnValue: spy.mock.results[i]?.value,
      })),
  };

  return spy;
}

/* ─────────────────────────────────────────────────────────────────
 * Global jasmine shim
 * ───────────────────────────────────────────────────────────────── */
(globalThis as any).jasmine = {
  createSpyObj: (baseName: string, methodNames: string[]) => {
    const obj: Record<string, unknown> = {};
    methodNames.forEach(method => {
      obj[method] = createJasmineSpy(`${baseName}.${method}`);
    });
    return obj;
  },
  createSpy: (name: string) => createJasmineSpy(name),
  objectContaining: (expected: Record<string, unknown>) =>
    expect.objectContaining(expected),
  arrayContaining: (expected: unknown[]) => expect.arrayContaining(expected),
  any: (ctor: unknown) => expect.any(ctor as any),
  stringMatching: (pattern: string | RegExp) => expect.stringMatching(pattern),
  anything: () => expect.anything(),
};

/* ─────────────────────────────────────────────────────────────────
 * spyOn shim
 * ───────────────────────────────────────────────────────────────── */
(globalThis as any).spyOn = (obj: any, method: string): any => {
  const original = obj[method];
  const spy = jest.spyOn(obj, method) as any;

  spy.and = {
    returnValue: (val: unknown) => { spy.mockReturnValue(val); return spy; },
    callFake: (fn: (...a: unknown[]) => unknown) => { spy.mockImplementation(fn); return spy; },
    callThrough: () => { spy.mockImplementation(original); return spy; },
    throwError: (err: unknown) => {
      spy.mockImplementation(() => {
        throw typeof err === 'string' ? new Error(err) : err;
      });
      return spy;
    },
    stub: () => { spy.mockImplementation(() => undefined); return spy; },
  };

  spy.calls = {
    count: () => spy.mock.calls.length,
    any: () => spy.mock.calls.length > 0,
    reset: () => spy.mockClear(),
    mostRecent: () => ({ args: spy.mock.calls[spy.mock.calls.length - 1] }),
  };

  return spy;
};

export {};

/* ─────────────────────────────────────────────────────────────────
 * Filtres globaux console pour l'environnement de test jsdom
 *
 * Ces filtrages suppriment le bruit visuel des messages connus qui
 * n'indiquent pas de vrais échecs de test :
 *   - Chart.js : canvas non disponible en jsdom
 *   - Angular Material : matBadge sur élément aria-hidden
 *   - [PauseMap] : logs de débogage du MapComponent
 *   - refreshToken : logs de auth.service.ts
 * ───────────────────────────────────────────────────────────────── */
const FILTERED_ERROR_PATTERNS = [
  /Failed to create chart/,
  /can't acquire context from the given item/,
  /is not a registered scale/,
  /Token refresh failed/,
];

const FILTERED_WARN_PATTERNS = [
  /Detected a matBadge on an "aria-hidden"/,
];

const FILTERED_LOG_PATTERNS = [
  /\[PauseMap\]/,
  /Token refreshed successfully/,
];

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleLog = console.log.bind(console);

console.error = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (FILTERED_ERROR_PATTERNS.some(pattern => pattern.test(msg))) return;
  originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (FILTERED_WARN_PATTERNS.some(pattern => pattern.test(msg))) return;
  originalConsoleWarn(...args);
};

console.log = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (FILTERED_LOG_PATTERNS.some(pattern => pattern.test(msg))) return;
  originalConsoleLog(...args);
};
