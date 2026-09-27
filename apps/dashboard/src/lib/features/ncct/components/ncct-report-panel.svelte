<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { classroomio } from '$lib/utils/services/api';

  type Report = {
    institutionsByActivity: Array<{
      institutionId: string;
      code: string;
      name: string;
      trainees: number;
      batches: number;
      activeBatches: number;
      credentials: number;
    }>;
    traineesByState: Array<{ state: string; total: number }>;
    nominationsByStatus: Array<{ status: string; total: number }>;
    batchesByStatus: Array<{ status: string; total: number }>;
    enrollmentsByStatus: Array<{ status: string; total: number }>;
    credentialsByStatus: Array<{ status: string; total: number }>;
    assessmentsByStatus: Array<{ status: string; total: number }>;
    completionRate: number;
    placements: { applications: number; shortlisted: number; selected: number; openJobs: number };
  };
  type Props = { report: Report };

  let { report }: Props = $props();
  let exporting = $state(false);
  let message = $state('');

  async function exportReport() {
    exporting = true;
    message = '';
    try {
      const response = await classroomio.ncct.reports.export.$get();
      if (!response.ok) {
        message = 'The report could not be exported.';
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ncct-operations-report.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      message = 'The report could not be exported.';
    } finally {
      exporting = false;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Operations report</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        A central view of outreach, programme delivery, and employment outcomes.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Badge variant="secondary">Live summary</Badge>
      <Button size="sm" variant="outline" disabled={exporting} onclick={() => void exportReport()}>
        {exporting ? 'Preparing…' : 'Download CSV'}
      </Button>
    </div>
  </div>
  {#if message}<p class="ui:text-destructive mt-3 text-sm">{message}</p>{/if}

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

    <div class="rounded-lg border p-4">
      <p class="ui:text-muted-foreground text-sm">Training funnel</p>
      <div class="mt-3 space-y-2">
        {#each report.enrollmentsByStatus as item}
          <div class="flex items-center justify-between text-sm">
            <span>{item.status}</span>
            <Badge variant="outline">{item.total}</Badge>
          </div>
        {:else}
          <p class="ui:text-muted-foreground text-sm">No enrolments yet.</p>
        {/each}
      </div>
      <div class="ui:text-muted-foreground mt-3 border-t pt-3 text-xs">
        {#each report.credentialsByStatus as item, index}
          {#if index > 0}
            ·
          {/if}{item.total}
          {item.status.toLowerCase()} credentials
        {/each}
      </div>
    </div>

    <div class="rounded-lg border p-4">
      <p class="ui:text-muted-foreground text-sm">Assessment outcomes</p>
      <div class="mt-3 space-y-2">
        {#each report.assessmentsByStatus as item}
          <div class="flex items-center justify-between text-sm">
            <span>{item.status}</span>
            <Badge variant="outline">{item.total}</Badge>
          </div>
        {:else}
          <p class="ui:text-muted-foreground text-sm">No assessments yet.</p>
        {/each}
      </div>
      <p class="ui:text-muted-foreground mt-3 border-t pt-3 text-xs">Completion rate {report.completionRate}%</p>
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

  <div class="mt-4 rounded-lg border p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="font-medium">Institution activity</p>
      <Badge variant="secondary">{report.institutionsByActivity.length} centres</Badge>
    </div>
    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="ui:text-muted-foreground border-b text-xs">
          <tr>
            <th class="px-3 py-2 font-medium">Institution</th>
            <th class="px-3 py-2 font-medium">Trainees</th>
            <th class="px-3 py-2 font-medium">Batches</th>
            <th class="px-3 py-2 font-medium">Active</th>
            <th class="px-3 py-2 font-medium">Credentials</th>
          </tr>
        </thead>
        <tbody>
          {#each report.institutionsByActivity as item}
            <tr class="border-b last:border-0">
              <td class="px-3 py-2">
                <p class="font-medium">{item.name}</p>
                <p class="ui:text-muted-foreground text-xs">{item.code}</p>
              </td>
              <td class="px-3 py-2">{item.trainees}</td>
              <td class="px-3 py-2">{item.batches}</td>
              <td class="px-3 py-2">{item.activeBatches}</td>
              <td class="px-3 py-2">{item.credentials}</td>
            </tr>
          {:else}
            <tr
              ><td class="ui:text-muted-foreground px-3 py-3" colspan="5">No institution activity is available.</td></tr
            >
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>
