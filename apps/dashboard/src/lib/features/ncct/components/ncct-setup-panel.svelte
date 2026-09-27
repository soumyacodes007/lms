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
  };

  type Trainee = {
    id: string;
    traineeNumber: string;
    district: string;
    state: string;
    skills: string[];
  };

  type Props = {
    institutions: Institution[];
    trainees: Trainee[];
  };

  let { institutions, trainees }: Props = $props();
  let institutionOpen = $state(false);
  let traineeOpen = $state(false);
  let institutionBusy = $state(false);
  let traineeBusy = $state(false);
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

  function resetInstitution() {
    institutionCode = '';
    institutionName = '';
    institutionType = 'ICM';
    institutionDistrict = '';
    institutionState = '';
    institutionEmail = '';
    formMessage = '';
  }

  function resetTrainee() {
    traineeInstitutionId = institutions[0]?.id ?? '';
    traineeNumber = '';
    traineeCooperative = '';
    traineeDistrict = '';
    traineeState = '';
    traineePhone = '';
    traineeSkills = '';
    formMessage = '';
  }

  async function createInstitution() {
    institutionBusy = true;
    formMessage = '';
    try {
      const response = await classroomio.ncct.institutions.$post({
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
        formMessage = 'The institution could not be registered.';
        return;
      }
      institutionOpen = false;
      resetInstitution();
      await invalidateAll();
    } catch {
      formMessage = 'The institution could not be registered.';
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
            .filter(Boolean)
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
    </div>
  </div>
  <div class="ui:text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
    <Badge variant="secondary">{institutions.length} institutions</Badge>
    <Badge variant="secondary">{trainees.length} trainees</Badge>
  </div>
</section>

<Dialog.Root bind:open={institutionOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Register institution</Dialog.Title>
      <Dialog.Description>Add a VAMNICOM, RICM, ICM, or cooperative training centre.</Dialog.Description>
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
        onclick={() => void createInstitution()}>Save institution</Button
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
