declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function expect<T>(actual: T): {
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBe(expected: T): void;
  toEqual(expected: unknown): void;
  toContain(expected: unknown): void;
};

