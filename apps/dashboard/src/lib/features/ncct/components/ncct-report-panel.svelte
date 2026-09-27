<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';

  type Report = {
    traineesByState: Array<{ state: string; total: number }>;
    nominationsByStatus: Array<{ status: string; total: number }>;
    batchesByStatus: Array<{ status: string; total: number }>;
    placements: { applications: number; shortlisted: number; selected: number; openJobs: number };
  };
  type Props = { report: Report };

  let { report }: Props = $props();
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Operations report</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        A central view of outreach, programme delivery, and employment outcomes.
      </p>
    </div>
    <Badge variant="secondary">Live summary</Badge>
  </div>

  <div class="mt-5 grid gap-4 md:grid-cols-3">
    <div class="rounded-lg border p-4">
      <p class="ui:text-muted-foreground text-sm">Placement pipeline</p>
      <p class="mt-2 text-2xl font-semibold">{report.placements.selected}</p>
      <p class="ui:text-muted-foreground mt-1 text-xs">
        selected from {report.placements.applications} application{report.placements.applications === 1 ? '' : 's'}
      </p>
      <p class="mt-2 text-xs">{report.placements.shortlisted} shortlisted · {report.placements.openJobs} open jobs</p>
    </div>

    <div class="rounded-lg border p-4">
      <p class="ui:text-muted-foreground text-sm">Nomination outcomes</p>
      <div class="mt-3 space-y-2">
        {#each report.nominationsByStatus as item}
          <div class="flex items-center justify-between text-sm">
            <span>{item.status}</span>
            <Badge variant="outline">{item.total}</Badge>
          </div>
        {:else}
          <p class="ui:text-muted-foreground text-sm">No nominations yet.</p>
        {/each}
      </div>
    </div>

    <div class="rounded-lg border p-4">
      <p class="ui:text-muted-foreground text-sm">Batch delivery</p>
      <div class="mt-3 space-y-2">
        {#each report.batchesByStatus as item}
          <div class="flex items-center justify-between text-sm">
            <span>{item.status}</span>
            <Badge variant="outline">{item.total}</Badge>
          </div>
        {:else}
          <p class="ui:text-muted-foreground text-sm">No batches yet.</p>
        {/each}
      </div>
    </div>
  </div>

  <div class="mt-4 rounded-lg border p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="font-medium">Trainees by state</p>
      <Badge variant="secondary">{report.traineesByState.length} regions</Badge>
    </div>
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {#each report.traineesByState as item}
        <div class="bg-muted/40 flex items-center justify-between rounded-md px-3 py-2 text-sm">
          <span>{item.state}</span>
          <span class="font-medium">{item.total}</span>
        </div>
      {:else}
        <p class="ui:text-muted-foreground text-sm">No trainee locations have been recorded.</p>
      {/each}
    </div>
  </div>
</section>
