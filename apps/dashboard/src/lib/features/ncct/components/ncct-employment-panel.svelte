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
  type Props = { jobs: Job[]; trainees: Trainee[] };

  let { jobs, trainees }: Props = $props();
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

  function resetPost() {
    employerName = '';
    jobTitle = '';
    jobDescription = '';
    jobLocation = '';
    jobSkills = '';
    message = '';
  }

  function resetApplication() {
    applicationJobId = jobs[0]?.id ?? '';
    applicationTraineeId = trainees[0]?.id ?? '';
    coverNote = '';
    message = '';
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
        disabled={jobs.length === 0 || trainees.length === 0}
        onclick={() => {
          resetApplication();
          applyOpen = true;
        }}>Apply as trainee</Button
      >
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{jobs.length} vacancies</Badge>
    <span>Applications remain visible to centre coordinators.</span>
  </div>
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
          {#each jobs as job}
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
