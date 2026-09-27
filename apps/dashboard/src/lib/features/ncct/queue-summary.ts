import type { NcctQueuedEvent } from './offline-queue';

export function summarizeNcctQueue(events: NcctQueuedEvent[]) {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([eventType, total]) => ({ eventType, total }))
    .sort((left, right) => left.eventType.localeCompare(right.eventType));
}
