<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Job = {
    id: string;
    employerName: string;
    title: string;
    description: string;
    location: string;
    status: string;
    skills: string[];
  };
  type Trainee = { id: string; traineeNumber: string; district: string; state: string };
  type Application = {
    application: { id: string; status: string };
    job: { title: string; employerName: string; location: string };
    trainee: { traineeNumber: string };
  };
  type ApplicationEvent = {
    event: {
      id: string;
      applicationId: string;
      fromStatus: string | null;
      toStatus: string;
      note: string | null;
      createdAt: string;
    };
  };
  type Props = {
    jobs: Job[];
    trainees: Trainee[];
    applications: Application[];
    applicationEvents: ApplicationEvent[];
  };

  let { jobs, trainees, applications, applicationEvents }: Props = $props();
  let postOpen = $state(false);
  let applyOpen = $state(false);
  let busy = $state(false);
  let message = $state('');

  let employerName = $state('');
  let jobTitle = $state('');
  let jobDescription = $state('');
  let jobLocation = $state('');
  let jobSkills = $state('');
  let applicationJobId = $state('');
  let applicationTraineeId = $state('');
  let coverNote = $state('');
  let updatingApplicationId = $state<string | null>(null);
  let applicationNotes = $state<Record<string, string>>({});
  let updatingJobId = $state<string | null>(null);
  let openJobs = $derived(jobs.filter((job) => job.status === 'OPEN'));
  let jobFilter = $state<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');
  let visibleJobs = $derived(jobFilter === 'ALL' ? jobs : jobs.filter((job) => job.status === jobFilter));
  let applicationFilter = $state('ALL');
  let visibleApplications = $derived(
    applicationFilter === 'ALL'
      ? applications
      : applications.filter((row) => row.application.status === applicationFilter)
  );

  function resetPost() {
    employerName = '';
    jobTitle = '';
    jobDescription = '';
    jobLocation = '';
    jobSkills = '';
    message = '';
  }

  function resetApplication() {
    applicationJobId = openJobs[0]?.id ?? '';
    applicationTraineeId = trainees[0]?.id ?? '';
    coverNote = '';
    message = '';
  }

  async function updateJobStatus(jobId: string, status: 'OPEN' | 'CLOSED') {
    updatingJobId = jobId;
    message = '';
    try {
      const response = await classroomio.ncct.jobs[':jobId'].status.$patch({
        param: { jobId },
        json: { status }
      });
      if (!response.ok) {
        message = 'The vacancy status could not be updated.';
        return;
      }
      await invalidateAll();
    } catch {
      message = 'The vacancy status could not be updated.';
    } finally {
      updatingJobId = null;
    }
  }

  async function postJob() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.jobs.$post({
        json: {
          employerName: employerName.trim(),
          title: jobTitle.trim(),
          description: jobDescription.trim(),
          location: jobLocation.trim(),
          skills: jobSkills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean)
        }
      });
      if (!response.ok) {
        message = 'The vacancy could not be published.';
        return;
      }
      postOpen = false;
      resetPost();
      await invalidateAll();
    } catch {
      message = 'The vacancy could not be published.';
    } finally {
      busy = false;
    }
  }

  async function applyForJob() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.jobs[':jobId'].applications.$post({
        param: { jobId: applicationJobId },
        json: { traineeId: applicationTraineeId, coverNote: coverNote.trim() || undefined }
      });
      if (!response.ok) {
        message = 'The application could not be submitted.';
        return;
      }
      applyOpen = false;
      resetApplication();
      await invalidateAll();
    } catch {
      message = 'The application could not be submitted.';
    } finally {
      busy = false;
    }
  }

  async function updateApplication(applicationId: string, status: 'SHORTLISTED' | 'SELECTED' | 'REJECTED') {
    updatingApplicationId = applicationId;
    message = '';
    try {
      const response = await classroomio.ncct.applications[':applicationId'].status.$post({
        param: { applicationId },
        json: { status, note: applicationNotes[applicationId]?.trim() || undefined }
      });
      if (!response.ok) {
        message = 'The application status could not be updated.';
        return;
      }
      await invalidateAll();
    } catch {
      message = 'The application status could not be updated.';
    } finally {
      updatingApplicationId = null;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Employment exchange</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Publish vacancies and let registered trainees apply with their skills.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          resetPost();
          postOpen = true;
        }}>Post vacancy</Button
      >
      <Button
        size="sm"
        disabled={openJobs.length === 0 || trainees.length === 0}
        onclick={() => {
          resetApplication();
          applyOpen = true;
        }}>Apply as trainee</Button
      >
    </div>
  </div>
  <div class="mt-4 flex flex-wrap items-center gap-2">
    <span class="ui:text-muted-foreground text-sm">Show vacancies</span>
    <select class="ui:bg-background h-9 rounded-md border px-3 text-sm" bind:value={jobFilter}>
      <option value="OPEN">Open</option>
      <option value="CLOSED">Closed</option>
      <option value="ALL">All</option>
    </select>
  </div>
  <div class="mt-4 grid gap-3 md:grid-cols-2">
    {#each visibleJobs.slice(0, 6) as job}
      <div class="rounded-lg border p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium">{job.title}</p>
            <p class="ui:text-muted-foreground text-sm">{job.employerName} · {job.location}</p>
          </div>
          <Badge variant={job.status === 'OPEN' ? 'default' : 'outline'}>{job.status}</Badge>
        </div>
        <details class="mt-3">
          <summary class="ui:text-primary cursor-pointer text-xs">View role details</summary>
          <p class="ui:text-muted-foreground mt-2 text-sm">{job.description}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            {#each job.skills as skill}<Badge variant="secondary">{skill}</Badge>{/each}
          </div>
        </details>
        <div class="mt-3 flex items-center justify-between gap-2">
          <span class="ui:text-muted-foreground text-xs">{job.skills.length} requested skills</span>
          {#if job.status === 'OPEN'}
            <Button
              size="sm"
              variant="outline"
              disabled={updatingJobId === job.id}
              onclick={() => void updateJobStatus(job.id, 'CLOSED')}>Close vacancy</Button
            >
          {:else if job.status === 'CLOSED'}
            <Button
              size="sm"
              variant="ghost"
              disabled={updatingJobId === job.id}
              onclick={() => void updateJobStatus(job.id, 'OPEN')}>Reopen vacancy</Button
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">No vacancies have been posted yet.</p>
    {/each}
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{openJobs.length} open vacancies</Badge>
    <Badge variant="secondary">{applications.length} applications</Badge>
    <span>Applications remain visible to centre coordinators.</span>
  </div>
  {#if applications.length > 0}
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <span class="ui:text-muted-foreground text-sm">Show applications</span>
      <select class="ui:bg-background h-9 rounded-md border px-3 text-sm" bind:value={applicationFilter}>
        <option value="ALL">All</option>
        <option value="APPLIED">Applied</option>
        <option value="SHORTLISTED">Shortlisted</option>
        <option value="SELECTED">Selected</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <Badge variant="secondary">{visibleApplications.length} shown</Badge>
    </div>
    <div class="mt-3 space-y-2">
      {#each visibleApplications.slice(0, 5) as row}
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <div>
            <p class="font-medium">{row.job.title} · {row.trainee.traineeNumber}</p>
            <p class="ui:text-muted-foreground">{row.job.employerName} · {row.job.location}</p>
            {#if row.application.coverNote}
              <p class="ui:text-muted-foreground mt-2 max-w-xl text-xs">{row.application.coverNote}</p>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline">{row.application.status}</Badge>
            {#if row.application.status === 'APPLIED'}
              <textarea
                class="ui:bg-background min-h-9 rounded-md border px-3 py-2 text-sm sm:w-52"
                rows="1"
                maxlength="1000"
                placeholder="Review note (optional)"
                bind:value={applicationNotes[row.application.id]}
              ></textarea>
              <Button
                size="sm"
                variant="outline"
                disabled={updatingApplicationId === row.application.id}
                onclick={() => void updateApplication(row.application.id, 'SHORTLISTED')}>Shortlist</Button
              >
              <Button
                size="sm"
                variant="ghost"
                disabled={updatingApplicationId === row.application.id}
                onclick={() => void updateApplication(row.application.id, 'REJECTED')}>Reject</Button
              >
            {:else if row.application.status === 'SHORTLISTED'}
              <textarea
                class="ui:bg-background min-h-9 rounded-md border px-3 py-2 text-sm sm:w-52"
                rows="1"
                maxlength="1000"
                placeholder="Review note (optional)"
                bind:value={applicationNotes[row.application.id]}
              ></textarea>
              <Button
                size="sm"
                disabled={updatingApplicationId === row.application.id}
                onclick={() => void updateApplication(row.application.id, 'SELECTED')}>Select</Button
              >
              <Button
                size="sm"
                variant="ghost"
                disabled={updatingApplicationId === row.application.id}
                onclick={() => void updateApplication(row.application.id, 'REJECTED')}>Reject</Button
              >
            {/if}
          </div>
        </div>
        {@const history = applicationEvents.filter((item) => item.event.applicationId === row.application.id)}
        {#if history.length > 0}
          <div class="ui:text-muted-foreground ml-3 border-l pl-3 text-xs">
            {#each history.slice(0, 3) as item}
              <p>
                {item.event.fromStatus ? `${item.event.fromStatus} → ` : ''}{item.event.toStatus} · {new Date(
                  item.event.createdAt
                ).toLocaleString()}
                {#if item.event.note}
                  · {item.event.note}{/if}
              </p>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
  {#if message}<p class="ui:text-destructive mt-3 text-sm">{message}</p>{/if}
</section>

<Dialog.Root bind:open={postOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Post vacancy</Dialog.Title>
      <Dialog.Description>Publish a vacancy for certified cooperative trainees.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <InputField label="Employer name" bind:value={employerName} />
      <InputField label="Job title" bind:value={jobTitle} />
      <InputField label="Location" bind:value={jobLocation} />
      <InputField label="Skills (comma separated)" bind:value={jobSkills} />
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Description
        <Textarea rows={5} bind:value={jobDescription} />
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (postOpen = false)}>Cancel</Button>
      <Button
        disabled={busy ||
          employerName.trim().length < 2 ||
          jobTitle.trim().length < 2 ||
          jobDescription.trim().length < 10 ||
          !jobLocation.trim()}
        onclick={() => void postJob()}>Publish vacancy</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={applyOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Apply for vacancy</Dialog.Title>
      <Dialog.Description>Submit a trainee application through the employment exchange.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Vacancy
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={applicationJobId}>
          {#each openJobs as job}
            <option value={job.id}>{job.title} · {job.employerName} · {job.location}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Trainee
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={applicationTraineeId}>
          {#each trainees as trainee}
            <option value={trainee.id}>{trainee.traineeNumber} · {trainee.district}, {trainee.state}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Cover note
        <Textarea rows={4} maxlength={2000} bind:value={coverNote} />
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (applyOpen = false)}>Cancel</Button>
      <Button disabled={busy || !applicationJobId || !applicationTraineeId} onclick={() => void applyForJob()}>
        Submit application
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
