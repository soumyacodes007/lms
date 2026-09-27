<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Trainee = { id: string; traineeNumber: string; district: string; state: string };
  type Batch = { id: string; name: string; startsOn: string; endsOn: string; status: string; capacity: number };
  type Props = { trainees: Trainee[]; batches: Batch[] };

  let { trainees, batches }: Props = $props();
  let open = $state(false);
  let busy = $state(false);
  let message = $state('');
  let traineeId = $state('');
  let batchId = $state('');

  function reset() {
    traineeId = trainees[0]?.id ?? '';
    batchId = batches[0]?.id ?? '';
    message = '';
  }

  async function submitNomination() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.nominations.$post({ json: { traineeId, batchId } });
      if (!response.ok) {
        message = 'The nomination could not be submitted.';
        return;
      }
      open = false;
      reset();
      await invalidateAll();
    } catch {
      message = 'The nomination could not be submitted.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Centre nominations</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">Nominate a registered trainee for an open training batch.</p>
    </div>
    <Button
      size="sm"
      disabled={trainees.length === 0 || batches.length === 0}
      onclick={() => {
        reset();
        open = true;
      }}>Submit nomination</Button
    >
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{trainees.length} eligible trainees</Badge>
    <Badge variant="secondary">{batches.length} scheduled batches</Badge>
  </div>
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Submit nomination</Dialog.Title>
      <Dialog.Description
        >The central NCCT team will review this nomination against the batch capacity.</Dialog.Description
      >
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
          {#each batches as batch}
            <option value={batch.id}>{batch.name} · {batch.startsOn} to {batch.endsOn} · {batch.capacity} seats</option>
          {/each}
        </select>
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button disabled={busy || !traineeId || !batchId} onclick={() => void submitNomination()}
        >Submit nomination</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
