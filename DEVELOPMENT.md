# Development Guide

## Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- npm (bundled with Node.js)
- [LogSeq desktop app](https://logseq.com/) (classic markdown version)

## First-time setup

```bash
# From the project root:
npm install
```

## Running unit tests

```bash
npm test          # run all tests once
npm run test:watch  # re-run on file save (useful while editing)
```

Tests cover `src/datetime.ts`, `src/detector.ts`, and `src/rules.ts` —
the pure-logic modules that have no dependency on the LogSeq API.

## Type-checking without building

```bash
npm run typecheck
```

## Building the plugin

```bash
npm run build
```

Output: `dist/index.js` — the single bundled file LogSeq loads.

## Regenerating the icon

The placeholder `icon.png` was generated with:

```bash
npm run create-icon
```

This creates a 128×128 solid blue PNG. To change the colour or design, edit
`scripts/create-icon.cjs` and re-run the command.
Replace `icon.png` with a proper icon before submitting to the marketplace.

## Loading in LogSeq (developer mode)

1. Build the plugin first (`npm run build`)
2. Open LogSeq → Settings (⚙️) → Plugins
3. Toggle on **Developer mode** (bottom of the panel)
4. Click **Load unpacked plugin**
5. Select this project's root folder (the one containing `package.json`)
6. The plugin appears in the list and starts immediately

## Making changes

1. Edit files in `src/`
2. Run `npm run build`
3. In LogSeq → Plugins, click the **↺ Reload** button next to the plugin
   (or disable + enable it)

## Project structure

```
src/
  datetime.ts   — formats Date → "[[Apr 17th, 2026]] 12:05"
  detector.ts   — finds marker transitions in LogSeq datoms
  rules.ts      — matches transitions to configured rules
  settings.ts   — LogSeq settings schema + typed accessor
  properties.ts — calls logseq.Editor.upsertBlockProperty
  index.ts      — plugin entry, registers DB change listener
tests/
  datetime.test.ts
  detector.test.ts
  rules.test.ts
```
