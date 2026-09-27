<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import BriefcaseBusinessIcon from '@lucide/svelte/icons/briefcase-business';
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import PackageOpenIcon from '@lucide/svelte/icons/package-open';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import WifiOffIcon from '@lucide/svelte/icons/wifi-off';
  import { Button } from '@cio/ui/base/button';
  import { classroomio } from '$lib/utils/services/api';
  import {
    clearNcctOfflineSnapshot,
    readNcctOfflineSnapshot,
    saveNcctOfflineSnapshot
  } from '$lib/features/ncct/offline-cache';
  import { createNcctOfflineQueue, type NcctQueuedEvent } from '$lib/features/ncct/offline-queue';
  import NcctSetupPanel from '$lib/features/ncct/components/ncct-setup-panel.svelte';
  import NcctProgrammePanel from '$lib/features/ncct/components/ncct-programme-panel.svelte';
  import NcctOfflinePackPanel from '$lib/features/ncct/components/ncct-offline-pack-panel.svelte';
  import NcctNominationPanel from '$lib/features/ncct/components/ncct-nomination-panel.svelte';
  import NcctAssessmentPanel from '$lib/features/ncct/components/ncct-assessment-panel.svelte';
  import NcctCredentialPanel from '$lib/features/ncct/components/ncct-credential-panel.svelte';
  import NcctEmploymentPanel from '$lib/features/ncct/components/ncct-employment-panel.svelte';
  import NcctRecruiterPanel from '$lib/features/ncct/components/ncct-recruiter-panel.svelte';
  import NcctCareerPanel from '$lib/features/ncct/components/ncct-career-panel.svelte';
  import NcctReportPanel from '$lib/features/ncct/components/ncct-report-panel.svelte';
  import NcctOperationsPanel from '$lib/features/ncct/components/ncct-operations-panel.svelte';
  import NcctProgressPanel from '$lib/features/ncct/components/ncct-progress-panel.svelte';
  import NcctDirectoryPanel from '$lib/features/ncct/components/ncct-directory-panel.svelte';
  import NcctAuditPanel from '$lib/features/ncct/components/ncct-audit-panel.svelte';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import UsersIcon from '@lucide/svelte/icons/users';
  import * as Page from '@cio/ui/base/page';
  import { Badge } from '@cio/ui/base/badge';

  const { data } = $props();
  const serverOverview = $derived(data.overview);
  let cachedOverview = $state<typeof data.overview>(null);
  const overview = $derived(serverOverview ?? cachedOverview);
  const summary = $derived(overview?.summary);
  const firstInstitution = $derived(overview?.institutions[0]);

  let syncDeviceId = $state<string | null>(null);
  let pendingSync = $state(0);
  let isOnline = $state(true);
  let syncMessage = $state('Offline centre sync is ready to configure.');
  let lastSyncAt = $state<string | null>(null);
  let cacheMessage = $state('No encrypted workspace snapshot saved yet.');
  let packMessage = $state('No offline programme pack cached yet.');
  let offlinePackVersion = $state(0);
  let syncQueue: ReturnType<typeof createNcctOfflineQueue> | null = null;
  let decisionId = $state<string | null>(null);
  let decisionNotes = $state<Record<string, string>>({});
  let actionMessage = $state('');

  async function decideNomination(nominationId: string, status: 'APPROVED' | 'REJECTED' | 'WAITLISTED') {
    decisionId = nominationId;
    actionMessage = '';
    try {
      const response = await classroomio.ncct.nominations[':nominationId'].decision.$post({
        param: { nominationId },
        json: { status, decisionNote: decisionNotes[nominationId]?.trim() || undefined }
      });
      if (!response.ok) {
        actionMessage = 'The nomination decision could not be saved.';
        return;
      }
      await invalidateAll();
    } catch {
      actionMessage = 'The nomination decision could not be saved.';
    } finally {
      decisionId = null;
    }
  }

  function createQueue(deviceId: string) {
    syncQueue = createNcctOfflineQueue(deviceId, async (events: NcctQueuedEvent[]) => {
      try {
        const response = await classroomio.ncct['sync-devices'][':deviceId'].events.$post({
          param: { deviceId },
          json: { events }
        });
        const body = (await response.json().catch(() => ({}))) as {
          data?: { acknowledgedEventIds?: string[]; conflicts?: number };
        };
        const acknowledgedEventIds = body.data?.acknowledgedEventIds ?? [];
        const conflicts = body.data?.conflicts ?? 0;
        if (conflicts > 0) {
          syncMessage = `${conflicts} queued event${conflicts === 1 ? '' : 's'} conflicted and remain queued for review.`;
        }
        return { ok: response.ok, acknowledgedEventIds };
      } catch {
        return false;
      }
    });
    pendingSync = syncQueue.pendingCount();
  }

  function queueOfflineEvent(event: NcctQueuedEvent) {
    if (!syncQueue) {
      syncMessage = 'Register this centre PC before queuing offline actions.';
      return false;
    }
    syncQueue.enqueue(event);
    pendingSync = syncQueue.pendingCount();
    syncMessage = 'The action is queued for the next successful sync.';
    return true;
  }

  async function flushSync() {
    if (!syncQueue || !isOnline) return;
    const sent = await syncQueue.flush();
    pendingSync = syncQueue.pendingCount();
    if (sent > 0) {
      lastSyncAt = new Date().toISOString();
      localStorage.setItem(`ncct-sync-last:${data.orgName}`, lastSyncAt);
      syncMessage = `${sent} queued event${sent === 1 ? '' : 's'} synchronized.`;
    }
  }

  async function registerSyncDevice() {
    if (!firstInstitution) {
      syncMessage = 'Register an institution before enabling offline sync.';
      return;
    }

    try {
      const response = await classroomio.ncct['sync-devices'].$post({
        json: {
          institutionId: firstInstitution.id,
          name: `Centre PC ${navigator.platform || 'device'}`
        }
      });
      if (!response.ok) {
        syncMessage = 'The centre device could not be registered.';
        return;
      }

      const result = (await response.json()) as { data?: { id?: string } };
      const deviceId = result.data?.id;
      if (!deviceId) {
        syncMessage = 'The centre device response was incomplete.';
        return;
      }

      syncDeviceId = deviceId;
      localStorage.setItem(`ncct-sync-device:${data.orgName}`, deviceId);
      createQueue(deviceId);
      syncMessage = 'This centre PC is registered for offline sync.';
    } catch {
      syncMessage = 'The centre device could not be registered.';
    }
  }

  async function toggleSyncDevice(deviceId: string, active: boolean) {
    syncMessage = active ? 'Deactivating centre PC…' : 'Activating centre PC…';
    try {
      const response = await classroomio.ncct['sync-devices'][':deviceId'].$patch({
        param: { deviceId },
        json: { active: !active }
      });
      if (!response.ok) {
        syncMessage = 'The centre PC status could not be updated.';
        return;
      }
      await invalidateAll();
      syncMessage = active ? 'The centre PC was deactivated.' : 'The centre PC was activated.';
    } catch {
      syncMessage = 'The centre PC status could not be updated.';
    }
  }

  async function saveOfflineSnapshot() {
    if (!overview) return;
    try {
      const result = await saveNcctOfflineSnapshot(`overview:${data.orgName}`, overview);
      cacheMessage = `Encrypted workspace snapshot saved ${new Date(result.savedAt).toLocaleTimeString()}.`;
    } catch {
      cacheMessage = 'The encrypted workspace snapshot could not be saved on this device.';
    }
  }

  async function clearOfflineSnapshot() {
    try {
      await clearNcctOfflineSnapshot(`overview:${data.orgName}`);
      cacheMessage = 'The local workspace snapshot was cleared.';
    } catch {
      cacheMessage = 'The local workspace snapshot could not be cleared.';
    }
  }

  async function downloadOfflinePack(programmeId: string) {
    if (!isOnline) {
      packMessage = 'Reconnect before caching a programme pack.';
      return;
    }

    packMessage = 'Preparing the offline programme pack…';
    try {
      const response = await classroomio.ncct['offline-packs'][':programmeId'].$get({
        param: { programmeId }
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { generatedAt?: string };
        error?: string;
      };
      if (!response.ok || !body.data) {
        packMessage = body.error ?? 'The offline programme pack could not be prepared.';
        return;
      }

      const result = await saveNcctOfflineSnapshot(`pack:${data.orgName}:${programmeId}`, body.data);
      offlinePackVersion += 1;
      packMessage = `Offline programme pack cached ${new Date(result.savedAt).toLocaleTimeString()}.`;
    } catch {
      packMessage = 'The offline programme pack could not be prepared.';
    }
  }

  onMount(() => {
    isOnline = navigator.onLine;
    const storedDeviceId = localStorage.getItem(`ncct-sync-device:${data.orgName}`);
    lastSyncAt = localStorage.getItem(`ncct-sync-last:${data.orgName}`);
    if (storedDeviceId) {
      syncDeviceId = storedDeviceId;
      createQueue(storedDeviceId);
      void flushSync();
    }
    if (serverOverview) {
      void saveOfflineSnapshot();
    } else {
      void readNcctOfflineSnapshot<typeof data.overview>(`overview:${data.orgName}`)
        .then((cached) => {
          if (cached) {
            cachedOverview = cached.value;
            cacheMessage = `Showing the encrypted snapshot saved ${new Date(cached.savedAt).toLocaleTimeString()}.`;
          }
        })
        .catch(() => {
          cacheMessage = 'No readable offline workspace snapshot is available.';
        });
    }

    const handleOnline = () => {
      isOnline = true;
      void flushSync();
    };
    const handleOffline = () => {
      isOnline = false;
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

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
          {#if actionMessage}
            <div class="ui:bg-destructive/10 ui:text-destructive rounded-lg border p-3 text-sm">{actionMessage}</div>
          {/if}

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

          <NcctSetupPanel
            institutions={overview.institutions}
            trainees={overview.trainees}
            institutionMembers={overview.institutionMembers}
            institutionMemberCandidates={overview.institutionMemberCandidates}
          />
          <NcctProgrammePanel
            institutions={overview.institutions}
            institutionMembers={overview.institutionMembers}
            programmes={overview.programmes}
            batches={overview.batches}
            enrollments={overview.enrollments}
            programmeSteps={overview.programmeSteps}
            courses={data.courses}
            onDownloadPack={downloadOfflinePack}
          />
          <NcctOfflinePackPanel
            orgName={data.orgName}
            programmes={overview.programmes}
            refreshToken={offlinePackVersion}
          />
          <NcctNominationPanel
            trainees={overview.trainees}
            batches={overview.batches}
            offline={!isOnline}
            onQueueEvent={queueOfflineEvent}
          />
          <NcctAssessmentPanel
            trainees={overview.trainees}
            batches={overview.batches}
            assessments={overview.assessments}
            institutionMembers={overview.institutionMembers}
          />
          <NcctCredentialPanel
            trainees={overview.trainees}
            programmes={overview.programmes}
            batches={overview.batches}
            credentials={overview.credentials}
          />
          <NcctRecruiterPanel jobs={overview.jobs} applications={overview.applications} />
          <NcctEmploymentPanel
            jobs={overview.jobs}
            trainees={overview.trainees}
            applications={overview.applications}
            applicationEvents={overview.applicationEvents}
          />
          <NcctCareerPanel trainees={overview.trainees} />
          <NcctReportPanel report={overview.reports} />
          <NcctOperationsPanel
            institutions={overview.institutions}
            trainees={overview.trainees}
            batches={overview.batches}
            sessions={overview.sessions}
            resources={overview.resources}
            resourceBookings={overview.resourceBookings}
            logistics={overview.logistics}
            institutionMembers={overview.institutionMembers}
          />
          <NcctProgressPanel
            enrollments={overview.enrollments}
            courses={data.courses}
            offline={!isOnline}
            onQueueEvent={queueOfflineEvent}
          />
          <NcctDirectoryPanel institutions={overview.institutions} />
          <NcctAuditPanel events={overview.auditEvents} />

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex items-start gap-3">
                  <div class="ui:bg-muted rounded-lg p-2">
                    <WifiOffIcon class="ui:text-muted-foreground size-5" />
                  </div>
                  <div>
                    <h2 class="font-semibold">Offline centre sync</h2>
                    <p class="ui:text-muted-foreground mt-1 text-sm">
                      Keep centre activity queued until connectivity returns.
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {#if syncDeviceId}
                    <Button variant="outline" size="sm" onclick={() => void flushSync()} disabled={!isOnline}>
                      <RefreshCwIcon class="mr-2 size-4" />
                      Sync now
                    </Button>
                  {:else}
                    <Button size="sm" onclick={() => void registerSyncDevice()}>Register this PC</Button>
                  {/if}
                </div>
              </div>
              <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>{isOnline ? 'Online' : 'Offline'}</span>
                <span>{pendingSync} pending event{pendingSync === 1 ? '' : 's'}</span>
                <span>{lastSyncAt ? `Last sync ${new Date(lastSyncAt).toLocaleString()}` : 'Never synchronized'}</span>
                <span>{syncMessage}</span>
              </div>
              {#if overview?.syncDevices?.length}
                <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {#each overview.syncDevices as device}
                    <div class="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium">{device.name}</p>
                        <p class="ui:text-muted-foreground mt-1 text-xs">
                          {device.active ? 'Active' : 'Deactivated'} · {device.lastSeenAt
                            ? `Seen ${new Date(device.lastSeenAt).toLocaleString()}`
                            : 'Not yet synchronized'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onclick={() => void toggleSyncDevice(device.id, device.active)}
                      >
                        {device.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  {/each}
                </div>
              {/if}
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onclick={() => void saveOfflineSnapshot()}
                  >Save encrypted snapshot</Button
                >
                <Button variant="ghost" size="sm" onclick={() => void clearOfflineSnapshot()}
                  >Clear local snapshot</Button
                >
                <span class="ui:text-muted-foreground text-xs">{cacheMessage}</span>
              </div>
              <p class="ui:text-muted-foreground mt-2 text-xs">{packMessage}</p>
            </section>

            <section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold">Batch enrolment roster</h2>
                  <p class="ui:text-muted-foreground mt-1 text-sm">
                    Approved nominations become enrolled trainees automatically.
                  </p>
                </div>
                <Badge variant="secondary">{overview.enrollments.length}</Badge>
              </div>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {#each overview.enrollments.slice(0, 9) as row}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start justify-between gap-3">
                      <p class="font-medium">{row.trainee.traineeNumber}</p>
                      <Badge variant={row.enrollment.status === 'COMPLETED' ? 'default' : 'outline'}>
                        {row.enrollment.status}
                      </Badge>
                    </div>
                    <p class="ui:text-muted-foreground mt-1 text-sm">{row.programme.title} · {row.batch.name}</p>
                    <p class="ui:text-muted-foreground mt-1 text-xs">{row.trainee.district}, {row.trainee.state}</p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No trainees have been enrolled yet.</p>
                {/each}
              </div>
            </section>

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

            <section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold">Nomination approvals</h2>
                  <p class="ui:text-muted-foreground mt-1 text-sm">
                    Review trainee nominations against each batch capacity.
                  </p>
                </div>
                <Badge variant="secondary">{overview.nominations.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.nominations.slice(0, 8) as row}
                  <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <p class="font-medium">{row.trainee.traineeNumber} · {row.programme.title}</p>
                      <p class="ui:text-muted-foreground text-sm">
                        {row.institution.name} · {row.batch.name} · {row.trainee.district}, {row.trainee.state}
                      </p>
                      {#if row.nomination.decisionNote}
                        <p class="ui:text-muted-foreground mt-2 text-xs">
                          Decision note: {row.nomination.decisionNote}
                        </p>
                      {/if}
                    </div>
                    <div class="grid min-w-64 gap-2 sm:flex sm:items-center">
                      <Badge variant={row.nomination.status === 'APPROVED' ? 'default' : 'outline'}>
                        {row.nomination.status}
                      </Badge>
                      {#if row.nomination.status === 'PENDING'}
                        <textarea
                          class="ui:bg-background min-h-9 rounded-md border px-3 py-2 text-sm sm:w-56"
                          rows="1"
                          maxlength="1000"
                          placeholder="Decision note (optional)"
                          bind:value={decisionNotes[row.nomination.id]}
                        ></textarea>
                        <Button
                          size="sm"
                          disabled={decisionId === row.nomination.id}
                          onclick={() => void decideNomination(row.nomination.id, 'APPROVED')}>Approve</Button
                        >
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={decisionId === row.nomination.id}
                          onclick={() => void decideNomination(row.nomination.id, 'REJECTED')}>Reject</Button
                        >
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={decisionId === row.nomination.id}
                          onclick={() => void decideNomination(row.nomination.id, 'WAITLISTED')}>Waitlist</Button
                        >
                      {/if}
                    </div>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No nominations have been submitted.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Credential registry</h2>
                <Badge variant="secondary">{overview.credentials.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.credentials.slice(0, 6) as row}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start justify-between gap-3">
                      <p class="font-medium">{row.credential.certificateNumber}</p>
                      <Badge variant={row.credential.revokedAt ? 'destructive' : 'default'}>
                        {row.credential.revokedAt ? 'REVOKED' : 'VALID'}
                      </Badge>
                    </div>
                    <p class="ui:text-muted-foreground mt-1 text-sm">
                      {row.trainee.traineeNumber} · {row.programme.title}
                    </p>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No credentials have been issued.</p>
                {/each}
              </div>
            </section>

            <section class="ui:bg-card rounded-xl border p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">Job applications</h2>
                <Badge variant="secondary">{overview.applications.length}</Badge>
              </div>
              <div class="space-y-3">
                {#each overview.applications.slice(0, 6) as row}
                  <div class="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <p class="font-medium">{row.job.title}</p>
                      <p class="ui:text-muted-foreground text-sm">
                        {row.trainee.traineeNumber} · {row.job.employerName} · {row.job.location}
                      </p>
                    </div>
                    <Badge variant="outline">{row.application.status}</Badge>
                  </div>
                {:else}
                  <p class="ui:text-muted-foreground text-sm">No job applications have been submitted.</p>
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
