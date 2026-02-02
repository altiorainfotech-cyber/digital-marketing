declare module 'jest-axe' {
  import type { MatcherFunction } from '@vitest/expect';
  
  export const toHaveNoViolations: {
    toHaveNoViolations: MatcherFunction;
  };
}

declare module '@vitest/expect' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
