<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';

  type Job = { id: string; title: string; employerName: string; location: string; status: string };
  type Application = {
    application: { status: string; createdAt: string };
    job: { title: string; employerName: string; location: string };
    trainee: { traineeNumber: string };
  };
  type Props = { jobs: Job[]; applications: Application[] };

  let { jobs, applications }: Props = $props();
  let selectedJobId = $state('');
  let openJobs = $derived(jobs.filter((job) => job.status === 'OPEN'));
  let selectedJob = $derived(jobs.find((job) => job.id === selectedJobId) ?? openJobs[0] ?? null);
  let selectedApplications = $derived(
    selectedJob ? applications.filter((row) => row.job.title === selectedJob.title) : applications
  );
  let shortlisted = $derived(applications.filter((row) => row.application.status === 'SHORTLISTED').length);
  let selected = $derived(applications.filter((row) => row.application.status === 'SELECTED').length);
  let pending = $derived(applications.filter((row) => row.application.status === 'APPLIED').length);

  $effect(() => {
    if (selectedJobId && jobs.some((job) => job.id === selectedJobId)) return;
    selectedJobId = openJobs[0]?.id ?? jobs[0]?.id ?? '';
  });
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Recruiter dashboard</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Monitor vacancies and candidate movement across the NCCT employment exchange.
      </p>
    </div>
    <Badge variant="secondary">{openJobs.length} open vacancies</Badge>
  </div>

  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-lg border p-3">
      <p class="ui:text-muted-foreground text-xs uppercase">Applications</p>
      <p class="mt-1 text-2xl font-semibold">{applications.length}</p>
    </div>
    <div class="rounded-lg border p-3">
      <p class="ui:text-muted-foreground text-xs uppercase">Awaiting review</p>
      <p class="mt-1 text-2xl font-semibold">{pending}</p>
    </div>
    <div class="rounded-lg border p-3">
      <p class="ui:text-muted-foreground text-xs uppercase">Shortlisted</p>
      <p class="mt-1 text-2xl font-semibold">{shortlisted}</p>
    </div>
    <div class="rounded-lg border p-3">
      <p class="ui:text-muted-foreground text-xs uppercase">Selected</p>
      <p class="mt-1 text-2xl font-semibold">{selected}</p>
    </div>
  </div>

  <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <label class="grid gap-2 text-sm font-medium">
      Vacancy pipeline
      <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={selectedJobId}>
        {#each jobs as job}
          <option value={job.id}>{job.title} · {job.employerName} · {job.status}</option>
        {:else}
          <option value="">No vacancies posted</option>
        {/each}
      </select>
      {#if selectedJob}<span class="ui:text-muted-foreground text-xs">{selectedJob.location}</span>{/if}
    </label>

    <div class="rounded-lg border p-3">
      <div class="flex items-center justify-between gap-3">
        <p class="font-medium">Candidate activity</p>
        <Badge variant="outline">{selectedApplications.length} for vacancy</Badge>
      </div>
      <div class="mt-3 grid gap-2 sm:grid-cols-3">
        {#each ['APPLIED', 'SHORTLISTED', 'SELECTED'] as status}
          <div class="ui:bg-muted/40 rounded-md px-3 py-2 text-sm">
            <p class="ui:text-muted-foreground text-xs">{status}</p>
            <p class="mt-1 text-lg font-semibold">
              {selectedApplications.filter((row) => row.application.status === status).length}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
