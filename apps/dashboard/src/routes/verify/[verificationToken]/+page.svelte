<script lang="ts">
  import CheckCircle2Icon from '@lucide/svelte/icons/circle-check-big';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { Badge } from '@cio/ui/base/badge';

  const { data } = $props();
  let copied = $state(false);

  function printCredential() {
    window.print();
  }

  async function copyVerificationUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<svelte:head>
  <title>Credential verification</title>
</svelte:head>

<Page.Root class="min-h-screen w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>Credential verification</Page.Title>
      <p class="ui:text-muted-foreground text-sm">NCCT certified trainee registry</p>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="outline" onclick={() => void copyVerificationUrl()}>{copied ? 'Copied' : 'Copy link'}</Button>
      <Button variant="outline" onclick={printCredential}>Print</Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="mx-auto max-w-2xl">
        <section class="ui:bg-card rounded-2xl border p-8 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="ui:bg-primary/10 rounded-full p-3">
                <ShieldCheckIcon class="ui:text-primary size-7" />
              </div>
              <div>
                <p class="text-lg font-semibold">Verified NCCT credential</p>
                <p class="ui:text-muted-foreground text-sm">This record is active in the central registry.</p>
              </div>
            </div>
            <Badge><CheckCircle2Icon class="mr-1 size-4" /> Valid</Badge>
          </div>

          <div class="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Certificate number</p>
              <p class="mt-1 font-semibold">{data.credential.certificateNumber}</p>
            </div>
            <div>
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Issued on</p>
              <p class="mt-1 font-semibold">{new Date(data.credential.issuedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Trainee number</p>
              <p class="mt-1 font-semibold">{data.credential.traineeNumber}</p>
            </div>
            <div>
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Location</p>
              <p class="mt-1 font-semibold">{data.credential.traineeDistrict}, {data.credential.traineeState}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Programme</p>
              <p class="mt-1 text-lg font-semibold">{data.credential.programmeTitle}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">Training institution</p>
              <p class="mt-1 font-semibold">{data.credential.institutionName} ({data.credential.institutionCode})</p>
            </div>
          </div>
        </section>
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
