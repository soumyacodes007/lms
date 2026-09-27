<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Trainee = { id: string; institutionId: string; traineeNumber: string; district: string; state: string };
  type Programme = { id: string; title: string };
  type Batch = { id: string; name: string; programmeId: string; institutionId: string };
  type Credential = {
    credential: {
      id: string;
      certificateNumber: string;
      issuedAt: string;
      verificationToken: string;
      revokedAt: string | null;
    };
    trainee: { traineeNumber: string };
    programme: { title: string };
  };
  type Props = { trainees: Trainee[]; programmes: Programme[]; batches: Batch[]; credentials: Credential[] };

  let { trainees, programmes, batches, credentials }: Props = $props();
  let open = $state(false);
  let busy = $state(false);
  let message = $state('');
  let traineeId = $state('');
  let programmeId = $state('');
  let batchId = $state('');
  let verificationUrl = $state('');
  let copyState = $state<'idle' | 'copied'>('idle');
  let revokingId = $state<string | null>(null);

  const availableBatches = $derived(
    batches.filter((batch) => {
      const traineeInstitutionId = trainees.find((trainee) => trainee.id === traineeId)?.institutionId;
      return (
        (!programmeId || batch.programmeId === programmeId) &&
        (!traineeInstitutionId || traineeInstitutionId === batch.institutionId)
      );
    })
  );

  function reset() {
    traineeId = trainees[0]?.id ?? '';
    programmeId = programmes[0]?.id ?? '';
    batchId = batches.find((batch) => batch.programmeId === programmeId)?.id ?? '';
    message = '';
  }

  function updateTrainee(traineeIdValue: string) {
    traineeId = traineeIdValue;
    batchId =
      batches.find(
        (batch) =>
          batch.programmeId === programmeId &&
          batch.institutionId === trainees.find((trainee) => trainee.id === traineeIdValue)?.institutionId
      )?.id ?? '';
  }

  function updateProgramme(programmeIdValue: string) {
    programmeId = programmeIdValue;
    batchId =
      batches.find(
        (batch) =>
          batch.programmeId === programmeIdValue &&
          batch.institutionId === trainees.find((trainee) => trainee.id === traineeId)?.institutionId
      )?.id ?? '';
  }

  async function issueCredential() {
    busy = true;
    message = '';
    try {
      const response = await classroomio.ncct.credentials.$post({ json: { traineeId, programmeId, batchId } });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        message = body.error ?? 'A passed evaluator result is required before issuing this credential.';
        return;
      }
      const result = (await response.json()) as { data?: { verificationToken?: string } };
      if (result.data?.verificationToken) {
        verificationUrl = `${window.location.origin}/verify/${result.data.verificationToken}`;
        copyState = 'idle';
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

  async function copyVerificationUrl() {
    if (!verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      copyState = 'copied';
    } catch {
      message = 'The verification link could not be copied.';
    }
  }

  async function revokeCredential(credentialId: string) {
    revokingId = credentialId;
    message = '';
    try {
      const response = await classroomio.ncct.credentials[':credentialId'].revoke.$post({
        param: { credentialId }
      });
      if (!response.ok) {
        message = 'The credential could not be revoked.';
        return;
      }
      await invalidateAll();
    } catch {
      message = 'The credential could not be revoked.';
    } finally {
      revokingId = null;
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
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-medium">Credential verification link ready</p>
          <a
            class="ui:text-primary mt-1 block break-all underline"
            href={verificationUrl}
            target="_blank"
            rel="noreferrer"
          >
            {verificationUrl}
          </a>
        </div>
        <Button size="sm" variant="outline" onclick={() => void copyVerificationUrl()}>
          {copyState === 'copied' ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    </div>
  {/if}
  {#if credentials.length > 0}
    <div class="mt-4 space-y-2">
      {#each credentials.slice(0, 6) as row}
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <div>
            <p class="font-medium">{row.credential.certificateNumber} · {row.trainee.traineeNumber}</p>
            <p class="ui:text-muted-foreground">{row.programme.title}</p>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant={row.credential.revokedAt ? 'destructive' : 'default'}>
              {row.credential.revokedAt ? 'REVOKED' : 'VALID'}
            </Badge>
            {#if !row.credential.revokedAt}
              <a
                class="ui:text-primary text-xs underline"
                href={`/verify/${row.credential.verificationToken}`}
                target="_blank"
                rel="noreferrer">Verify</a
              >
            {/if}
            {#if !row.credential.revokedAt}
              <Button
                size="sm"
                variant="ghost"
                disabled={revokingId === row.credential.id}
                onclick={() => void revokeCredential(row.credential.id)}
              >
                Revoke
              </Button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {#if message}<p class="ui:text-destructive mt-3 text-sm">{message}</p>{/if}
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
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={traineeId}
          onchange={(event) => updateTrainee(event.currentTarget.value)}
        >
          {#each trainees as trainee}
            <option value={trainee.id}>{trainee.traineeNumber} · {trainee.district}, {trainee.state}</option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Programme
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={programmeId}
          onchange={(event) => updateProgramme(event.currentTarget.value)}
        >
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
