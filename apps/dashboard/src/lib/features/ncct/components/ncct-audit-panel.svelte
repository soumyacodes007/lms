<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { filterNcctAuditEvents } from '../audit-filter';

  type AuditEvent = {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  type Props = { events: AuditEvent[] };

  let { events }: Props = $props();
  let query = $state('');
  let visibleEvents = $derived(filterNcctAuditEvents(events, query));
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">NCCT workflow history</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Approvals, assessments, credentials, and placement decisions are recorded for review.
      </p>
    </div>
    <Badge variant="secondary">{visibleEvents.length} of {events.length} events</Badge>
  </div>

  <div class="mt-4 flex flex-wrap gap-2">
    <Input class="min-w-64 flex-1" placeholder="Filter action, entity, or record ID" bind:value={query} />
    <Button variant="ghost" disabled={!query} onclick={() => (query = '')}>Clear</Button>
  </div>

  <div class="mt-4 space-y-2">
    {#each visibleEvents.slice(0, 12) as event}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <div>
          <p class="font-medium">{event.action.replaceAll('_', ' ')}</p>
          <p class="ui:text-muted-foreground text-xs">{event.entityType} · {event.entityId?.slice(0, 8) ?? 'record'}</p>
        </div>
        <p class="ui:text-muted-foreground text-xs">{new Date(event.createdAt).toLocaleString()}</p>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">
        {query ? 'No workflow events match this filter.' : 'No workflow events have been recorded yet.'}
      </p>
    {/each}
  </div>
</section>
