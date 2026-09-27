<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { readNcctOfflineSnapshot } from '$lib/features/ncct/offline-cache';

  type Programme = { id: string; title: string };
  type OfflinePack = {
    generatedAt: string;
    mediaRequiresConnection: boolean;
    programme: { id: string; title: string; description: string };
    steps: Array<{
      position: number;
      course: { id: string; title: string; description: string };
      lessons: Array<{
        id: string;
        title: string;
        note: string | null;
        languages: Array<{ locale: string; content: string }>;
      }>;
      exercises: Array<{
        id: string;
        title: string;
        description: string | null;
        questions: Array<{ id: number; title: string; points: number | null }>;
      }>;
    }>;
  };
  type Props = { orgName: string; programmes: Programme[]; refreshToken: number };

  let { orgName, programmes, refreshToken }: Props = $props();
  let packs = $state<Record<string, OfflinePack>>({});
  let loaded = $state(false);

  async function loadPacks() {
    loaded = false;
    const entries = await Promise.all(
      programmes.map(async (programme) => {
        const cached = await readNcctOfflineSnapshot<OfflinePack>(`pack:${orgName}:${programme.id}`);
        return cached ? ([programme.id, cached.value] as const) : null;
      })
    );
    packs = Object.fromEntries(entries.filter((entry): entry is readonly [string, OfflinePack] => Boolean(entry)));
    loaded = true;
  }

  $effect(() => {
    refreshToken;
    void loadPacks();
  });
</script>

<section class="ui:bg-card rounded-xl border p-5">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Offline learning packs</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Cached lesson text and assessment prompts remain available on this centre PC.
      </p>
    </div>
    <Badge variant="secondary">{Object.keys(packs).length} cached</Badge>
  </div>

  {#if !loaded}
    <p class="ui:text-muted-foreground mt-4 text-sm">Checking this PC for cached programmes…</p>
  {:else if Object.keys(packs).length === 0}
    <p class="ui:text-muted-foreground mt-4 text-sm">
      Cache a programme above to make its learning content available offline.
    </p>
  {:else}
    <div class="mt-4 grid gap-3 md:grid-cols-2">
      {#each Object.values(packs) as pack}
        <details class="rounded-lg border p-3">
          <summary class="cursor-pointer font-medium">{pack.programme.title}</summary>
          <p class="ui:text-muted-foreground mt-2 text-xs">
            Cached {new Date(pack.generatedAt).toLocaleString()} · media requires a connection
          </p>
          <div class="mt-3 space-y-2">
            {#each pack.steps as step}
              <div class="ui:bg-muted/40 rounded-md px-3 py-2 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium">Step {step.position} · {step.course.title}</span>
                  <Badge variant="outline">{step.lessons.length} lessons</Badge>
                </div>
                <p class="ui:text-muted-foreground mt-1 text-xs">
                  {step.exercises.length} exercises · {step.exercises.reduce(
                    (total, exercise) => total + exercise.questions.length,
                    0
                  )} questions
                </p>
                <ul class="ui:text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-xs">
                  {#each step.lessons as lesson}
                    <li>
                      <details>
                        <summary class="cursor-pointer">{lesson.title}</summary>
                        {#if lesson.note}<p class="mt-1">{lesson.note}</p>{/if}
                        {#each lesson.languages as language}
                          <div class="ui:bg-background mt-2 rounded-md border p-2">
                            <p class="ui:text-muted-foreground mb-1 text-[11px] uppercase">{language.locale}</p>
                            <p class="text-sm whitespace-pre-wrap">{language.content}</p>
                          </div>
                        {:else}
                          <p class="mt-1">No text content is available for this lesson.</p>
                        {/each}
                      </details>
                    </li>
                  {/each}
                </ul>
                {#if step.exercises.length > 0}
                  <div class="mt-3 border-t pt-3">
                    <p class="font-medium">Assessment prompts</p>
                    <div class="mt-2 space-y-2">
                      {#each step.exercises as exercise}
                        <details class="rounded-md border px-2 py-1">
                          <summary class="cursor-pointer text-xs font-medium">{exercise.title}</summary>
                          {#if exercise.description}<p class="ui:text-muted-foreground mt-1 text-xs">
                              {exercise.description}
                            </p>{/if}
                          <ol class="mt-2 list-decimal space-y-1 pl-4 text-xs">
                            {#each exercise.questions as question}
                              <li>
                                {question.title}{#if question.points}
                                  · {question.points} points{/if}
                              </li>
                            {/each}
                          </ol>
                        </details>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </details>
      {/each}
    </div>
  {/if}
</section>
