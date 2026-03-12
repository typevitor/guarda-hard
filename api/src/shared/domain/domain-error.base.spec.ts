import { describe, expect, it } from 'vitest';
import { DomainError } from './domain-error.base';

class TestError extends DomainError {
  constructor() {
    super('test message');
  }
}

describe('DomainError', () => {
  it('sets name to subclass name', () => {
    const error = new TestError();
    expect(error.name).toBe('TestError');
    expect(error.message).toBe('test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });
});
