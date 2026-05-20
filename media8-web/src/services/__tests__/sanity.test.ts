import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('deve somar corretamente', () => {
    expect(2 + 2).toBe(4);
  });

  it('deve testar verdadeiro', () => {
    expect(true).toBe(true);
  });
});
