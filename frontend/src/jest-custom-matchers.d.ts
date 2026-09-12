/**
 * Augmente les types Jest pour inclure les matchers Jasmine-style
 * utilisés dans les specs Angular (toBeTrue, toBeFalse).
 */

declare namespace jest {
  interface Matchers<R> {
    /** Asserts that the value is exactly `true`. */
    toBeTrue(): R;
    /** Asserts that the value is exactly `false`. */
    toBeFalse(): R;
  }
}

/**
 * Fournit le type SpyObj de Jasmine pour la compatibilité des specs existants.
 * Les instances sont créées via `jasmine.createSpyObj()` défini dans setup-jest.ts.
 */
declare namespace jasmine {
  type SpyObj<T> = T & {
    [K in keyof T]: T[K] extends (...args: any[]) => any
      ? T[K] & {
          and: {
            returnValue(val: ReturnType<T[K]>): void;
            callFake(fn: T[K]): void;
            throwError(err: any): void;
            callThrough(): void;
            stub(): void;
          };
          calls: {
            count(): number;
            any(): boolean;
            reset(): void;
            mostRecent(): { args: Parameters<T[K]>; returnValue: ReturnType<T[K]> };
            first(): { args: Parameters<T[K]> };
            all(): Array<{ args: Parameters<T[K]>; returnValue: ReturnType<T[K]> }>;
          };
        }
      : T[K];
  };

  function createSpyObj<T>(baseName: string, methodNames: (keyof T)[]): SpyObj<T>;
  function createSpyObj(baseName: string, methodNames: string[]): any;
  function createSpy(name?: string): any;
  function objectContaining(expected: Record<string, any>): any;
  function arrayContaining(expected: any[]): any;
  function any(expected: any): any;
  function stringMatching(expected: string | RegExp): any;
  function anything(): any;
}

declare function spyOn(obj: any, method: string): any;
