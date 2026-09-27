import { describe, expect, it } from 'vitest';
import { summarizeNcctResources } from './operations-summary';

describe('NCCT operations summaries', () => {
  it('combines active capacity with booked quantities by resource type', () => {
    expect(
      summarizeNcctResources(
        [
          { type: 'ROOM', capacity: 30, active: true },
          { type: 'ROOM', capacity: 20, active: false },
          { type: 'HOSTEL', capacity: 18, active: true }
        ],
        [
          { resource: { type: 'ROOM' }, booking: { quantity: 12 } },
          { resource: { type: 'ROOM' }, booking: { quantity: 8 } }
        ]
      )
    ).toEqual([
      { type: 'HOSTEL', total: 1, active: 1, capacity: 18, booked: 0 },
      { type: 'ROOM', total: 2, active: 1, capacity: 50, booked: 20 }
    ]);
  });

  it('retains booked types when a booking references a missing resource row', () => {
    expect(summarizeNcctResources([], [{ resource: { type: 'TRANSPORT' }, booking: { quantity: 4 } }])).toEqual([
      { type: 'TRANSPORT', total: 0, active: 0, capacity: 0, booked: 4 }
    ]);
  });
});
