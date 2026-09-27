import { describe, expect, it } from 'vitest';
import { filterNcctAuditEvents } from './audit-filter';

describe('NCCT audit filtering', () => {
  it('matches action, entity type, and entity id text', () => {
    const events = [
      { action: 'NOMINATION_APPROVED', entityType: 'nomination', entityId: 'nom-001' },
      { action: 'ASSESSMENT_PASSED', entityType: 'assessment', entityId: 'ass-001' }
    ];

    expect(filterNcctAuditEvents(events, 'assessment')).toEqual([events[1]]);
    expect(filterNcctAuditEvents(events, 'NOM-001')).toEqual([events[0]]);
  });
});
