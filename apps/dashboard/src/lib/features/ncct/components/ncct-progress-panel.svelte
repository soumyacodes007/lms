<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { classroomio } from '$lib/utils/services/api';
  import type { NcctQueuedEvent } from '../offline-queue';

  type Enrollment = {
    enrollment: { id: string; status: string };
    batch: { name: string };
    trainee: { traineeNumber: string; district: string; state: string };
    programme: { title: string };
  };
  type ProgressSnapshot = {
    steps: Array<{
      step: { id: string; position: number; courseId: string; required: boolean };
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      available: boolean;
    }>;
  };
  type Props = {
    enrollments: Enrollment[];
    offline?: boolean;
    onQueueEvent?: (event: NcctQueuedEvent) => boolean;
  };

  let { enrollments, offline = false, onQueueEvent }: Props = $props();
  let selectedId = $state(enrollments[0]?.enrollment.id ?? '');
  let snapshot = $state<ProgressSnapshot | null>(null);
  let loading = $state(false);
  let savingId = $state<string | null>(null);
  let message = $state('');

  async function loadProgress(enrollmentId = selectedId) {
    if (!enrollmentId) return;
    loading = true;
    message = '';
    try {
      const response = await classroomio.ncct.enrollments[':enrollmentId'].progress.$get({
        param: { enrollmentId }
      });
      if (!response.ok) {
        message = 'Progress could not be loaded.';
        return;
      }
      snapshot = (await response.json()).data as ProgressSnapshot;
    } catch {
      message = 'Progress could not be loaded.';
    } finally {
      loading = false;
    }
  }

  async function updateStep(stepId: string, status: 'IN_PROGRESS' | 'COMPLETED') {
    if (!selectedId) return;
    savingId = stepId;
    message = '';
    try {
      const response = await classroomio.ncct.enrollments[':enrollmentId'].progress.$post({
        param: { enrollmentId: selectedId },
        json: { programmeStepId: stepId, status }
      });
      if (!response.ok) {
        if (offline && onQueueEvent?.({
          eventId: crypto.randomUUID(),
          eventType: 'progress.update',
          payload: { enrollmentId: selectedId, programmeStepId: stepId, status }
        })) {
          if (snapshot) {
            snapshot = {
              ...snapshot,
              steps: snapshot.steps.map((item) =>
                item.step.id === stepId ? { ...item, status } : item
              )
            };
          }
          message = 'The progress update is queued for the next successful sync.';
          return;
        }
        message = status === 'COMPLETED' ? 'The step could not be completed.' : 'The step could not be started.';
        return;
      }
      snapshot = (await response.json()).data as ProgressSnapshot;
    } catch {
      message = 'The progress update could not be saved.';
    } finally {
      savingId = null;
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Ordered programme progress</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Centre staff can start and complete course steps while prerequisites stay locked.
      </p>
    </div>
    <Badge variant="secondary">{enrollments.length} enrolments</Badge>
  </div>

  {#if enrollments.length === 0}
    <p class="ui:text-muted-foreground mt-4 text-sm">
      Approve a nomination to create an enrolment and progress record.
    </p>
  {:else}
    <div class="mt-4 grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Enrolment
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          bind:value={selectedId}
          onchange={() => void loadProgress()}
        >
          {#each enrollments as row}
            <option value={row.enrollment.id}
              >{row.trainee.traineeNumber} · {row.programme.title} · {row.batch.name}</option
            >
          {/each}
        </select>
      </label>

      {#if !snapshot && !loading}
        <Button variant="outline" class="w-fit" onclick={() => void loadProgress()}>Load progress</Button>
      {:else if loading}
        <p class="ui:text-muted-foreground text-sm">Loading ordered steps…</p>
      {:else if snapshot}
        <div class="space-y-3">
          {#each snapshot.steps as item}
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p class="font-medium">Step {item.step.position} · course {item.step.courseId.slice(0, 8)}</p>
                <p class="ui:text-muted-foreground mt-1 text-xs">
                  {item.step.required ? 'Required' : 'Optional'} · {item.available
                    ? 'Available'
                    : 'Locked by prerequisite'}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Badge
                  variant={item.status === 'COMPLETED'
                    ? 'default'
                    : item.status === 'IN_PROGRESS'
                      ? 'secondary'
                      : 'outline'}
                >
                  {item.status}
                </Badge>
                {#if item.available && item.status === 'NOT_STARTED'}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === item.step.id}
                    onclick={() => void updateStep(item.step.id, 'IN_PROGRESS')}>Start</Button
                  >
                {:else if item.available && item.status === 'IN_PROGRESS'}
                  <Button
                    size="sm"
                    disabled={savingId === item.step.id}
                    onclick={() => void updateStep(item.step.id, 'COMPLETED')}>Complete</Button
                  >
                {/if}
              </div>
            </div>
          {:else}
            <p class="ui:text-muted-foreground text-sm">No ordered steps have been attached to this programme.</p>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  {#if offline}<p class="ui:text-muted-foreground mt-3 text-xs">Offline mode queues progress changes until the centre reconnects.</p>{/if}
  {#if message}<p class="ui:text-destructive mt-3 text-sm">{message}</p>{/if}
</section>
