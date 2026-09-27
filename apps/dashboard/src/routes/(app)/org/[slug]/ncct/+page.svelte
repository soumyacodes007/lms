<script lang="ts">
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import BriefcaseBusinessIcon from '@lucide/svelte/icons/briefcase-business';
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import PackageOpenIcon from '@lucide/svelte/icons/package-open';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import UsersIcon from '@lucide/svelte/icons/users';
  import * as Page from '@cio/ui/base/page';
  import { Badge } from '@cio/ui/base/badge';

  const { data } = $props();
  const overview = $derived(data.overview);
  const summary = $derived(overview?.summary);

  const cards = [
    { key: 'institutions', label: 'Institutions', icon: Building2Icon },
    { key: 'trainees', label: 'Trainees', icon: UsersIcon },
    { key: 'programmes', label: 'Programmes', icon: GraduationCapIcon },
    { key: 'batches', label: 'Training batches', icon: CalendarDaysIcon },
    { key: 'credentials', label: 'Verified credentials', icon: ShieldCheckIcon },
    { key: 'jobs', label: 'Open jobs', icon: BriefcaseBusinessIcon }
  ] as const;
</script>

<svelte:head>
  <title>NCCT training centre</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>NCCT training centre</Page.Title>
      <p class="ui:text-muted-foreground text-sm">Programmes, nominations, credentials, and employment exchange</p>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !overview}
        <div class="ui:bg-card rounded-xl border p-8 text-center">
          <h2 class="text-lg font-semibold">NCCT data is not available yet</h2>
          <p class="ui:text-muted-foreground mt-2 text-sm">
            Select an organization with NCCT access to view its training operations.
          </p>
        </div>
      {:else}
        <div class="space-y-8">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each cards as card}
              {@const Icon = card.icon}
              <div class="ui:bg-card rounded-xl border p-5">
                <div class="flex items-center justify-between">
                  <span class="ui:text-muted-foreground text-sm">{card.label}</span>
                  <Icon class="ui:text-muted-foreground size-5" />
                </div>
                <p class="mt-3 text-3xl font-semibold">{summary?.[card.key] ?? 0}</p>
              </div>
            {/each}
          </div>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Programmes</h2>
                <Badge variant="secondary">{overview.programmes.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.programmes.slice(0, 5) as programme}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start justify-between gap-4">
                      <p class="font-medium">{programme.title}</p>
                      <Badge variant={programme.status === 'PUBLISHED' ? 'default' : 'outline'}
                        >{programme.status}</Badge
                      >
                    </div>
                    <p class="ui:text-muted-foreground mt-1 line-clamp-2 text-sm">{programme.description}</p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No programmes have been published.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Upcoming batches</h2>
                <Badge variant="secondary">{overview.batches.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.batches.slice(0, 5) as batch}
                  <div class="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p class="font-medium">{batch.name}</p>
                      <p class="ui:text-muted-foreground text-sm">{batch.startsOn} to {batch.endsOn}</p>
                    </div>
                    <Badge variant="outline">{batch.status}</Badge>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No batches have been scheduled.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Institutions</h2>
                <Badge variant="secondary">{overview.institutions.length}</Badge>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                {#each overview.institutions.slice(0, 6) as institution}
                  <div class="rounded-lg border p-3">
                    <p class="font-medium">{institution.name}</p>
                    <p class="ui:text-muted-foreground text-sm">
                      {institution.code} · {institution.district}, {institution.state}
                    </p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No institutions have been registered.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <ClipboardListIcon class="ui:text-muted-foreground size-4" />
                  <h2 class="font-semibold">Upcoming sessions</h2>
                </div>
                <Badge variant="secondary">{overview.sessions.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.sessions.slice(0, 5) as session}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start justify-between gap-4">
                      <p class="font-medium">{session.title}</p>
                      {#if session.room}
                        <Badge variant="outline">{session.room}</Badge>
                      {/if}
                    </div>
                    <p class="ui:text-muted-foreground mt-1 text-sm">
                      {new Date(session.startsAt).toLocaleString()} to {new Date(session.endsAt).toLocaleTimeString()}
                    </p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No sessions have been scheduled.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <PackageOpenIcon class="ui:text-muted-foreground size-4" />
                  <h2 class="font-semibold">Centre resources</h2>
                </div>
                <Badge variant="secondary">{overview.resources.length}</Badge>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                {#each overview.resources.slice(0, 6) as resource}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start justify-between gap-3">
                      <p class="font-medium">{resource.name}</p>
                      <Badge variant={resource.active ? 'default' : 'outline'}>{resource.type}</Badge>
                    </div>
                    <p class="ui:text-muted-foreground mt-1 text-sm">Capacity {resource.capacity}</p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No centre resources have been registered.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Employment exchange</h2>
                <Badge variant="secondary">{overview.jobs.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.jobs.slice(0, 5) as job}
                  <div class="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p class="font-medium">{job.title}</p>
                      <p class="ui:text-muted-foreground text-sm">{job.employerName} · {job.location}</p>
                    </div>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No jobs have been posted.</p>
                {/each}
              </div>
            </section>
          </div>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
