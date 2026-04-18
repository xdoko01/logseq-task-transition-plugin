# LogSeq Task Transition Plugin — Design Spec

**Date:** 2026-04-17  
**Status:** Approved  

---

## 1. Overview

A LogSeq plugin for the classic markdown (file-based) edition that automatically adds or updates block properties when a task changes state. For example, changing a block from `TODO` to `DOING` adds `started:: [[Apr 17th, 2026]] 12:00` to that block. All transition→property rules ship with sensible defaults and are configurable by the user.

---

## 2. Scope

**In scope:**
- Detect task state transitions in any block across the graph
- Add or overwrite configured properties on transition
- Built-in default rules for the most common transitions
- User-configurable additional/override rules via plugin settings
- Exclusion of specific pages or namespaces
- Configurable datetime format (date+time or date only)
- Git repo, GitHub publication, and LogSeq marketplace submission

**Out of scope:**
- Support for the new LogSeq DB (database) version
- Retroactive audit of historical blocks (stretch goal for a future release)
- Custom UI beyond LogSeq's native settings panel

---

## 3. Tech Stack

| Concern | Choice |
|---|---|
| Language | TypeScript |
| Build tool | Vite |
| Test runner | Vitest |
| UI | None (native LogSeq settings panel only) |
| LogSeq API version | Classic plugin API (`@logseq/libs`) |

No React or other UI framework is needed.

---

## 4. File Structure

```
logseq-task-transition-plugin/
├── src/
│   ├── index.ts          # Plugin entry point — initialises, registers DB hook
│   ├── detector.ts       # Parses block content to extract old/new task marker
│   ├── rules.ts          # Matches a (fromState, toState) pair to configured rules
│   ├── properties.ts     # Upserts block properties via LogSeq Editor API
│   ├── settings.ts       # Settings schema definition and typed accessors
│   └── datetime.ts       # Formats current date/time as LogSeq journal link
├── tests/
│   ├── detector.test.ts
│   ├── rules.test.ts
│   └── datetime.test.ts
├── docs/
│   └── superpowers/specs/
│       └── 2026-04-17-logseq-task-transition-plugin-design.md
├── icon.png              # Plugin icon (required for marketplace)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── TESTING.md            # Step-by-step manual integration test guide
└── .gitignore
```

---

## 5. Core Data Flow

```
logseq.DB.onChanged(changedBlocks)
  │
  ├─ filter: only blocks whose content string changed
  │
  ├─ detector.ts
  │    extract task marker from old content  →  fromState
  │    extract task marker from new content  →  toState
  │    if fromState === toState: skip
  │
  ├─ rules.ts
  │    load default rules (filtered by enabled flags from settings)
  │    merge custom rules from settings JSON
  │    find all rules matching (fromState, toState)
  │
  ├─ check excluded pages list
  │    if block's page is excluded: skip
  │
  └─ properties.ts
       for each matched rule:
         upsertBlockProperty(block.uuid, rule.property, formattedDatetime)
```

---

## 6. Task Markers

LogSeq encodes task state as a keyword at the very start of the block's content string. Recognised markers:

`TODO` · `DOING` · `DONE` · `WAITING` · `LATER` · `NOW` · `CANCELLED`

The detector uses a regex to extract the leading marker, ignoring case variations and surrounding whitespace.

---

## 7. Default Rules

These rules are active out of the box. Each has its own enable/disable toggle in settings.

| # | From | To | Property added / overwritten |
|---|---|---|---|
| 1 | `TODO` | `DOING` | `started` |
| 2 | `LATER` | `NOW` | `started` |
| 3 | `DOING` | `DONE` | `completed` |
| 4 | `NOW` | `DONE` | `completed` |

---

## 8. Settings Schema

Configured via `logseq.useSettingsSchema`. All settings appear in the LogSeq plugin settings panel automatically.

