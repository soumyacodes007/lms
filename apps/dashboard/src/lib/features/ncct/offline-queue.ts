export type NcctQueuedEvent = {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type NcctSyncDelivery =
  | boolean
  | {
      ok: boolean;
      acknowledgedEventIds?: string[];
    };

type QueueStorage = Pick<Storage, 'getItem' | 'setItem'>;

function storageKey(deviceId: string) {
  return `ncct-sync-queue:${deviceId}`;
}

function readQueue(deviceId: string, storage: QueueStorage): NcctQueuedEvent[] {
  const value = storage.getItem(storageKey(deviceId));
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as NcctQueuedEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(deviceId: string, events: NcctQueuedEvent[], storage: QueueStorage) {
  storage.setItem(storageKey(deviceId), JSON.stringify(events));
}

export function createNcctOfflineQueue(
  deviceId: string,
  send: (events: NcctQueuedEvent[]) => Promise<NcctSyncDelivery>,
  storage: QueueStorage = localStorage
) {
  return {
    pendingCount() {
      return readQueue(deviceId, storage).length;
    },
    enqueue(event: NcctQueuedEvent) {
      const events = readQueue(deviceId, storage);
      if (events.some((queued) => queued.eventId === event.eventId)) return events.length;
      events.push(event);
      writeQueue(deviceId, events, storage);
      return events.length;
    },
    async flush() {
      const events = readQueue(deviceId, storage);
      if (events.length === 0) return 0;
      const delivery = await send(events);
      const ok = typeof delivery === 'boolean' ? delivery : delivery.ok;
      if (!ok) return 0;
      if (typeof delivery === 'object' && delivery.acknowledgedEventIds) {
        const acknowledged = new Set(delivery.acknowledgedEventIds);
        const remaining = events.filter((event) => !acknowledged.has(event.eventId));
        writeQueue(deviceId, remaining, storage);
        return events.length - remaining.length;
      }
      writeQueue(deviceId, [], storage);
      return events.length;
    }
  };
}
