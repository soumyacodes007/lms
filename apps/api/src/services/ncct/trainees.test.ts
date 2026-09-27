import { describe, expect, it } from 'vitest';
import { assertNcctTraineeNumberAvailable } from './trainees';

describe('NCCT trainee registration', () => {
  it('accepts a new trainee number', () => {
    expect(() => assertNcctTraineeNumberAvailable(['NCCT-001'], 'NCCT-002')).not.toThrow();
  });

  it('rejects an existing trainee number', () => {
    expect(() => assertNcctTraineeNumberAvailable(['NCCT-001'], ' NCCT-001 ')).toThrowError(
      'The trainee number is already registered in this organization'
    );
  });
});
