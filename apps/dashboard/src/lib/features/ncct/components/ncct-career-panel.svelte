<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Trainee = { id: string; traineeNumber: string; district: string; state: string; skills: string[] };
  type CareerMessage = { id: string; role: 'USER' | 'ASSISTANT'; message: string; createdAt: string };
  type CareerSnapshot = {
    trainee: Trainee;
    skills: string[];
    credentialCount: number;
    matchedJobs: Array<{
      job: { id: string; title: string; employerName: string; location: string; description: string };
      matchedSkills: string[];
    }>;
    messages: CareerMessage[];
  };
  type Props = { trainees: Trainee[] };

  let { trainees }: Props = $props();
  let open = $state(false);
  let loading = $state(false);
  let sending = $state(false);
  let message = $state('');
  let selectedTraineeId = $state('');
  let input = $state('');
  let snapshot = $state<CareerSnapshot | null>(null);

  function reset() {
    selectedTraineeId = trainees[0]?.id ?? '';
    input = '';
    message = '';
    snapshot = null;
  }

  async function loadCareer(traineeId = selectedTraineeId) {
    if (!traineeId) return;
    loading = true;
    message = '';
    try {
      const response = await classroomio.ncct.career[':traineeId'].$get({ param: { traineeId } });
      if (!response.ok) {
        message = 'The career profile could not be loaded.';
        return;
      }
      snapshot = (await response.json()).data as CareerSnapshot;
    } catch {
      message = 'The career profile could not be loaded.';
    } finally {
      loading = false;
    }
  }

  async function sendMessage() {
    if (!selectedTraineeId || !input.trim()) return;
    sending = true;
    message = '';
    try {
      const response = await classroomio.ncct.career[':traineeId'].chat.$post({
        param: { traineeId: selectedTraineeId },
        json: { message: input.trim() }
      });
      if (!response.ok) {
        message = 'The career assistant could not respond.';
        return;
      }
      snapshot = (await response.json()).data as CareerSnapshot;
      input = '';
    } catch {
      message = 'The career assistant could not respond.';
    } finally {
      sending = false;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Career counselling</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Help trainees discover matching vacancies using their registered skills and credentials.
      </p>
    </div>
    <Button
      size="sm"
      disabled={trainees.length === 0}
      onclick={() => {
        reset();
        open = true;
        void loadCareer(trainees[0]?.id);
      }}>Open career assistant</Button
    >
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{trainees.length} trainee profiles</Badge>
    <span>Recommendations use verified profile skills and open vacancies.</span>
  </div>
</section>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-3xl">
    <Dialog.Header>
      <Dialog.Title>Career counselling assistant</Dialog.Title>
      <Dialog.Description>Review matches and ask for a practical next step.</Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-5">
      <label class="grid gap-2 text-sm font-medium">
        Trainee
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          bind:value={selectedTraineeId}
          onchange={() => void loadCareer()}
        >
          {#each trainees as trainee}
            <option value={trainee.id}>{trainee.traineeNumber} · {trainee.district}, {trainee.state}</option>
          {/each}
        </select>
      </label>

      {#if loading}
        <p class="ui:text-muted-foreground text-sm">Loading career profile…</p>
      {:else if snapshot}
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-medium">Profile snapshot</h3>
              <Badge variant="outline">{snapshot.credentialCount} credentials</Badge>
            </div>
            <p class="ui:text-muted-foreground mt-3 text-sm">
              {snapshot.skills.length > 0 ? snapshot.skills.join(' · ') : 'No skills have been added yet.'}
            </p>
          </div>
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-medium">Matching vacancies</h3>
              <Badge variant="secondary">{snapshot.matchedJobs.length}</Badge>
            </div>
            <div class="mt-3 space-y-2">
              {#each snapshot.matchedJobs.slice(0, 3) as match}
                <div class="bg-muted/40 rounded-md p-2 text-sm">
                  <p class="font-medium">{match.job.title}</p>
                  <p class="ui:text-muted-foreground">{match.job.employerName} · {match.job.location}</p>
                  <p class="mt-1 text-xs">Matches: {match.matchedSkills.join(', ')}</p>
                </div>
              {:else}
                <p class="ui:text-muted-foreground text-sm">No open vacancy matches this profile yet.</p>
              {/each}
            </div>
          </div>
        </div>

        <div class="rounded-lg border p-4">
          <h3 class="font-medium">Assistant conversation</h3>
          <div class="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {#each snapshot.messages as entry}
              <div class:ml-8={entry.role === 'USER'} class="bg-muted/40 rounded-md p-2 text-sm">
                <p class="ui:text-muted-foreground mb-1 text-xs">{entry.role === 'USER' ? 'Trainee' : 'Assistant'}</p>
                <p>{entry.message}</p>
              </div>
            {:else}
              <p class="ui:text-muted-foreground text-sm">Ask the assistant about the trainee’s next step.</p>
            {/each}
          </div>
          <div class="mt-4 grid gap-3">
            <Textarea
              rows={3}
              maxlength={2000}
              bind:value={input}
              placeholder="Ask about skills, jobs, or the next step"
            />
            <div class="flex justify-end">
              <Button disabled={sending || !input.trim()} onclick={() => void sendMessage()}>
                {sending ? 'Sending…' : 'Ask assistant'}
              </Button>
            </div>
          </div>
        </div>
      {/if}
      {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
