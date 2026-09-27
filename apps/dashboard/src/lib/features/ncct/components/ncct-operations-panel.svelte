<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Institution = { id: string; name: string; code: string };
  type Trainee = { id: string; institutionId: string; traineeNumber: string; district: string; state: string };
  type Batch = { id: string; institutionId: string; name: string; startsOn: string; endsOn: string; capacity: number };
  type Session = {
    id: string;
    batchId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    room: string | null;
    instructorProfileId: string | null;
  };
  type ResourceType = 'ROOM' | 'HOSTEL' | 'MEAL' | 'TRANSPORT' | 'EQUIPMENT';
  type Resource = {
    id: string;
    institutionId: string;
    name: string;
    type: ResourceType;
    capacity: number;
    active: boolean;
  };
  type Logistics = {
    logistics: {
      mealRequired: boolean;
      transportRequired: boolean;
      notes: string | null;
    };
    batch: { name: string };
    trainee: { traineeNumber: string };
    resource: { name: string } | null;
  };
  type ResourceBooking = {
    booking: { startsAt: string; endsAt: string; quantity: number; notes: string | null };
    resource: { name: string; type: string };
    session: { title: string };
    batch: { name: string };
  };
  type InstitutionMember = {
    member: { institutionId: string; profileId: string; role: string; active: boolean };
    profile: { fullname: string };
  };
  type Props = {
    institutions: Institution[];
    trainees: Trainee[];
    batches: Batch[];
    sessions: Session[];
    resources: Resource[];
    resourceBookings: ResourceBooking[];
    logistics: Logistics[];
    institutionMembers: InstitutionMember[];
  };

  let { institutions, trainees, batches, sessions, resources, resourceBookings, logistics, institutionMembers }: Props =
    $props();
  let sessionOpen = $state(false);
  let bookingOpen = $state(false);
  let resourceOpen = $state(false);
  let logisticsOpen = $state(false);
  let busy = $state(false);
  let message = $state('');

  let sessionBatchId = $state('');
  let sessionTitle = $state('');
  let sessionStartsAt = $state('');
  let sessionEndsAt = $state('');
  let sessionRoom = $state('');
  let sessionNotes = $state('');
  let sessionInstructorProfileId = $state('');

  let bookingSessionId = $state('');
  let bookingResourceId = $state('');
  let bookingStartsAt = $state('');
  let bookingEndsAt = $state('');
  let bookingQuantity = $state('1');
  let bookingNotes = $state('');

  let eligibleResources = $derived(
    resources.filter((resource) => {
      const session = sessions.find((item) => item.id === bookingSessionId);
      const institutionId = batches.find((batch) => batch.id === session?.batchId)?.institutionId;
      return resource.active && (!institutionId || resource.institutionId === institutionId);
    })
  );

  let resourceInstitutionId = $state('');
  let resourceType = $state('ROOM');
  let resourceName = $state('');
  let resourceCapacity = $state('30');
  let resourceFilter = $state<'ALL' | ResourceType>('ALL');
  let visibleResources = $derived(
    resourceFilter === 'ALL' ? resources : resources.filter((resource) => resource.type === resourceFilter)
  );

  let logisticsBatchId = $state('');
  let logisticsTraineeId = $state('');
  let logisticsHostelId = $state('');
  let mealRequired = $state(false);
  let transportRequired = $state(false);
  let logisticsNotes = $state('');

  function resetSession() {
    sessionBatchId = batches[0]?.id ?? '';
    sessionInstructorProfileId = instructorsForBatch(sessionBatchId)[0]?.member.profileId ?? '';
    sessionTitle = '';
    sessionStartsAt = '';
    sessionEndsAt = '';
    sessionRoom = '';
    sessionNotes = '';
    message = '';
  }

  function instructorsForBatch(batchId: string) {
    const institutionId = batches.find((batch) => batch.id === batchId)?.institutionId;
    return institutionMembers.filter(
      ({ member }) => member.institutionId === institutionId && member.active && member.role === 'INSTRUCTOR'
    );
  }

  function updateSessionBatch(batchId: string) {
    sessionBatchId = batchId;
    sessionInstructorProfileId = instructorsForBatch(batchId)[0]?.member.profileId ?? '';
  }

  function instructorLabel(profileId: string | null) {
    return institutionMembers.find(({ member }) => member.profileId === profileId)?.profile.fullname ?? 'Unassigned';
  }

  function resetResource() {
    resourceInstitutionId = institutions[0]?.id ?? '';
    resourceType = 'ROOM';
    resourceName = '';
    resourceCapacity = '30';
    message = '';
  }

  function toDatetimeLocal(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }

  function resetBooking() {
    const session = sessions[0];
    bookingSessionId = session?.id ?? '';
    const institutionId = batches.find((batch) => batch.id === session?.batchId)?.institutionId;
    bookingResourceId =
      resources.find((resource) => !institutionId || resource.institutionId === institutionId)?.id ?? '';
    bookingStartsAt = session ? toDatetimeLocal(session.startsAt) : '';
    bookingEndsAt = session ? toDatetimeLocal(session.endsAt) : '';
    bookingQuantity = '1';
    bookingNotes = '';
    message = '';
  }

  function updateBookingSession(sessionId: string) {
    bookingSessionId = sessionId;
    const session = sessions.find((item) => item.id === sessionId);
    const institutionId = batches.find((batch) => batch.id === session?.batchId)?.institutionId;
    bookingResourceId =
      resources.find((resource) => !institutionId || resource.institutionId === institutionId)?.id ?? '';
    if (session) {
      bookingStartsAt = toDatetimeLocal(session.startsAt);
      bookingEndsAt = toDatetimeLocal(session.endsAt);
    }
  }

  function resetLogistics() {
    logisticsBatchId = batches[0]?.id ?? '';
    logisticsTraineeId = traineesForBatch(logisticsBatchId)[0]?.id ?? '';
    logisticsHostelId = hostelsForBatch(logisticsBatchId)[0]?.id ?? '';
    mealRequired = false;
    transportRequired = false;
    logisticsNotes = '';
    message = '';
  }

  function traineesForBatch(batchId: string) {
    const institutionId = batches.find((batch) => batch.id === batchId)?.institutionId;
    return trainees.filter((trainee) => !institutionId || traineeInstitutionId(trainee.id) === institutionId);
  }

  function traineeInstitutionId(traineeId: string) {
    return trainees.find((trainee) => trainee.id === traineeId)?.institutionId;
  }

  function hostelsForBatch(batchId: string) {
    const institutionId = batches.find((batch) => batch.id === batchId)?.institutionId;
    return resources.filter(
      (resource) =>
        resource.active && resource.type === 'HOSTEL' && (!institutionId || resource.institutionId === institutionId)
    );
  }

  function updateLogisticsBatch(batchId: string) {
    logisticsBatchId = batchId;
    logisticsTraineeId = traineesForBatch(batchId)[0]?.id ?? '';
    logisticsHostelId = hostelsForBatch(batchId)[0]?.id ?? '';
  }

  async function save(action: () => Promise<Response>, successMessage: string) {
    busy = true;
    message = '';
    try {
      const response = await action();
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        message = body.error ?? 'The operations update could not be saved.';
        return false;
      }
      message = successMessage;
      await invalidateAll();
      return true;
    } catch {
      message = 'The operations update could not be saved.';
      return false;
    } finally {
      busy = false;
    }
  }

  async function scheduleSession() {
    const saved = await save(
      () =>
        classroomio.ncct.sessions.$post({
          json: {
            batchId: sessionBatchId,
            title: sessionTitle.trim(),
            startsAt: new Date(sessionStartsAt).toISOString(),
            endsAt: new Date(sessionEndsAt).toISOString(),
            room: sessionRoom.trim() || undefined,
            instructorProfileId: sessionInstructorProfileId || null,
            notes: sessionNotes.trim() || undefined
          }
        }),
      'Session scheduled.'
    );
    if (saved) sessionOpen = false;
  }

  async function registerResource() {
    const saved = await save(
      () =>
        classroomio.ncct.resources.$post({
          json: {
            institutionId: resourceInstitutionId,
            type: resourceType as 'ROOM' | 'HOSTEL' | 'MEAL' | 'TRANSPORT' | 'EQUIPMENT',
            name: resourceName.trim(),
            capacity: Number(resourceCapacity)
          }
        }),
      'Centre resource registered.'
    );
    if (saved) resourceOpen = false;
  }

  async function toggleResource(resource: Resource) {
    await save(
      () =>
        classroomio.ncct.resources[':resourceId'].$patch({
          param: { resourceId: resource.id },
          json: { active: !resource.active }
        }),
      resource.active ? 'Resource marked inactive.' : 'Resource activated.'
    );
  }

  async function bookResource() {
    const saved = await save(
      () =>
        classroomio.ncct['resource-bookings'].$post({
          json: {
            sessionId: bookingSessionId,
            resourceId: bookingResourceId,
            startsAt: new Date(bookingStartsAt).toISOString(),
            endsAt: new Date(bookingEndsAt).toISOString(),
            quantity: Number(bookingQuantity),
            notes: bookingNotes.trim() || undefined
          }
        }),
      'Resource booked.'
    );
    if (saved) bookingOpen = false;
  }

  async function saveLogistics() {
    const saved = await save(
      () =>
        classroomio.ncct['trainee-logistics'].$post({
          json: {
            batchId: logisticsBatchId,
            traineeId: logisticsTraineeId,
            hostelResourceId: logisticsHostelId || null,
            mealRequired,
            transportRequired,
            notes: logisticsNotes.trim() || undefined
          }
        }),
      'Trainee logistics saved.'
    );
    if (saved) logisticsOpen = false;
  }
