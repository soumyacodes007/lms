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
  type Props = { institutions: Institution[]; programmes: Programme[] };

  let { institutions, programmes }: Props = $props();
  let programmeOpen = $state(false);
  let batchOpen = $state(false);
  let programmeBusy = $state(false);
  let batchBusy = $state(false);
  let formMessage = $state('');

  let programmeTitle = $state('');
  let programmeDescription = $state('');
  let batchProgrammeId = $state('');
  let batchInstitutionId = $state('');
  let batchName = $state('');
  let batchStartsOn = $state('');
  let batchEndsOn = $state('');
  let batchCapacity = $state('30');

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
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{programmes.length} programmes</Badge>
    <span>English delivery is enabled for the first SIH version.</span>
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
