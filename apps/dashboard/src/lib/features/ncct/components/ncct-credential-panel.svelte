<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Trainee = { id: string; traineeNumber: string; district: string; state: string };
  type Programme = { id: string; title: string };
  type Batch = { id: string; name: string; programmeId: string };
  type Props = { trainees: Trainee[]; programmes: Programme[]; batches: Batch[] };

  let { trainees, programmes, batches }: Props = $props();
  let open = $state(false);
  let busy = $state(false);
  let message = $state('');
  let traineeId = $state('');
  let programmeId = $state('');
  let batchId = $state('');
  let verificationUrl = $state('');

  const availableBatches = $derived(batches.filter((batch) => !programmeId || batch.programmeId === programmeId));

  function reset() {
    traineeId = trainees[0]?.id ?? '';
    programmeId = programmes[0]?.id ?? '';
    batchId = batches.find((batch) => batch.programmeId === programmeId)?.id ?? '';
    message = '';
  }

  async function issueCredential() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.credentials.$post({ json: { traineeId, programmeId, batchId } });
      if (!response.ok) {
        message = 'A passed evaluator result is required before issuing this credential.';
        return;
      }
      const result = (await response.json()) as { data?: { verificationToken?: string } };
      if (result.data?.verificationToken) {
        verificationUrl = `${window.location.origin}/verify/${result.data.verificationToken}`;
      }
      open = false;
      reset();
      await invalidateAll();
    } catch {
      message = 'The credential could not be issued.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Credential issuance</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Issue a verifiable certificate after a passed evaluator result.
      </p>
    </div>
    <Button
      size="sm"
      disabled={trainees.length === 0 || programmes.length === 0 || batches.length === 0}
      onclick={() => {
        reset();
        open = true;
      }}>Issue credential</Button
    >
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">Public verification enabled</Badge>
    <span>Issuance is blocked until an assessment is passed.</span>
  </div>
  {#if verificationUrl}
    <div class="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
      <p class="font-medium">Credential verification link ready</p>
      <a class="ui:text-primary mt-1 block break-all underline" href={verificationUrl} target="_blank" rel="noreferrer">
        {verificationUrl}
      </a>
    </div>
  {/if}
</section>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Issue credential</Dialog.Title>
      <Dialog.Description>The certificate receives a unique number and public verification token.</Dialog.Description>
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
        Programme
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={programmeId}>
          {#each programmes as programme}
            <option value={programme.id}>{programme.title}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Batch
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={batchId}>
          {#each availableBatches as batch}
            <option value={batch.id}>{batch.name}</option>
          {/each}
        </select>
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button disabled={busy || !traineeId || !programmeId || !batchId} onclick={() => void issueCredential()}>
        Issue credential
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
