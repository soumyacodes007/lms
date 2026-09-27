import { afterEach, describe, expect, it, vi } from 'vitest';
import { cacheNcctMedia } from './offline-cache';

describe('cacheNcctMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deduplicates supported URLs and reports failed downloads', async () => {
    const put = vi.fn(async () => undefined);
    vi.stubGlobal('caches', { open: vi.fn(async () => ({ put })) });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: url !== 'https://media.example/fails',
        clone: () => ({})
      }))
    );

    const result = await cacheNcctMedia([
      'https://media.example/video',
      'https://media.example/video',
      'https://media.example/fails',
      'ftp://media.example/ignored'
    ]);

    expect(result).toEqual({ attempted: 2, cached: 1, failed: 1 });
    expect(put).toHaveBeenCalledTimes(1);
  });
});
