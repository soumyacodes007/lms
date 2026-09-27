import { describe, expect, it } from 'vitest';
import { hasNcctInstitutionCodeConflict, normalizeNcctInstitutionCode } from './institutions';

describe('NCCT institution codes', () => {
  const institutions = [{ id: 'centre-1', code: ' ricm-delhi ' }];

  it('normalizes codes for storage and comparison', () => {
    expect(normalizeNcctInstitutionCode('  ricm-delhi ')).toBe('RICM-DELHI');
  });

  it('detects duplicates without blocking the current institution', () => {
    expect(hasNcctInstitutionCodeConflict('RICM-DELHI', institutions)).toBe(true);
    expect(hasNcctInstitutionCodeConflict('RICM-DELHI', institutions, 'centre-1')).toBe(false);
    expect(hasNcctInstitutionCodeConflict('ICM-PUNE', institutions)).toBe(false);
  });
});
