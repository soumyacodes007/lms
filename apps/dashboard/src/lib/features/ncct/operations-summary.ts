export type NcctOperationsResource = {
  type: string;
  capacity: number;
  active: boolean;
};

export type NcctOperationsBooking = {
  resource: { type: string };
  booking: { quantity: number };
};

export type NcctResourceSummary = {
  type: string;
  total: number;
  active: number;
  capacity: number;
  booked: number;
};

export function summarizeNcctResources(
  resources: NcctOperationsResource[],
  bookings: NcctOperationsBooking[]
): NcctResourceSummary[] {
  const summaries = new Map<string, NcctResourceSummary>();

  for (const resource of resources) {
    const summary = summaries.get(resource.type) ?? {
      type: resource.type,
      total: 0,
      active: 0,
      capacity: 0,
      booked: 0
    };
    summary.total += 1;
    summary.active += resource.active ? 1 : 0;
    summary.capacity += resource.capacity;
    summaries.set(resource.type, summary);
  }

  for (const booking of bookings) {
    const summary = summaries.get(booking.resource.type) ?? {
      type: booking.resource.type,
      total: 0,
      active: 0,
      capacity: 0,
      booked: 0
    };
    summary.booked += booking.booking.quantity;
    summaries.set(booking.resource.type, summary);
  }

  return [...summaries.values()].sort((left, right) => left.type.localeCompare(right.type));
}
