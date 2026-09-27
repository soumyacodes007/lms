<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Trainee = { id: string; traineeNumber: string; district: string; state: string };
  type Batch = { id: string; name: string };
  type Assessment = {
    id: string;
    batchId: string;
    traineeId: string;
    title: string;
    scheduledAt: string;
    score: number | null;
    status: string;
    feedback: string | null;
  };
  type Props = { trainees: Trainee[]; batches: Batch[]; assessments: Assessment[] };

  let { trainees, batches, assessments }: Props = $props();
  let open = $state(false);
  let busy = $state(false);
  let resultId = $state<string | null>(null);
  let message = $state('');
  let traineeId = $state('');
  let batchId = $state('');
  let title = $state('Practical certification interview');
  let scheduledAt = $state('');

  function reset() {
    traineeId = trainees[0]?.id ?? '';
    batchId = batches[0]?.id ?? '';
    title = 'Practical certification interview';
    scheduledAt = '';
    message = '';
  }

  function traineeLabel(id: string) {
    return trainees.find((trainee) => trainee.id === id)?.traineeNumber ?? id.slice(0, 8);
  }

  function batchLabel(id: string) {
    return batches.find((batch) => batch.id === id)?.name ?? id.slice(0, 8);
  }

  async function schedule() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.assessments.$post({
        json: { batchId, traineeId, title: title.trim(), scheduledAt: new Date(scheduledAt).toISOString() }
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        message = body.error ?? 'The assessment could not be scheduled.';
        return;
      }
      open = false;
      reset();
      await invalidateAll();
    } catch {
      message = 'The assessment could not be scheduled.';
    } finally {
      busy = false;
    }
  }

  async function submitResult(assessmentId: string, status: 'PASSED' | 'FAILED') {
    resultId = assessmentId;
    message = '';
    try {
      const response = await classroomio.ncct.assessments[':assessmentId'].result.$post({
        param: { assessmentId },
        json: { status }
      });
      if (!response.ok) {
        message = 'The assessment result could not be saved.';
        return;
      }
      await invalidateAll();
    } catch {
      message = 'The assessment result could not be saved.';
    } finally {
      resultId = null;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Evaluator workflow</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Schedule practical assessments and record certification decisions.
      </p>
    </div>
    <Button
      size="sm"
      disabled={trainees.length === 0 || batches.length === 0}
      onclick={() => {
        reset();
        open = true;
      }}>Schedule assessment</Button
    >
  </div>
  {#if message}<p class="ui:text-destructive mt-3 text-sm">{message}</p>{/if}
  <div class="mt-4 space-y-3">
    {#each assessments.slice(0, 8) as assessment}
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <p class="font-medium">{assessment.title}</p>
          <p class="ui:text-muted-foreground text-sm">
            {traineeLabel(assessment.traineeId)} · {batchLabel(assessment.batchId)} ·
            {new Date(assessment.scheduledAt).toLocaleString()}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant={assessment.status === 'PASSED' ? 'default' : 'outline'}>
            {assessment.status}{assessment.score === null ? '' : ` · ${assessment.score}%`}
          </Badge>
          {#if assessment.status === 'SCHEDULED' || assessment.status === 'SUBMITTED'}
            <Button
              size="sm"
              disabled={resultId === assessment.id}
              onclick={() => void submitResult(assessment.id, 'PASSED')}>Pass</Button
            >
            <Button
              size="sm"
              variant="outline"
              disabled={resultId === assessment.id}
              onclick={() => void submitResult(assessment.id, 'FAILED')}>Fail</Button
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">No evaluator assessments have been scheduled.</p>
    {/each}
  </div>
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Schedule assessment</Dialog.Title>
      <Dialog.Description>Assign a trainee and batch to a practical evaluator slot.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Trainee
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={traineeId}>
          {#each trainees as trainee}
            <option value={trainee.id}>{trainee.traineeNumber} · {trainee.district}, {trainee.state}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Batch
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={batchId}>
          {#each batches as batch}<option value={batch.id}>{batch.name}</option>{/each}
        </select>
      </label>
      <InputField label="Assessment title" bind:value={title} />
      <InputField label="Scheduled date and time" type="datetime-local" bind:value={scheduledAt} />
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button
        disabled={busy || !traineeId || !batchId || !title.trim() || !scheduledAt}
        onclick={() => void schedule()}
      >
        Schedule assessment
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
