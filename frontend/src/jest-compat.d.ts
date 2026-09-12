declare namespace jest {
  interface Matchers<R> {
    toBeTrue(): R;
    toBeFalse(): R;
  }
}

declare const jasmine: {
  createSpyObj: (baseName: string, methodNames: string[]) => any;
  objectContaining: (expected: Record<string, unknown>) => any;
  arrayContaining: (expected: unknown[]) => any;
  any: (expected: unknown) => any;
  stringMatching: (expected: string | RegExp) => any;
  anything: () => any;
};

export {};
