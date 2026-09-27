<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { classroomio } from '$lib/utils/services/api';

  type DirectoryRow = {
    trainee: {
      traineeNumber: string;
      cooperativeName: string | null;
      district: string;
      state: string;
      skills: string[];
    };
    credential: { certificateNumber: string; issuedAt: string };
    programme: { title: string };
    institution: { name: string; code: string; contactEmail: string | null };
  };
  type Institution = { id: string; name: string; code: string };
  type Props = { institutions: Institution[] };

  let { institutions }: Props = $props();
  let rows = $state<DirectoryRow[]>([]);
  let query = $state('');
  let state = $state('');
  let skill = $state('');
  let institutionId = $state('');
  let loading = $state(false);
  let message = $state('');

  async function search() {
    loading = true;
    message = '';
    try {
      const response = await classroomio.ncct.directory.$get({
        query: {
          q: query.trim() || undefined,
          state: state.trim() || undefined,
          skill: skill.trim() || undefined,
          institutionId: institutionId || undefined
        }
      });
      if (!response.ok) {
        message = 'The directory could not be loaded.';
        return;
      }
      rows = (await response.json()).data as DirectoryRow[];
    } catch {
      message = 'The directory could not be loaded.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void search();
  });
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Certified trainee directory</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Find trainees who have chosen to be visible to authorised employment partners.
      </p>
    </div>
    <Badge variant="secondary">{rows.length} matches</Badge>
  </div>

  <div class="mt-4 flex flex-wrap gap-2">
    <Input
      class="min-w-64 flex-1"
      placeholder="Search skill, trainee number, cooperative, or location"
      bind:value={query}
    />
    <Input class="min-w-40" placeholder="State" bind:value={state} />
    <Input class="min-w-40" placeholder="Skill" bind:value={skill} />
    <select class="ui:bg-background h-9 min-w-52 rounded-md border px-3 text-sm" bind:value={institutionId}>
      <option value="">All institutions</option>
      {#each institutions as institution}
        <option value={institution.id}>{institution.name} · {institution.code}</option>
      {/each}
    </select>
    <Button variant="outline" disabled={loading} onclick={() => void search()}
      >{loading ? 'Searching…' : 'Search'}</Button
    >
    <Button
      variant="ghost"
      disabled={loading || (!query && !state && !skill && !institutionId)}
      onclick={() => {
        query = '';
        state = '';
        skill = '';
        institutionId = '';
        void search();
      }}>Clear</Button
    >
  </div>

  {#if message}
    <p class="ui:text-destructive mt-3 text-sm">{message}</p>
  {:else if rows.length === 0 && !loading}
    <p class="ui:text-muted-foreground mt-4 text-sm">No visible certified trainees match this search.</p>
  {:else}
    <div class="mt-4 grid gap-3 md:grid-cols-2">
      {#each rows.slice(0, 12) as row}
        <div class="rounded-lg border p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">{row.trainee.traineeNumber}</p>
              <p class="ui:text-muted-foreground text-sm">{row.institution.name} · {row.institution.code}</p>
            </div>
            <Badge variant="outline">Verified</Badge>
          </div>
          <p class="mt-3 text-sm">{row.programme.title}</p>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {row.trainee.cooperativeName ?? 'Cooperative not specified'} · {row.trainee.district}, {row.trainee.state}
          </p>
          <div class="mt-3 flex flex-wrap gap-1">
            {#each row.trainee.skills.slice(0, 6) as skill}<Badge variant="secondary">{skill}</Badge>{/each}
          </div>
          <p class="ui:text-muted-foreground mt-3 text-xs">Certificate {row.credential.certificateNumber}</p>
          {#if row.institution.contactEmail}
            <a class="ui:text-primary mt-1 block text-xs underline" href={`mailto:${row.institution.contactEmail}`}>
              Contact centre
            </a>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>