| Setting key | Type | Default | Description |
|---|---|---|---|
| `enableRule_TODO_DOING` | boolean | `true` | Enable default rule: TODO→DOING adds `started` |
| `enableRule_LATER_NOW` | boolean | `true` | Enable default rule: LATER→NOW adds `started` |
| `enableRule_DOING_DONE` | boolean | `true` | Enable default rule: DOING→DONE adds `completed` |
| `enableRule_NOW_DONE` | boolean | `true` | Enable default rule: NOW→DONE adds `completed` |
| `customRules` | string (JSON) | `"[]"` | JSON array of extra rules (see format below) |
| `excludedPages` | string | `""` | Comma-separated page names or namespace prefixes to skip |
| `dateFormat` | enum | `"datetime"` | `"datetime"` = `[[Apr 17th, 2026]] 12:00` · `"date"` = `[[Apr 17th, 2026]]` |

### Custom Rules JSON Format

```json
[
  {
    "from": "TODO",
    "to": "CANCELLED",
    "property": "cancelled",
    "overwrite": true
  }
]
```

Fields:
- `from` / `to` — task marker strings (uppercase)
- `property` — LogSeq property name (no `::` suffix)
- `overwrite` — `true` means always update; `false` means only set if not already present

Default rules always overwrite (matching the approved behavior from the design discussion).

---

## 9. Datetime Format

The `datetime.ts` module produces strings in LogSeq's journal link format:

- **datetime mode:** `[[Apr 17th, 2026]] 12:05` — a clickable journal page link with appended time
- **date mode:** `[[Apr 17th, 2026]]` — date only

The ordinal suffix (`st`, `nd`, `rd`, `th`) is computed from the day number. The month name uses LogSeq's standard English abbreviations.

---

## 10. Error Handling

| Scenario | Behaviour |
|---|---|
| `upsertBlockProperty` throws (e.g. block deleted mid-edit) | Catch, log to console, continue — never interrupt the user |
| `customRules` JSON is malformed | Show a one-time LogSeq notification on startup; fall back to default rules only |
| Block is on an excluded page | Skip silently |
| Unrecognised marker in block content | Treat as no marker (no transition detected) |

---

## 11. Testing

### Unit tests (Vitest)
Pure-logic modules with no LogSeq dependency are unit-tested:
- `detector.ts` — marker extraction from various block content strings
- `rules.ts` — rule matching, custom rule merging, exclusion logic
- `datetime.ts` — correct date formatting for multiple dates and formats

### Manual integration tests
Documented in `TESTING.md`. Covers:
1. Each default rule (trigger transition, verify property added)
2. Overwrite behavior (transition back and forth)
3. Custom rule via settings JSON
4. Excluded page (verify property is NOT added)
5. Malformed JSON (verify fallback + notification)

---

## 12. Publication Pipeline

### 12a. Git & GitHub

1. Initialise local git repo (`git init`) in the project folder
2. Create `.gitignore` (covers `node_modules/`, `dist/`, OS files)
3. Initial commit with all source files
4. Create a public GitHub repo via GitHub CLI (`gh repo create`)
5. Push to `main` branch

### 12b. LogSeq Marketplace Submission

The marketplace lives at https://github.com/logseq/marketplace. Submission requires:

1. **GitHub Release** on the plugin repo with a `dist.zip` asset (built output)
2. **PR to logseq/marketplace** adding a file at:
   ```
   packages/logseq-task-transition-plugin/package.json
   ```
   with fields: `id`, `title`, `description`, `author`, `repo`, `icon`, `theme`
3. **Icon:** a 128×128 `icon.png` in the plugin repo root
4. **README.md:** user-facing documentation (install, configure, usage)

I will generate all required files and write a step-by-step guide (`PUBLISHING.md`) for the PR submission, including exact commands.

---

## 13. Documentation Plan

Since the project owner is not familiar with TypeScript, the following documentation will be produced:

- **README.md** — user-facing: what the plugin does, how to install, how to configure settings, FAQ
- **TESTING.md** — manual test scenarios with exact steps
- **PUBLISHING.md** — step-by-step guide for GitHub and marketplace submission
- **Inline code comments** — every non-obvious function and type is documented with JSDoc
- **DEVELOPMENT.md** — how to build, run in dev mode, and run unit tests (for future contributors)
