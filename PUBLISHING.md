# Publishing Guide

Follow these steps to release a new version and submit to the LogSeq marketplace.

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
`https://github.com/xdoko01/logseq-task-transition-plugin/releases/tag/v0.1.0`

---

## Step 3: Submit to the LogSeq Marketplace (first release only)

The marketplace is a GitHub repository: https://github.com/logseq/marketplace.
Each plugin is a folder `packages/<plugin-id>/` containing a `manifest.json`
(see `marketplace/manifest.json` here) and the icon file it references.

Marketplace requirements: the latest release has a zip attached, and the README
explains the plugin and shows at least one image/GIF of it in action.

### 3a. Sync your fork and create a branch

Fork https://github.com/logseq/marketplace once (`xdoko01/marketplace`), then:

```bash
gh repo sync xdoko01/marketplace --source logseq/marketplace --force
gh repo clone xdoko01/marketplace
cd marketplace
git checkout -b add-task-transition-plugin
```

### 3b. Add the plugin entry

```bash
PLUGIN=/c/Users/Otakar/dev/logseq-task-transition-plugin
mkdir -p packages/logseq-task-transition-plugin
cp "$PLUGIN/marketplace/manifest.json" packages/logseq-task-transition-plugin/manifest.json
cp "$PLUGIN/icon.png" packages/logseq-task-transition-plugin/icon.png
```

### 3c. Commit, push and open a pull request

```bash
git add packages/logseq-task-transition-plugin
git commit -m "feat: add logseq-task-transition-plugin"
git push -u origin add-task-transition-plugin

gh pr create --repo logseq/marketplace --head xdoko01:add-task-transition-plugin   --title "feat: add logseq-task-transition-plugin"   --body "Adds the Task Transition Properties plugin: https://github.com/xdoko01/logseq-task-transition-plugin"
```

The LogSeq team will review the PR. Once merged, the plugin appears in the marketplace.

---

## Releasing a new version

1. Update `"version"` in `package.json` (e.g. `0.1.0` → `0.2.0`)
2. Run `npm run build`
3. Re-create `dist.zip` (Step 1 above)
4. Tag and release (Step 2 above, with new version number)
5. No marketplace PR needed for updates — the marketplace reads the latest release automatically
