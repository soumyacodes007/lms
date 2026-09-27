import { describe, expect, it } from 'vitest';
import { ZSearchNcctDirectory } from '@cio/utils/validation/ncct';

describe('NCCT directory query', () => {
  it('normalizes district searches and applies pagination defaults', () => {
    expect(ZSearchNcctDirectory.parse({ district: '  Pune  ' })).toEqual({
      district: 'Pune',
      limit: 12,
      offset: 0
    });
  });

  it('accepts a bounded page and rejects an oversized page', () => {
    expect(ZSearchNcctDirectory.parse({ limit: '50', offset: '25' })).toMatchObject({ limit: 50, offset: 25 });
    expect(() => ZSearchNcctDirectory.parse({ limit: '51' })).toThrow();
  });
});
