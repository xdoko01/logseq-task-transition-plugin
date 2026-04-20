# Publishing Guide

Follow these steps to release a new version and submit to the LogSeq marketplace.

> **Before you start:** Replace `YOUR_GITHUB_USERNAME` in `marketplace/package.json`
> with your actual GitHub username.

---

## Step 1: Build and package

```bash
npm run build
```

Create `dist.zip` (run this in PowerShell from the project root):

```powershell
Compress-Archive -Force -Path dist, icon.png, package.json, README.md -DestinationPath dist.zip
```

---

## Step 2: Create a GitHub Release

> Prerequisite: GitHub CLI (`gh`) must be installed and authenticated.
> If not authenticated: run `gh auth login` and follow the prompts.

```bash
# Tag the release (update the version number each time)
git tag v0.1.0
git push origin v0.1.0

# Create the release and attach dist.zip
gh release create v0.1.0 dist.zip \
  --title "v0.1.0 — Initial release" \
  --notes "First public release of the Task Transition Properties plugin."
```

After this command, the release appears at:
`https://github.com/YOUR_GITHUB_USERNAME/logseq-task-transition-plugin/releases/tag/v0.1.0`

---

## Step 3: Submit to the LogSeq Marketplace

The marketplace is a GitHub repository: https://github.com/logseq/marketplace

### 3a. Fork the marketplace repo

Go to https://github.com/logseq/marketplace and click **Fork**.

### 3b. Clone your fork

```bash
gh repo clone YOUR_GITHUB_USERNAME/marketplace
cd marketplace
```

### 3c. Add the plugin entry

```bash
mkdir -p packages/logseq-task-transition-plugin
cp /path/to/logseq-task-transition-plugin/marketplace/package.json \
   packages/logseq-task-transition-plugin/package.json
```

### 3d. Commit and push

```bash
git add packages/logseq-task-transition-plugin/package.json
git commit -m "feat: add logseq-task-transition-plugin"
git push origin main
```

### 3e. Open a pull request

```bash
gh pr create \
  --repo logseq/marketplace \
  --title "feat: add logseq-task-transition-plugin" \
  --body "Adds the Task Transition Properties plugin.

Plugin repo: https://github.com/YOUR_GITHUB_USERNAME/logseq-task-transition-plugin

This plugin automatically adds configurable properties to tasks when their
status changes (e.g. TODO→DOING adds \`started\`, DOING→DONE adds \`completed\`)."
```

The LogSeq team will review the PR. Once merged, the plugin appears in the marketplace.

---

## Releasing a new version

1. Update `"version"` in `package.json` (e.g. `0.1.0` → `0.2.0`)
2. Run `npm run build`
3. Re-create `dist.zip` (Step 1 above)
4. Tag and release (Step 2 above, with new version number)
5. No marketplace PR needed for updates — the marketplace reads the latest release automatically
