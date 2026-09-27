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
    institution: { name: string; code: string };
  };

  let rows = $state<DirectoryRow[]>([]);
  let query = $state('');
  let loading = $state(false);
  let message = $state('');

  async function search() {
    loading = true;
    message = '';
    try {
      const response = await classroomio.ncct.directory.$get({ query: { q: query.trim() || undefined } });
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
    <Button variant="outline" disabled={loading} onclick={() => void search()}
      >{loading ? 'Searching…' : 'Search'}</Button
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
        </div>
      {/each}
    </div>
  {/if}
</section>
