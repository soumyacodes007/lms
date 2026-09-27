export type NcctAuditSearchEvent = {
  action: string;
  entityType: string;
  entityId: string | null;
};

export function filterNcctAuditEvents<T extends NcctAuditSearchEvent>(events: T[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return events;

  return events.filter((event) =>
    [event.action, event.entityType, event.entityId ?? ''].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  );
}
