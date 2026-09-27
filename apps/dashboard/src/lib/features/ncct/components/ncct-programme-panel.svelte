<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Institution = { id: string; code: string; name: string };
  type Programme = { id: string; title: string; description: string; status: string };
  type ProgrammeStep = {
    id: string;
    programmeId: string;
    courseId: string;
    position: number;
    prerequisiteStepId: string | null;
    required: boolean;
  };
  type Course = {
    id: string;
    title: string;
    description: string;
    lessonCount: number;
    exerciseCount: number;
  };
  type Props = {
    institutions: Institution[];
    programmes: Programme[];
    programmeSteps: Array<{ programmeId: string; steps: ProgrammeStep[] }>;
    courses: Course[];
  };

  let { institutions, programmes, programmeSteps, courses }: Props = $props();
  let programmeOpen = $state(false);
  let batchOpen = $state(false);
  let programmeBusy = $state(false);
  let batchBusy = $state(false);
  let stepOpen = $state(false);
  let stepBusy = $state(false);
  let formMessage = $state('');

  let programmeTitle = $state('');
  let programmeDescription = $state('');
  let batchProgrammeId = $state('');
  let batchInstitutionId = $state('');
  let batchName = $state('');
  let batchStartsOn = $state('');
  let batchEndsOn = $state('');
  let batchCapacity = $state('30');
  let stepProgrammeId = $state('');
  let stepCourseId = $state('');
  let stepPosition = $state('1');
  let stepPrerequisiteId = $state('');
  let stepRequired = $state(true);

  function resetProgramme() {
    programmeTitle = '';
    programmeDescription = '';
    formMessage = '';
  }

  function resetBatch() {
    batchProgrammeId = programmes[0]?.id ?? '';
    batchInstitutionId = institutions[0]?.id ?? '';
    batchName = '';
    batchStartsOn = '';
    batchEndsOn = '';
    batchCapacity = '30';
    formMessage = '';
  }

  function stepsFor(programmeId: string) {
    return programmeSteps.find((item) => item.programmeId === programmeId)?.steps ?? [];
  }

  function courseTitle(courseId: string) {
    return courses.find((course) => course.id === courseId)?.title ?? courseId;
  }

  function resetStep() {
    stepProgrammeId = programmes[0]?.id ?? '';
    const steps = stepsFor(stepProgrammeId);
    stepCourseId = courses[0]?.id ?? '';
    stepPosition = String(steps.length + 1);
    stepPrerequisiteId = '';
    stepRequired = true;
    formMessage = '';
  }

  function updateStepProgramme(programmeId: string) {
    stepProgrammeId = programmeId;
    const steps = stepsFor(programmeId);
    stepPosition = String(steps.length + 1);
    stepPrerequisiteId = '';
  }

  async function createProgramme() {
    programmeBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.programmes.$post({
        json: { title: programmeTitle.trim(), description: programmeDescription.trim(), language: 'en' }
      });
      if (!response.ok) {
        formMessage = 'The programme could not be published.';
        return;
      }
      programmeOpen = false;
      resetProgramme();
      await invalidateAll();
    } catch {
      formMessage = 'The programme could not be published.';
    } finally {
      programmeBusy = false;
    }
  }

  async function createBatch() {
    batchBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.batches.$post({
        json: {
          programmeId: batchProgrammeId,
          institutionId: batchInstitutionId,
          name: batchName.trim(),
          startsOn: batchStartsOn,
          endsOn: batchEndsOn,
          capacity: Number(batchCapacity)
        }
      });
      if (!response.ok) {
        formMessage = 'The batch could not be scheduled.';
        return;
      }
      batchOpen = false;
      resetBatch();
      await invalidateAll();
    } catch {
      formMessage = 'The batch could not be scheduled.';
    } finally {
      batchBusy = false;
    }
  }

  async function addStep() {
    stepBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.programmes[':programmeId'].steps.$post({
        param: { programmeId: stepProgrammeId },
        json: {
          programmeId: stepProgrammeId,
          courseId: stepCourseId.trim(),
          position: Number(stepPosition),
          prerequisiteStepId: stepPrerequisiteId || null,
          required: stepRequired
        }
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        formMessage = body.error ?? 'The programme step could not be added.';
        return;
      }
      stepOpen = false;
      resetStep();
      await invalidateAll();
    } catch {
      formMessage = 'The programme step could not be added.';
    } finally {
      stepBusy = false;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Programmes and batches</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Publish an ordered training offering and reserve seats at a centre.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          resetProgramme();
          programmeOpen = true;
        }}>Publish programme</Button
      >
      <Button
        size="sm"
        disabled={programmes.length === 0 || institutions.length === 0}
        onclick={() => {
          resetBatch();
          batchOpen = true;
        }}>Schedule batch</Button
      >
      <Button
        variant="outline"
        size="sm"
        disabled={programmes.length === 0}
        onclick={() => {
          resetStep();
          stepOpen = true;
        }}>Add course step</Button
      >
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{programmes.length} programmes</Badge>
    <span>English delivery is enabled for the first SIH version.</span>
  </div>
  <div class="mt-5 grid gap-3 md:grid-cols-2">
    {#each programmes as programme}
      {@const steps = stepsFor(programme.id)}
      <div class="rounded-lg border p-3">
        <div class="flex items-center justify-between gap-3">
          <p class="font-medium">{programme.title}</p>
          <Badge variant="secondary">{steps.length} steps</Badge>
        </div>
        <div class="mt-3 space-y-2">
          {#each steps as step}
            <div class="ui:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
              <Badge variant="outline">{step.position}</Badge>
              <span class="truncate">{courseTitle(step.courseId)}</span>
              {#if step.required}<span class="ui:text-muted-foreground ml-auto">Required</span>{/if}
            </div>
          {:else}
            <p class="ui:text-muted-foreground text-xs">No ordered course steps yet.</p>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</section>

<Dialog.Root bind:open={programmeOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Publish programme</Dialog.Title>
      <Dialog.Description>Create the programme that institutions can nominate trainees into.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <InputField label="Programme title" bind:value={programmeTitle} />
      <label class="grid gap-2 text-sm font-medium">
        Description
        <Textarea rows={5} bind:value={programmeDescription} />
      </label>
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (programmeOpen = false)}>Cancel</Button>
      <Button
        disabled={programmeBusy || programmeTitle.trim().length < 3 || programmeDescription.trim().length < 10}
        onclick={() => void createProgramme()}>Publish programme</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={stepOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Add ordered course step</Dialog.Title>
      <Dialog.Description>Build the sequence trainees must complete for a programme.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Programme
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={stepProgrammeId}
          onchange={(event) => updateStepProgramme(event.currentTarget.value)}
        >
          {#each programmes as programme}<option value={programme.id}>{programme.title}</option>{/each}
        </select>
      </label>
      {#if courses.length > 0}
        <label class="grid gap-2 text-sm font-medium">
          Course
          <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={stepCourseId}>
            {#each courses as course}
              <option value={course.id}>
                {course.title} · {course.lessonCount} lessons · {course.exerciseCount} exercises
              </option>
            {/each}
          </select>
          <span class="ui:text-muted-foreground text-xs">Choose a course from this organisation’s catalogue.</span>
        </label>
      {:else}
        <InputField label="Course ID" bind:value={stepCourseId} />
      {/if}
      <div class="grid gap-4 sm:grid-cols-2">
        <InputField label="Position" type="number" min="1" bind:value={stepPosition} />
        <label class="grid gap-2 text-sm font-medium">
          Prerequisite
          <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={stepPrerequisiteId}>
            <option value="">None</option>
            {#each stepsFor(stepProgrammeId) as step}<option value={step.id}
                >Step {step.position} · {step.courseId}</option
              >{/each}
          </select>
        </label>
      </div>
      <label class="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" bind:checked={stepRequired} /> Required for completion
      </label>
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (stepOpen = false)}>Cancel</Button>
      <Button
        disabled={stepBusy || !stepProgrammeId || !stepCourseId.trim() || Number(stepPosition) < 1}
        onclick={() => void addStep()}>Add step</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={batchOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Schedule batch</Dialog.Title>
      <Dialog.Description>Assign a published programme to an institution with a seat limit.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Programme
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={batchProgrammeId}>
          {#each programmes as programme}
            <option value={programme.id}>{programme.title}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Institution
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={batchInstitutionId}>
          {#each institutions as institution}
            <option value={institution.id}>{institution.name} ({institution.code})</option>
          {/each}
        </select>
      </label>
      <InputField label="Batch name" bind:value={batchName} />
      <InputField label="Seat capacity" type="number" min="1" bind:value={batchCapacity} />
      <InputField label="Starts on" type="date" bind:value={batchStartsOn} />
      <InputField label="Ends on" type="date" bind:value={batchEndsOn} />
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (batchOpen = false)}>Cancel</Button>
      <Button
        disabled={batchBusy ||
          !batchProgrammeId ||
          !batchInstitutionId ||
          !batchName.trim() ||
          !batchStartsOn ||
          !batchEndsOn ||
          Number(batchCapacity) < 1}
        onclick={() => void createBatch()}>Schedule batch</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
