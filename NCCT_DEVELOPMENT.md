# NCCT development checks

Use the pinned workspace runtime from the repository root.

```powershell
corepack pnpm@10.19.0 install --frozen-lockfile
corepack pnpm@10.19.0 format:changed
corepack pnpm@10.19.0 --filter @cio/api^... build
corepack pnpm@10.19.0 --filter @cio/dashboard exec vitest run src/lib/features/ncct/offline-queue.test.ts src/lib/features/ncct/offline-cache.test.ts
```

For a dashboard production bundle on a machine with enough memory:

```powershell
$env:NODE_OPTIONS = '--max-old-space-size=8192'
corepack pnpm@10.19.0 --filter @cio/dashboard build
```

Each NCCT Svelte component can be syntax-checked without building the whole dashboard:

```powershell
corepack pnpm@10.19.0 --filter @cio/dashboard exec node -e "const fs=require('fs'); const {compile}=require('svelte/compiler'); const f='src/lib/features/ncct/components/ncct-directory-panel.svelte'; compile(fs.readFileSync(f,'utf8'),{filename:f,generate:'server'}); console.log('svelte compile passed')"
```

Before pushing a slice, run the focused test or build that covers it, format the changed files, and verify the staged diff with `git diff --cached --check`.
