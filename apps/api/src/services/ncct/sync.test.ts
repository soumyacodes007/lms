import { describe, expect, it } from 'vitest';
import { assertNcctSyncDeviceActive } from './sync';

describe('NCCT offline devices', () => {
  it('allows active devices to synchronize', () => {
    expect(() => assertNcctSyncDeviceActive(true)).not.toThrow();
  });

  it('rejects deactivated devices', () => {
    expect(() => assertNcctSyncDeviceActive(false)).toThrowError('This offline device has been deactivated');
  });
});