</script>

<section class="ui:bg-card rounded-xl border p-5 xl:col-span-2">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Centre timetable and logistics</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Schedule sessions, register centre resources, and record trainee travel or hostel needs.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={batches.length === 0}
        onclick={() => {
          resetSession();
          sessionOpen = true;
        }}>Schedule session</Button
      >
      <Button
        variant="outline"
        size="sm"
        disabled={sessions.length === 0 || resources.length === 0}
        onclick={() => {
          resetBooking();
          bookingOpen = true;
        }}>Book resource</Button
      >
      <Button
        variant="outline"
        size="sm"
        disabled={institutions.length === 0}
        onclick={() => {
          resetResource();
          resourceOpen = true;
        }}>Register resource</Button
      >
      <Button
        size="sm"
        disabled={batches.length === 0 || trainees.length === 0}
        onclick={() => {
          resetLogistics();
          logisticsOpen = true;
        }}>Plan trainee logistics</Button
      >
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{resources.length} registered resources</Badge>
    <span>Centre operations remain linked to the batch and trainee records.</span>
  </div>
  <div class="mt-5 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-medium">Upcoming timetable</h3>
      <Badge variant="secondary">{sessions.length}</Badge>
    </div>
    {#each sessions.slice(0, 8) as session}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <div>
          <p class="font-medium">{session.title}</p>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {new Date(session.startsAt).toLocaleString()} · {instructorLabel(session.instructorProfileId)}
          </p>
        </div>
        <Badge variant="outline">{session.room ?? 'Room to be assigned'}</Badge>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">No sessions have been scheduled yet.</p>
    {/each}
  </div>
  <div class="mt-5 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-medium">Resource inventory</h3>
      <div class="flex items-center gap-2">
        <select class="ui:bg-background h-8 rounded-md border px-2 text-xs" bind:value={resourceFilter}>
          <option value="ALL">All types</option>
          <option value="ROOM">Rooms</option>
          <option value="HOSTEL">Hostels</option>
          <option value="MEAL">Meals</option>
          <option value="TRANSPORT">Transport</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>
        <Badge variant="secondary">{visibleResources.length}</Badge>
      </div>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      {#each visibleResources.slice(0, 8) as resource}
        <div class="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div>
            <p class="font-medium">{resource.name}</p>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              {resource.type} · {resource.active ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline">Capacity {resource.capacity}</Badge>
            <Button variant="ghost" size="sm" disabled={busy} onclick={() => void toggleResource(resource)}>
              {resource.active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      {:else}
        <p class="ui:text-muted-foreground text-sm">No centre resources have been registered yet.</p>
      {/each}
    </div>
  </div>
  <div class="mt-5 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-medium">Trainee logistics</h3>
      <Badge variant="secondary">{logistics.length}</Badge>
    </div>
    {#each logistics.slice(0, 8) as item}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <div>
          <p class="font-medium">{item.trainee.traineeNumber} · {item.batch.name}</p>
          {#if item.logistics.notes}<p class="ui:text-muted-foreground mt-1 text-xs">{item.logistics.notes}</p>{/if}
        </div>
        <div class="flex flex-wrap gap-1">
          {#if item.resource}<Badge variant="outline">{item.resource.name}</Badge>{/if}
          {#if item.logistics.mealRequired}<Badge variant="secondary">Meal</Badge>{/if}
          {#if item.logistics.transportRequired}<Badge variant="secondary">Transport</Badge>{/if}
        </div>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">No trainee logistics plans have been recorded yet.</p>
    {/each}
  </div>
  <div class="mt-5 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-medium">Resource bookings</h3>
      <Badge variant="secondary">{resourceBookings.length}</Badge>
    </div>
    {#each resourceBookings.slice(0, 8) as item}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <div>
          <p class="font-medium">{item.resource.name} · {item.session.title}</p>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {item.batch.name} · {new Date(item.booking.startsAt).toLocaleString()} to {new Date(
              item.booking.endsAt
            ).toLocaleTimeString()}
          </p>
        </div>
        <Badge variant="outline">Qty {item.booking.quantity}</Badge>
      </div>
    {:else}
      <p class="ui:text-muted-foreground text-sm">No resource bookings have been recorded yet.</p>
    {/each}
  </div>
</section>

<Dialog.Root bind:open={bookingOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Book centre resource</Dialog.Title>
      <Dialog.Description
        >Allocate a room, hostel, vehicle, meal service, or equipment to a scheduled session.</Dialog.Description
      >
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Session
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={bookingSessionId}
          onchange={(event) => updateBookingSession(event.currentTarget.value)}
        >
          {#each sessions as session}<option value={session.id}
              >{session.title} · {new Date(session.startsAt).toLocaleString()}</option
            >{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Resource
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={bookingResourceId}>
          {#each eligibleResources as resource}<option value={resource.id}
              >{resource.name} · capacity {resource.capacity}</option
            >{/each}
        </select>
      </label>
      <InputField label="Quantity" type="number" min="1" bind:value={bookingQuantity} />
      <InputField label="Starts" type="datetime-local" bind:value={bookingStartsAt} />
      <InputField label="Ends" type="datetime-local" bind:value={bookingEndsAt} />
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Notes
        <Textarea rows={3} bind:value={bookingNotes} />
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (bookingOpen = false)}>Cancel</Button>
      <Button
        disabled={busy ||
          !bookingSessionId ||
          !bookingResourceId ||
          !bookingStartsAt ||
          !bookingEndsAt ||
          Number(bookingQuantity) < 1}
        onclick={() => void bookResource()}>Book resource</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={sessionOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Schedule session</Dialog.Title>
      <Dialog.Description>Add a timetable entry to a training batch.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Batch
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={sessionBatchId}
          onchange={(event) => updateSessionBatch(event.currentTarget.value)}
        >
          {#each batches as batch}<option value={batch.id}>{batch.name} · {batch.startsOn} to {batch.endsOn}</option
            >{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Instructor
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={sessionInstructorProfileId}>
          <option value="">No instructor assigned</option>
          {#each instructorsForBatch(sessionBatchId) as instructor}
            <option value={instructor.member.profileId}>{instructor.profile.fullname}</option>
          {/each}
        </select>
        <span class="ui:text-muted-foreground text-xs">Only active instructors at the batch centre are listed.</span>
      </label>
      <InputField label="Session title" bind:value={sessionTitle} />
      <InputField label="Room" bind:value={sessionRoom} />
      <InputField label="Starts" type="datetime-local" bind:value={sessionStartsAt} />
      <InputField label="Ends" type="datetime-local" bind:value={sessionEndsAt} />
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Notes
        <Textarea rows={3} bind:value={sessionNotes} />
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (sessionOpen = false)}>Cancel</Button>
      <Button
        disabled={busy || !sessionBatchId || !sessionTitle.trim() || !sessionStartsAt || !sessionEndsAt}
        onclick={() => void scheduleSession()}>Schedule session</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={resourceOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Register centre resource</Dialog.Title>
      <Dialog.Description
        >Record rooms, hostels, meals, transport, or equipment available to the centre.</Dialog.Description
      >
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Institution
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={resourceInstitutionId}>
          {#each institutions as institution}<option value={institution.id}
              >{institution.name} ({institution.code})</option
            >{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Resource type
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={resourceType}>
          <option value="ROOM">Room</option><option value="HOSTEL">Hostel</option><option value="MEAL">Meal</option>
          <option value="TRANSPORT">Transport</option><option value="EQUIPMENT">Equipment</option>
        </select>
      </label>
      <InputField label="Name" bind:value={resourceName} />
      <InputField label="Capacity" type="number" min="1" bind:value={resourceCapacity} />
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (resourceOpen = false)}>Cancel</Button>
      <Button
        disabled={busy || !resourceInstitutionId || !resourceName.trim() || Number(resourceCapacity) < 1}
        onclick={() => void registerResource()}>Register resource</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={logisticsOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Plan trainee logistics</Dialog.Title>
      <Dialog.Description>Capture the support a trainee needs to attend the assigned batch.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Batch
        <select
          class="ui:bg-background h-9 rounded-md border px-3"
          value={logisticsBatchId}
          onchange={(event) => updateLogisticsBatch(event.currentTarget.value)}
        >
          {#each batches as batch}<option value={batch.id}>{batch.name}</option>{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Trainee
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={logisticsTraineeId}>
          {#each traineesForBatch(logisticsBatchId) as trainee}<option value={trainee.id}
              >{trainee.traineeNumber} · {trainee.district}, {trainee.state}</option
            >{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Hostel resource (optional)
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={logisticsHostelId}>
          <option value="">No hostel assigned</option>
          {#each hostelsForBatch(logisticsBatchId) as resource}<option value={resource.id}
              >{resource.name} · capacity {resource.capacity}</option
            >{/each}
        </select>
      </label>
      <div class="flex flex-wrap gap-5 text-sm">
        <label class="flex items-center gap-2"
          ><input type="checkbox" bind:checked={mealRequired} /> Meal support required</label
        >
        <label class="flex items-center gap-2"
          ><input type="checkbox" bind:checked={transportRequired} /> Transport required</label
        >
      </div>
      <label class="grid gap-2 text-sm font-medium">
        Notes
        <Textarea rows={3} bind:value={logisticsNotes} />
      </label>
    </div>
    {#if message}<p class="ui:text-destructive text-sm">{message}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (logisticsOpen = false)}>Cancel</Button>
      <Button disabled={busy || !logisticsBatchId || !logisticsTraineeId} onclick={() => void saveLogistics()}
        >Save logistics</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
