<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Badge } from '@cio/ui/base/badge';
  import { classroomio } from '$lib/utils/services/api';

  type Institution = {
    id: string;
    code: string;
    name: string;
    district: string;
    state: string;
    type: string;
    contactEmail: string | null;
  };

  type Trainee = {
    id: string;
    institutionId: string;
    traineeNumber: string;
    cooperativeName: string | null;
    district: string;
    state: string;
    phone: string | null;
    skills: string[];
    directoryVisible: boolean;
  };

  type Props = {
    institutions: Institution[];
    trainees: Trainee[];
    institutionMembers: InstitutionMember[];
    institutionMemberCandidates: InstitutionMemberCandidate[];
  };

  type InstitutionMember = {
    member: { id: string; institutionId: string; profileId: string; role: string; active: boolean };
    institution: { id: string; name: string; code: string };
    profile: { id: string; fullname: string; email: string | null };
  };

  type InstitutionMemberCandidate = {
    profileId: string;
    fullname: string;
    email: string;
    roleId: number;
  };

  let { institutions, trainees, institutionMembers, institutionMemberCandidates }: Props = $props();
  const canManageMembers = $derived(institutionMemberCandidates.length > 0);
  let institutionOpen = $state(false);
  let editingInstitutionId = $state<string | null>(null);
  let traineeOpen = $state(false);
  let traineeEditOpen = $state(false);
  let memberOpen = $state(false);
  let institutionBusy = $state(false);
  let traineeBusy = $state(false);
  let memberBusy = $state(false);
  let formMessage = $state('');

  let institutionCode = $state('');
  let institutionName = $state('');
  let institutionType = $state('ICM');
  let institutionDistrict = $state('');
  let institutionState = $state('');
  let institutionEmail = $state('');

  let traineeInstitutionId = $state('');
  let traineeNumber = $state('');
  let traineeCooperative = $state('');
  let traineeDistrict = $state('');
  let traineeState = $state('');
  let traineePhone = $state('');
  let traineeSkills = $state('');
  let traineeDirectoryVisible = $state(true);
  let editingTraineeId = $state<string | null>(null);
  let memberInstitutionId = $state('');
  let memberProfileId = $state('');
  let memberRole = $state('COORDINATOR');

  function resetInstitution() {
    editingInstitutionId = null;
    institutionCode = '';
    institutionName = '';
    institutionType = 'ICM';
    institutionDistrict = '';
    institutionState = '';
    institutionEmail = institution.contactEmail ?? '';
    formMessage = '';
  }

  function editInstitution(institution: Institution) {
    editingInstitutionId = institution.id;
    institutionCode = institution.code;
    institutionName = institution.name;
    institutionType = institution.type;
    institutionDistrict = institution.district;
    institutionState = institution.state;
    institutionEmail = '';
    formMessage = '';
    institutionOpen = true;
  }

  function resetTrainee() {
    traineeInstitutionId = institutions[0]?.id ?? '';
    traineeNumber = '';
    traineeCooperative = '';
    traineeDistrict = '';
    traineeState = '';
    traineePhone = '';
    traineeSkills = '';
    traineeDirectoryVisible = true;
    formMessage = '';
  }

  function resetMember() {
    memberInstitutionId = institutions[0]?.id ?? '';
    memberProfileId = '';
    memberRole = 'COORDINATOR';
    formMessage = '';
  }

  function editTrainee(trainee: Trainee) {
    editingTraineeId = trainee.id;
    traineeInstitutionId = trainee.institutionId;
    traineeNumber = trainee.traineeNumber;
    traineeCooperative = trainee.cooperativeName ?? '';
    traineeDistrict = trainee.district;
    traineeState = trainee.state;
    traineePhone = trainee.phone ?? '';
    traineeSkills = trainee.skills.join(', ');
    traineeDirectoryVisible = trainee.directoryVisible;
    formMessage = '';
    traineeEditOpen = true;
  }

  async function saveInstitution() {
    institutionBusy = true;
    formMessage = '';
    try {
      const response = editingInstitutionId
        ? await classroomio.ncct.institutions[':institutionId'].$patch({
            param: { institutionId: editingInstitutionId },
            json: {
              code: institutionCode.trim(),
              name: institutionName.trim(),
              type: institutionType as 'VAMNICOM' | 'RICM' | 'ICM' | 'PACS' | 'SHG' | 'DAIRY' | 'OTHER',
              district: institutionDistrict.trim(),
              state: institutionState.trim(),
              contactEmail: institutionEmail.trim() || null
            }
          })
        : await classroomio.ncct.institutions.$post({
            json: {
              code: institutionCode.trim(),
              name: institutionName.trim(),
              type: institutionType as 'VAMNICOM' | 'RICM' | 'ICM' | 'PACS' | 'SHG' | 'DAIRY' | 'OTHER',
              district: institutionDistrict.trim(),
              state: institutionState.trim(),
              contactEmail: institutionEmail.trim() || undefined
            }
          });
      if (!response.ok) {
        formMessage = editingInstitutionId
          ? 'The institution could not be updated.'
          : 'The institution could not be registered.';
        return;
      }
      institutionOpen = false;
      resetInstitution();
      await invalidateAll();
    } catch {
      formMessage = editingInstitutionId
        ? 'The institution could not be updated.'
        : 'The institution could not be registered.';
    } finally {
      institutionBusy = false;
    }
  }

  async function createTrainee() {
    traineeBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.trainees.$post({
        json: {
          institutionId: traineeInstitutionId,
          traineeNumber: traineeNumber.trim(),
          cooperativeName: traineeCooperative.trim() || undefined,
          district: traineeDistrict.trim(),
          state: traineeState.trim(),
          phone: traineePhone.trim() || undefined,
          skills: traineeSkills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          directoryVisible: traineeDirectoryVisible
        }
      });
      if (!response.ok) {
        formMessage = 'The trainee could not be registered.';
        return;
      }
      traineeOpen = false;
      resetTrainee();
      await invalidateAll();
    } catch {
      formMessage = 'The trainee could not be registered.';
    } finally {
      traineeBusy = false;
    }
  }

  async function updateTrainee() {
    if (!editingTraineeId) return;
    traineeBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.trainees[':traineeId'].$patch({
        param: { traineeId: editingTraineeId },
        json: {
          institutionId: traineeInstitutionId,
          cooperativeName: traineeCooperative.trim() || null,
          district: traineeDistrict.trim(),
          state: traineeState.trim(),
          phone: traineePhone.trim() || null,
          skills: traineeSkills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          directoryVisible: traineeDirectoryVisible
        }
      });
      if (!response.ok) {
        formMessage = 'The trainee profile could not be updated.';
        return;
      }
      traineeEditOpen = false;
      editingTraineeId = null;
      await invalidateAll();
    } catch {
      formMessage = 'The trainee profile could not be updated.';
    } finally {
      traineeBusy = false;
    }
  }

  async function saveMember() {
    memberBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct['institution-members'].$post({
        json: {
          institutionId: memberInstitutionId,
          profileId: memberProfileId.trim(),
          role: memberRole as 'COORDINATOR' | 'INSTRUCTOR' | 'EVALUATOR'
        }
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        formMessage = body.error ?? 'The centre access assignment could not be saved.';
        return;
      }
      memberOpen = false;
      resetMember();
      await invalidateAll();
    } catch {
      formMessage = 'The centre access assignment could not be saved.';
    } finally {
      memberBusy = false;
    }
  }

  async function toggleMember(member: InstitutionMember) {
    try {
      const response = await classroomio.ncct['institution-members'][':memberId'].$patch({
        param: { memberId: member.member.id },
        json: { active: !member.member.active }
      });
      if (response.ok) await invalidateAll();
    } catch {
      formMessage = 'The centre access status could not be updated.';
    }
  }
