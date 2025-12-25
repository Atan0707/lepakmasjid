# Quick Fix: Cloudflare Build Error

## Problem
Cloudflare is trying to use Bun because it detected `bun.lockb`, but the lockfile is outdated/incompatible.

## Immediate Solution

### Step 1: Remove bun.lockb from Git

```powershell
# Remove from git tracking (file stays locally but won't be committed)
git rm --cached bun.lockb

# Commit the change
git commit -m "Remove bun.lockb to fix Cloudflare build"

# Push to trigger new deployment
git push
```

### Step 2: Update Cloudflare Build Settings

1. Go to your Cloudflare Pages project: **Workers & Pages** → **lepakmasjid**
2. Navigate to **Settings** → **Builds & deployments**
3. Update **Build command** to:
   ```
   pnpm install && pnpm build
   ```
   Or if you prefer npm:
   ```
   npm install && npm run build
   ```

### Step 3: Clear Build Cache

1. In the same **Builds & deployments** section
2. Click **"Clear build cache"** button
3. This ensures Cloudflare doesn't use cached Bun installation

### Step 4: Trigger New Deployment

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the failed deployment
   OR
3. Make a small change and push to trigger automatic deployment:
   ```powershell
   # Make a small change (e.g., update README)
   echo "" >> README.md
   git add README.md
   git commit -m "Trigger rebuild"
   git push
   ```

## Why This Works

- Cloudflare auto-detects package managers based on lockfiles
- Having `bun.lockb` makes Cloudflare try to use Bun
- Removing it forces Cloudflare to use `pnpm` (because `pnpm-lock.yaml` exists)
- The explicit build command ensures the correct package manager is used

## Verification

After deployment, check:
1. Build logs show `pnpm install` (not `bun install`)
2. Build completes successfully
3. Site is accessible

## Prevention

The `bun.lockb` file has been added to `.gitignore` to prevent this issue in the future.