</script>

<section class="ui:bg-card rounded-xl border p-5">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="font-semibold">Training directory</h2>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        Register centres and cooperative trainees for the next programme.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          resetInstitution();
          institutionOpen = true;
        }}>Register institution</Button
      >
      <Button
        size="sm"
        disabled={institutions.length === 0}
        onclick={() => {
          resetTrainee();
          traineeOpen = true;
        }}>Register trainee</Button
      >
      {#if canManageMembers}
        <Button
          variant="outline"
          size="sm"
          disabled={institutions.length === 0}
          onclick={() => {
            resetMember();
            memberOpen = true;
          }}>Assign centre access</Button
        >
      {/if}
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{institutions.length} institutions</Badge>
    <Badge variant="secondary">{trainees.length} trainees</Badge>
  </div>
  {#if trainees.length > 0}
    <div class="mt-4 space-y-2">
      {#each trainees.slice(0, 5) as trainee}
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <div>
            <p class="font-medium">
              {trainee.traineeNumber}{trainee.cooperativeName ? ` · ${trainee.cooperativeName}` : ''}
            </p>
            <p class="ui:text-muted-foreground">
              {trainee.district}, {trainee.state} · {trainee.skills.join(', ') || 'No skills recorded'}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant={trainee.directoryVisible ? 'secondary' : 'outline'}>
              {trainee.directoryVisible ? 'Directory visible' : 'Private'}
            </Badge>
            <Button size="sm" variant="outline" onclick={() => editTrainee(trainee)}>Edit profile</Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {#if institutions.length > 0}
    <div class="mt-5 border-t pt-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="font-medium">Training institutions</p>
          <p class="ui:text-muted-foreground text-xs">Keep centre location and contact details current.</p>
        </div>
        <Badge variant="secondary">{institutions.length}</Badge>
      </div>
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        {#each institutions.slice(0, 8) as institution}
          <div class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p class="font-medium">{institution.name}</p>
              <p class="ui:text-muted-foreground mt-1 text-xs">
                {institution.code} · {institution.type} · {institution.district}, {institution.state}
              </p>
            </div>
            <Button size="sm" variant="outline" onclick={() => editInstitution(institution)}>Edit</Button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  <div class="mt-5 border-t pt-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="font-medium">Centre access</p>
        <p class="ui:text-muted-foreground text-xs">Assign coordinators, instructors, and evaluators to a centre.</p>
      </div>
      <Badge variant="secondary">{institutionMembers.filter((item) => item.member.active).length} active</Badge>
    </div>
    {#if institutionMembers.length > 0}
      <div class="mt-3 space-y-2">
        {#each institutionMembers.slice(0, 5) as member}
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p class="font-medium">{member.profile.fullname} · {member.member.role}</p>
              <p class="ui:text-muted-foreground">
                {member.institution.name} · {member.profile.email ?? member.member.profileId}
              </p>
            </div>
            {#if canManageMembers}
              <Button size="sm" variant="outline" onclick={() => void toggleMember(member)}>
                {member.member.active ? 'Disable' : 'Enable'}
              </Button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="ui:text-muted-foreground mt-3 text-sm">No centre access assignments yet.</p>
    {/if}
  </div>
</section>

<Dialog.Root bind:open={institutionOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingInstitutionId ? 'Edit institution' : 'Register institution'}</Dialog.Title>
      <Dialog.Description
        >{editingInstitutionId
          ? 'Update the centre profile and location.'
          : 'Add a VAMNICOM, RICM, ICM, or cooperative training centre.'}</Dialog.Description
      >
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <InputField label="Centre code" bind:value={institutionCode} />
      <InputField label="Centre name" bind:value={institutionName} />
      <label class="grid gap-2 text-sm font-medium">
        Type
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={institutionType}>
          <option value="VAMNICOM">VAMNICOM</option>
          <option value="RICM">RICM</option>
          <option value="ICM">ICM</option>
          <option value="PACS">PACS</option>
          <option value="SHG">SHG</option>
          <option value="DAIRY">Dairy cooperative</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <InputField label="District" bind:value={institutionDistrict} />
      <InputField label="State" bind:value={institutionState} />
      <InputField label="Contact email" type="email" bind:value={institutionEmail} />
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (institutionOpen = false)}>Cancel</Button>
      <Button
        disabled={institutionBusy ||
          !institutionCode.trim() ||
          !institutionName.trim() ||
          !institutionDistrict.trim() ||
          !institutionState.trim()}
        onclick={() => void saveInstitution()}>{editingInstitutionId ? 'Save changes' : 'Save institution'}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={traineeEditOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit trainee profile</Dialog.Title>
      <Dialog.Description>Keep the cooperative profile and employer directory visibility up to date.</Dialog.Description
      >
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <InputField label="Trainee number" value={traineeNumber} disabled />
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Institution
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={traineeInstitutionId}>
          {#each institutions as institution}<option value={institution.id}
              >{institution.name} ({institution.code})</option
            >{/each}
        </select>
      </label>
      <InputField label="Cooperative name" bind:value={traineeCooperative} />
      <InputField label="Phone" bind:value={traineePhone} />
      <InputField label="District" bind:value={traineeDistrict} />
      <InputField label="State" bind:value={traineeState} />
      <InputField label="Skills (comma separated)" bind:value={traineeSkills} />
      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" bind:checked={traineeDirectoryVisible} />
        Let employers and administrators find this trainee in the certified directory
      </label>
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (traineeEditOpen = false)}>Cancel</Button>
      <Button
        disabled={traineeBusy || !traineeInstitutionId || !traineeDistrict.trim() || !traineeState.trim()}
        onclick={() => void updateTrainee()}>Save profile</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={memberOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Assign centre access</Dialog.Title>
      <Dialog.Description>Choose an organization team member and assign their NCCT centre role.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      <label class="grid gap-2 text-sm font-medium">
        Institution
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={memberInstitutionId}>
          {#each institutions as institution}<option value={institution.id}
              >{institution.name} ({institution.code})</option
            >{/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Team member
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={memberProfileId}>
          <option value="">Select a team member</option>
          {#each institutionMemberCandidates as candidate}
            <option value={candidate.profileId}>
              {candidate.fullname || candidate.email} · {candidate.email}
            </option>
          {/each}
        </select>
      </label>
      <label class="grid gap-2 text-sm font-medium">
        Role
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={memberRole}>
          <option value="COORDINATOR">Coordinator</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="EVALUATOR">Evaluator</option>
        </select>
      </label>
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (memberOpen = false)}>Cancel</Button>
      <Button disabled={memberBusy || !memberInstitutionId || !memberProfileId.trim()} onclick={() => void saveMember()}
        >Save access</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={traineeOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Register trainee</Dialog.Title>
      <Dialog.Description>Keep the cooperative affiliation and skill profile ready for nominations.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-medium sm:col-span-2">
        Institution
        <select class="ui:bg-background h-9 rounded-md border px-3" bind:value={traineeInstitutionId}>
          {#each institutions as institution}
            <option value={institution.id}>{institution.name} ({institution.code})</option>
          {/each}
        </select>
      </label>
      <InputField label="Trainee number" bind:value={traineeNumber} />
      <InputField label="Cooperative name" bind:value={traineeCooperative} />
      <InputField label="District" bind:value={traineeDistrict} />
      <InputField label="State" bind:value={traineeState} />
      <InputField label="Phone" bind:value={traineePhone} />
      <InputField label="Skills (comma separated)" bind:value={traineeSkills} />
    </div>
    {#if formMessage}<p class="ui:text-destructive text-sm">{formMessage}</p>{/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (traineeOpen = false)}>Cancel</Button>
      <Button
        disabled={traineeBusy ||
          !traineeInstitutionId ||
          !traineeNumber.trim() ||
          !traineeDistrict.trim() ||
          !traineeState.trim()}
        onclick={() => void createTrainee()}>Save trainee</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
