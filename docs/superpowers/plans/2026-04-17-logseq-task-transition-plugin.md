# LogSeq Task Transition Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a LogSeq plugin that automatically adds configurable block properties (e.g. `started`, `completed`) when a task changes state (e.g. TODO→DOING, DOING→DONE).

**Architecture:** Listen to `logseq.DB.onChanged` for block changes; parse the raw datoms to detect marker transitions; look up matching rules from settings; call `logseq.Editor.upsertBlockProperty` for each matched rule. Pure-logic modules (datetime formatting, transition detection, rule matching) are tested with Vitest; LogSeq API calls are verified via manual integration testing.

**Tech Stack:** TypeScript 5, Vite 5 (IIFE lib build), Vitest 1, `@logseq/libs` 0.0.17, `jimp` 0.22.x (icon generation only).

---

## File Map

| File | Role |
|---|---|
| `src/datetime.ts` | Formats `Date` → LogSeq journal link string |
| `src/detector.ts` | Extracts task marker transitions from LogSeq datoms |
| `src/rules.ts` | Matches transitions to configured rules |
| `src/settings.ts` | LogSeq settings schema + typed accessor |
| `src/properties.ts` | Wraps `logseq.Editor.upsertBlockProperty` |
| `src/index.ts` | Plugin entry — wires everything together |
| `tests/datetime.test.ts` | Unit tests for datetime formatting |
| `tests/detector.test.ts` | Unit tests for transition detection |
| `tests/rules.test.ts` | Unit tests for rule matching |
| `scripts/create-icon.cjs` | One-time script to generate placeholder icon |
| `icon.png` | 128×128 plugin icon (required for marketplace) |
| `README.md` | User-facing documentation |
| `TESTING.md` | Manual integration test guide |
| `DEVELOPMENT.md` | Build, test, and dev-mode guide |
| `PUBLISHING.md` | Step-by-step GitHub + marketplace guide |
| `marketplace/package.json` | Marketplace submission file (PR to logseq/marketplace) |

---

## Task 1: Project Scaffold & Git Init

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

  In `C:/Users/Otakar/OneDrive/Personal/JavaScript/logseq-task-transition-plugin/`, create `package.json`:

  ```json
  {
    "name": "logseq-task-transition-plugin",
    "version": "0.1.0",
    "description": "Automatically adds custom properties to tasks on status transition in LogSeq",
    "main": "dist/index.js",
    "scripts": {
      "build": "vite build",
      "typecheck": "tsc --noEmit",
      "test": "vitest run",
      "test:watch": "vitest",
      "create-icon": "node scripts/create-icon.cjs"
    },
    "devDependencies": {
      "@logseq/libs": "0.0.17",
      "jimp": "^0.22.10",
      "typescript": "^5.4.0",
      "vite": "^5.2.0",
      "vitest": "^1.6.0"
    },
    "logseq": {
      "id": "logseq-task-transition-plugin",
      "title": "Task Transition Properties",
      "icon": "icon.png"
    }
  }
  ```

- [ ] **Step 2: Create tsconfig.json**

  ```json
  {
    "compilerOptions": {
      "target": "ESNext",
      "useDefineForClassFields": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "sourceMap": true,
      "resolveJsonModule": true,
      "esModuleInterop": true,
      "lib": ["ESNext", "DOM"],
      "skipLibCheck": true
    },
    "include": ["src", "tests"]
  }
  ```

- [ ] **Step 3: Create vite.config.ts**

  ```typescript
  import { defineConfig } from "vite";
  import { resolve } from "path";

  export default defineConfig({
    build: {
      target: "esnext",
      minify: false,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "logseqTaskTransitionPlugin",
        formats: ["iife"],
        fileName: () => "index.js",
      },
      outDir: "dist",
      emptyOutDir: true,
    },
  });
  ```

- [ ] **Step 4: Create vitest.config.ts**

  ```typescript
  import { defineConfig } from "vitest/config";

  export default defineConfig({
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  });
  ```

- [ ] **Step 5: Create .gitignore**

  ```
  node_modules/
  dist/
  *.local
  .DS_Store
  Thumbs.db
  dist.zip
  ```

- [ ] **Step 6: Install dependencies**

  ```bash
  cd "C:/Users/Otakar/OneDrive/Personal/JavaScript/logseq-task-transition-plugin"
  npm install
  ```

  Expected: `node_modules/` folder created, no errors.

- [ ] **Step 7: Initialise git repo**

  ```bash
  cd "C:/Users/Otakar/OneDrive/Personal/JavaScript/logseq-task-transition-plugin"
  git init
  git add package.json tsconfig.json vite.config.ts vitest.config.ts .gitignore
  git commit -m "chore: project scaffold"
  ```

  Expected: `Initialized empty Git repository` then `1 file changed` commit.

---

## Task 2: src/datetime.ts (TDD)

**Files:**
- Create: `tests/datetime.test.ts`
- Create: `src/datetime.ts`

- [ ] **Step 1: Create the failing test file**

  Create `tests/datetime.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import { formatDatetime } from "../src/datetime";

  describe("formatDatetime", () => {
    it("formats date+time as LogSeq journal link with HH:mm", () => {
      const date = new Date(2026, 3, 17, 12, 5); // Apr 17 2026, 12:05
      expect(formatDatetime(date, true)).toBe("[[Apr 17th, 2026]] 12:05");
    });

    it("formats date only as LogSeq journal link without time", () => {
      const date = new Date(2026, 3, 17, 12, 5);
      expect(formatDatetime(date, false)).toBe("[[Apr 17th, 2026]]");
    });

    it("uses 'st' ordinal for day 1", () => {
      expect(formatDatetime(new Date(2026, 0, 1), false)).toBe("[[Jan 1st, 2026]]");
    });

    it("uses 'nd' ordinal for day 2", () => {
      expect(formatDatetime(new Date(2026, 0, 2), false)).toBe("[[Jan 2nd, 2026]]");
    });

    it("uses 'rd' ordinal for day 3", () => {
      expect(formatDatetime(new Date(2026, 0, 3), false)).toBe("[[Jan 3rd, 2026]]");
    });

    it("uses 'th' ordinal for day 4", () => {
      expect(formatDatetime(new Date(2026, 0, 4), false)).toBe("[[Jan 4th, 2026]]");
    });

    it("uses 'th' ordinal for day 11 (special case — not 'st')", () => {
      expect(formatDatetime(new Date(2026, 0, 11), false)).toBe("[[Jan 11th, 2026]]");
    });

    it("uses 'th' ordinal for day 12 (special case — not 'nd')", () => {
      expect(formatDatetime(new Date(2026, 0, 12), false)).toBe("[[Jan 12th, 2026]]");
    });

    it("uses 'th' ordinal for day 13 (special case — not 'rd')", () => {
      expect(formatDatetime(new Date(2026, 0, 13), false)).toBe("[[Jan 13th, 2026]]");
    });

    it("uses 'st' ordinal for day 21", () => {
      expect(formatDatetime(new Date(2026, 0, 21), false)).toBe("[[Jan 21st, 2026]]");
    });

    it("pads single-digit hours and minutes with leading zero", () => {
      expect(formatDatetime(new Date(2026, 0, 1, 9, 5), true)).toBe("[[Jan 1st, 2026]] 09:05");
    });

    it("formats December correctly", () => {
      expect(formatDatetime(new Date(2026, 11, 31), false)).toBe("[[Dec 31st, 2026]]");
    });
  });
  ```

- [ ] **Step 2: Run tests and verify they fail**

  ```bash
  npm test
  ```

  Expected: `FAIL tests/datetime.test.ts` — `Cannot find module '../src/datetime'`

- [ ] **Step 3: Create src/datetime.ts**

  ```typescript
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  function ordinal(day: number): string {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  /**
   * Formats a Date as a LogSeq journal page link with optional HH:mm time.
   * Example (includeTime=true):  [[Apr 17th, 2026]] 12:05
   * Example (includeTime=false): [[Apr 17th, 2026]]
   */
  export function formatDatetime(date: Date, includeTime: boolean): string {
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const link = `[[${month} ${day}${ordinal(day)}, ${year}]]`;
    if (!includeTime) return link;
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${link} ${hh}:${mm}`;
  }
  ```

- [ ] **Step 4: Run tests and verify all pass**

  ```bash
  npm test
  ```

  Expected: `PASS tests/datetime.test.ts` — 12 tests pass, 0 fail.

- [ ] **Step 5: Commit**

  ```bash
  git add src/datetime.ts tests/datetime.test.ts
  git commit -m "feat: datetime formatter with LogSeq journal link format"
  ```

---

## Task 3: src/detector.ts (TDD)

**Files:**
- Create: `tests/detector.test.ts`
- Create: `src/detector.ts`

**Background for non-TypeScript readers:** LogSeq stores its data in a Datomic-style database. Every change produces a list of *datoms* — tuples of the form `[entityId, attribute, value, transactionId, added]`. When a task marker changes from TODO to DOING, LogSeq emits two datoms for that block: one retracting the old marker (`added = false`) and one asserting the new marker (`added = true`). The detector reads these datoms to find transitions without needing to store any previous state.

- [ ] **Step 1: Create the failing test file**

  Create `tests/detector.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import { detectTransitionsFromDatoms } from "../src/detector";
  import type { Datom } from "../src/detector";

  const singleBlock = [{ id: 1, uuid: "uuid-1" }];

  describe("detectTransitionsFromDatoms", () => {
    it("detects a TODO → DOING transition", () => {
      const datoms: Datom[] = [
        [1, ":block/marker", "TODO", 100, false],
        [1, ":block/marker", "DOING", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
        { blockUuid: "uuid-1", from: "TODO", to: "DOING" },
      ]);
    });

    it("detects a DOING → DONE transition", () => {
      const datoms: Datom[] = [
        [1, ":block/marker", "DOING", 100, false],
        [1, ":block/marker", "DONE", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
        { blockUuid: "uuid-1", from: "DOING", to: "DONE" },
      ]);
    });

    it("ignores non-marker datoms", () => {
      const datoms: Datom[] = [
        [1, ":block/content", "some content", 100, true],
        [1, ":block/updated-at", 1234567890, 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
    });

    it("ignores a block that only has a new marker with no old marker (fresh task creation)", () => {
      const datoms: Datom[] = [
        [1, ":block/marker", "TODO", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
    });

    it("ignores a block where old and new marker are the same", () => {
      const datoms: Datom[] = [
        [1, ":block/marker", "TODO", 100, false],
        [1, ":block/marker", "TODO", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
    });

    it("ignores blocks whose id is not in the blocks list", () => {
      const datoms: Datom[] = [
        [999, ":block/marker", "TODO", 100, false],
        [999, ":block/marker", "DOING", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
    });

    it("handles multiple blocks transitioning in the same DB change", () => {
      const blocks = [
        { id: 1, uuid: "uuid-1" },
        { id: 2, uuid: "uuid-2" },
      ];
      const datoms: Datom[] = [
        [1, ":block/marker", "TODO", 100, false],
        [1, ":block/marker", "DOING", 100, true],
        [2, ":block/marker", "DOING", 100, false],
        [2, ":block/marker", "DONE", 100, true],
      ];
      const result = detectTransitionsFromDatoms(datoms, blocks);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ blockUuid: "uuid-1", from: "TODO", to: "DOING" });
      expect(result).toContainEqual({ blockUuid: "uuid-2", from: "DOING", to: "DONE" });
    });

    it("handles mixed marker and non-marker datoms for same block", () => {
      const datoms: Datom[] = [
        [1, ":block/content", "DOING updated task", 100, true],
        [1, ":block/marker", "TODO", 100, false],
        [1, ":block/marker", "DOING", 100, true],
      ];
      expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
        { blockUuid: "uuid-1", from: "TODO", to: "DOING" },
      ]);
    });
  });
  ```

- [ ] **Step 2: Run tests and verify they fail**

  ```bash
  npm test
  ```

  Expected: `FAIL tests/detector.test.ts` — `Cannot find module '../src/detector'`

- [ ] **Step 3: Create src/detector.ts**

  ```typescript
  /** All task state markers LogSeq recognises */
  export type TaskMarker =
    | "TODO"
    | "DOING"
    | "DONE"
    | "WAITING"
    | "LATER"
    | "NOW"
    | "CANCELLED";

  /**
   * A LogSeq datom tuple: [entityId, attribute, value, transactionId, added]
   * - entityId: numeric ID of the changed block
   * - attribute: e.g. ":block/marker", ":block/content"
   * - value: the attribute's value
   * - transactionId: numeric ID of the DB transaction
   * - added: true = this value was asserted; false = it was retracted
   */
  export type Datom = [number, string, unknown, number, boolean];

  export interface Transition {
    blockUuid: string;
    from: TaskMarker;
    to: TaskMarker;
  }

  /**
   * Scans the datoms from a DB change event and returns every block whose
   * task marker changed from one state to a different state.
   *
   * @param datoms  Raw datoms from logseq.DB.onChanged({ txData })
   * @param blocks  Blocks from the same event, used to map numeric IDs → UUIDs
   */
  export function detectTransitionsFromDatoms(
    datoms: Datom[],
    blocks: Array<{ id: number; uuid: string }>
  ): Transition[] {
    // Collect old (retracted) and new (asserted) markers grouped by entity ID
    const byEntity = new Map<number, { from?: TaskMarker; to?: TaskMarker }>();

    for (const [entityId, attribute, value, , added] of datoms) {
      if (attribute !== ":block/marker") continue;
      if (!byEntity.has(entityId)) byEntity.set(entityId, {});
      const entry = byEntity.get(entityId)!;
      if (added) {
        entry.to = value as TaskMarker;
      } else {
        entry.from = value as TaskMarker;
      }
    }

    // Build a lookup from numeric block ID → UUID string
    const uuidByEntityId = new Map(blocks.map((b) => [b.id, b.uuid]));

    const transitions: Transition[] = [];
    for (const [entityId, { from, to }] of byEntity) {
      if (!from || !to || from === to) continue;
      const blockUuid = uuidByEntityId.get(entityId);
      if (!blockUuid) continue;
      transitions.push({ blockUuid, from, to });
    }
    return transitions;
  }
  ```

- [ ] **Step 4: Run tests and verify all pass**

  ```bash
  npm test
  ```

  Expected: `PASS tests/detector.test.ts` — 8 tests pass, 0 fail.

- [ ] **Step 5: Commit**

  ```bash
  git add src/detector.ts tests/detector.test.ts
  git commit -m "feat: transition detector using LogSeq datoms"
  ```

---

## Task 4: src/rules.ts (TDD)

**Files:**
- Create: `tests/rules.test.ts`
- Create: `src/rules.ts`

- [ ] **Step 1: Create the failing test file**

  Create `tests/rules.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import {
    getActiveRules,
    matchRules,
    parseCustomRules,
    isPageExcluded,
  } from "../src/rules";
  import type { Settings } from "../src/rules";

  const allEnabled: Settings = {
    enableRule_TODO_DOING: true,
    enableRule_LATER_NOW: true,
    enableRule_DOING_DONE: true,
    enableRule_NOW_DONE: true,
    customRules: "[]",
    excludedPages: [],
    dateFormat: "datetime",
  };

  // ── getActiveRules ────────────────────────────────────────────────────────────

  describe("getActiveRules", () => {
    it("returns all 4 default rules when all are enabled", () => {
      expect(getActiveRules(allEnabled)).toHaveLength(4);
    });

    it("excludes the TODO→DOING rule when its toggle is off", () => {
      const rules = getActiveRules({ ...allEnabled, enableRule_TODO_DOING: false });
      expect(rules).toHaveLength(3);
      expect(rules.find((r) => r.from === "TODO" && r.to === "DOING")).toBeUndefined();
    });

    it("excludes the LATER→NOW rule when its toggle is off", () => {
      const rules = getActiveRules({ ...allEnabled, enableRule_LATER_NOW: false });
      expect(rules.find((r) => r.from === "LATER" && r.to === "NOW")).toBeUndefined();
    });

    it("includes valid custom rules in addition to defaults", () => {
      const settings: Settings = {
        ...allEnabled,
        customRules: '[{"from":"TODO","to":"CANCELLED","property":"cancelled","overwrite":true}]',
      };
      const rules = getActiveRules(settings);
      expect(rules).toHaveLength(5);
      expect(rules.find((r) => r.from === "TODO" && r.to === "CANCELLED")).toBeDefined();
    });

    it("silently ignores malformed custom rules JSON (returns defaults only)", () => {
      const rules = getActiveRules({ ...allEnabled, customRules: "not-valid-json" });
      expect(rules).toHaveLength(4);
    });

    it("default rules always have overwrite: true", () => {
      getActiveRules(allEnabled).forEach((r) => expect(r.overwrite).toBe(true));
    });
  });

  // ── matchRules ────────────────────────────────────────────────────────────────

  describe("matchRules", () => {
    const rules = getActiveRules(allEnabled);

    it("matches TODO→DOING to the 'started' rule", () => {
      const matched = matchRules("TODO", "DOING", rules);
      expect(matched).toHaveLength(1);
      expect(matched[0].property).toBe("started");
    });

    it("matches LATER→NOW to the 'started' rule", () => {
      const matched = matchRules("LATER", "NOW", rules);
      expect(matched).toHaveLength(1);
      expect(matched[0].property).toBe("started");
    });

    it("matches DOING→DONE to the 'completed' rule", () => {
      const matched = matchRules("DOING", "DONE", rules);
      expect(matched).toHaveLength(1);
      expect(matched[0].property).toBe("completed");
    });

    it("matches NOW→DONE to the 'completed' rule", () => {
      const matched = matchRules("NOW", "DONE", rules);
      expect(matched).toHaveLength(1);
      expect(matched[0].property).toBe("completed");
    });

    it("returns empty array for a transition with no matching rule", () => {
      expect(matchRules("TODO", "CANCELLED", rules)).toHaveLength(0);
    });

    it("returns empty array when rules list is empty", () => {
      expect(matchRules("TODO", "DOING", [])).toHaveLength(0);
    });
  });

  // ── parseCustomRules ──────────────────────────────────────────────────────────

  describe("parseCustomRules", () => {
    it("parses a valid single-rule array", () => {
      const result = parseCustomRules(
        '[{"from":"TODO","to":"CANCELLED","property":"cancelled","overwrite":true}]'
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        from: "TODO",
        to: "CANCELLED",
        property: "cancelled",
        overwrite: true,
      });
    });

    it("defaults overwrite to true when the field is absent", () => {
      const result = parseCustomRules(
        '[{"from":"TODO","to":"CANCELLED","property":"cancelled"}]'
      );
      expect(result[0].overwrite).toBe(true);
    });

    it("sets overwrite to false when explicitly false", () => {
      const result = parseCustomRules(
        '[{"from":"TODO","to":"CANCELLED","property":"cancelled","overwrite":false}]'
      );
      expect(result[0].overwrite).toBe(false);
    });

    it("upcases the from/to fields", () => {
      const result = parseCustomRules(
        '[{"from":"todo","to":"doing","property":"started"}]'
      );
      expect(result[0].from).toBe("TODO");
      expect(result[0].to).toBe("DOING");
    });

    it("returns empty array for invalid JSON", () => {
      expect(parseCustomRules("not-json")).toHaveLength(0);
    });

    it("returns empty array for JSON that is an object, not an array", () => {
      expect(parseCustomRules('{"from":"TODO"}')).toHaveLength(0);
    });

    it("filters out entries missing 'from'", () => {
      expect(
        parseCustomRules('[{"to":"DOING","property":"started"}]')
      ).toHaveLength(0);
    });

    it("filters out entries missing 'to'", () => {
      expect(
        parseCustomRules('[{"from":"TODO","property":"started"}]')
      ).toHaveLength(0);
    });

    it("filters out entries missing 'property'", () => {
      expect(
        parseCustomRules('[{"from":"TODO","to":"DOING"}]')
      ).toHaveLength(0);
    });
  });

  // ── isPageExcluded ────────────────────────────────────────────────────────────

  describe("isPageExcluded", () => {
    it("returns true for an exact page name match", () => {
      expect(isPageExcluded("inbox", ["inbox"])).toBe(true);
    });

    it("returns true when the page name starts with a namespace prefix", () => {
      expect(isPageExcluded("templates/daily", ["templates/"])).toBe(true);
    });

    it("returns false when the page is not in the exclusion list", () => {
      expect(isPageExcluded("my-project", ["inbox", "templates/"])).toBe(false);
    });

    it("returns false when the exclusion list is empty", () => {
      expect(isPageExcluded("any-page", [])).toBe(false);
    });

    it("does not match a partial name without the prefix separator", () => {
      // 'temp' should NOT match page 'templates/daily'
      expect(isPageExcluded("templates/daily", ["temp"])).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Run tests and verify they fail**

  ```bash
  npm test
  ```

  Expected: `FAIL tests/rules.test.ts` — `Cannot find module '../src/rules'`

- [ ] **Step 3: Create src/rules.ts**

  ```typescript
  import type { TaskMarker } from "./detector";

  export interface Rule {
    from: TaskMarker;
    to: TaskMarker;
    property: string;
    overwrite: boolean;
  }

  /** Shape of the settings object consumed by rules.ts — mirrors LogSeq plugin settings */
  export interface Settings {
    enableRule_TODO_DOING: boolean;
    enableRule_LATER_NOW: boolean;
    enableRule_DOING_DONE: boolean;
    enableRule_NOW_DONE: boolean;
    /** JSON string — array of custom Rule objects */
    customRules: string;
    /** Already split and trimmed from comma-separated setting string */
    excludedPages: string[];
    dateFormat: "datetime" | "date";
  }

  const DEFAULT_RULES: Rule[] = [
    { from: "TODO",  to: "DOING", property: "started",   overwrite: true },
    { from: "LATER", to: "NOW",   property: "started",   overwrite: true },
    { from: "DOING", to: "DONE",  property: "completed", overwrite: true },
    { from: "NOW",   to: "DONE",  property: "completed", overwrite: true },
  ];

  type DefaultRuleKey =
    | "enableRule_TODO_DOING"
    | "enableRule_LATER_NOW"
    | "enableRule_DOING_DONE"
    | "enableRule_NOW_DONE";

  const RULE_ENABLE_KEYS: Array<{ key: DefaultRuleKey; index: number }> = [
    { key: "enableRule_TODO_DOING", index: 0 },
    { key: "enableRule_LATER_NOW",  index: 1 },
    { key: "enableRule_DOING_DONE", index: 2 },
    { key: "enableRule_NOW_DONE",   index: 3 },
  ];

  /**
   * Parses the custom rules JSON string from settings.
   * Returns an empty array (and swallows the error) if the JSON is invalid.
   */
  export function parseCustomRules(json: string): Rule[] {
    try {
      const parsed: unknown = JSON.parse(json);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (r) =>
            typeof r === "object" &&
            r !== null &&
            typeof (r as Record<string, unknown>).from === "string" &&
            typeof (r as Record<string, unknown>).to === "string" &&
            typeof (r as Record<string, unknown>).property === "string"
        )
        .map((r) => ({
          from: ((r as Record<string, unknown>).from as string).toUpperCase() as TaskMarker,
          to: ((r as Record<string, unknown>).to as string).toUpperCase() as TaskMarker,
          property: (r as Record<string, unknown>).property as string,
          overwrite: (r as Record<string, unknown>).overwrite !== false,
        }));
    } catch {
      return [];
    }
  }

  /** Returns the combined list of enabled default rules plus any valid custom rules */
  export function getActiveRules(settings: Settings): Rule[] {
    const active: Rule[] = [];
    for (const { key, index } of RULE_ENABLE_KEYS) {
      if (settings[key]) active.push(DEFAULT_RULES[index]);
    }
    return [...active, ...parseCustomRules(settings.customRules)];
  }

  /** Returns all rules that match the given (from, to) transition */
  export function matchRules(
    from: TaskMarker,
    to: TaskMarker,
    rules: Rule[]
  ): Rule[] {
    return rules.filter((r) => r.from === from && r.to === to);
  }

  /**
   * Returns true if pageName matches any entry in excludedPages exactly
   * or starts with it (for namespace prefixes like "templates/").
   */
  export function isPageExcluded(pageName: string, excludedPages: string[]): boolean {
    return excludedPages.some(
      (ex) => pageName === ex || pageName.startsWith(ex)
    );
  }
  ```

- [ ] **Step 4: Run all tests and verify they all pass**

  ```bash
  npm test
  ```

  Expected: All 3 test files pass. Total ~28 tests, 0 fail.

- [ ] **Step 5: Commit**

  ```bash
  git add src/rules.ts tests/rules.test.ts
  git commit -m "feat: rule engine — matching, custom rules, page exclusion"
  ```

---

## Task 5: src/settings.ts

**Files:**
- Create: `src/settings.ts`

No unit tests for this file — it is a thin wrapper over the LogSeq settings API, verified manually.

- [ ] **Step 1: Create src/settings.ts**

  ```typescript
  import type { Settings } from "./rules";

  /**
   * SettingDef describes one item in the LogSeq plugin settings panel.
   * This matches the shape expected by logseq.useSettingsSchema().
   */
  interface SettingDef {
    key: string;
    type: "boolean" | "string" | "number" | "enum";
    default: boolean | string | number;
    title: string;
    description: string;
    enumChoices?: string[];
    enumPicker?: "select" | "radio" | "checkbox";
  }

  /** Schema registered with LogSeq — drives the Settings UI panel automatically */
  export const SETTINGS_SCHEMA: SettingDef[] = [
    {
      key: "enableRule_TODO_DOING",
      type: "boolean",
      default: true,
      title: "TODO → DOING: add 'started'",
      description: "Adds the 'started' property when a task moves from TODO to DOING.",
    },
    {
      key: "enableRule_LATER_NOW",
      type: "boolean",
      default: true,
      title: "LATER → NOW: add 'started'",
      description: "Adds the 'started' property when a task moves from LATER to NOW.",
    },
    {
      key: "enableRule_DOING_DONE",
      type: "boolean",
      default: true,
      title: "DOING → DONE: add 'completed'",
      description: "Adds the 'completed' property when a task moves from DOING to DONE.",
    },
    {
      key: "enableRule_NOW_DONE",
      type: "boolean",
      default: true,
      title: "NOW → DONE: add 'completed'",
      description: "Adds the 'completed' property when a task moves from NOW to DONE.",
    },
    {
      key: "customRules",
      type: "string",
      default: "[]",
      title: "Custom rules (JSON)",
      description:
        'Extra transition rules as a JSON array. ' +
        'Example: [{"from":"TODO","to":"CANCELLED","property":"cancelled","overwrite":true}]',
    },
    {
      key: "excludedPages",
      type: "string",
      default: "",
      title: "Excluded pages",
      description:
        "Comma-separated page names or namespace prefixes to skip. " +
        "Example: templates/, inbox",
    },
    {
      key: "dateFormat",
      type: "enum",
      default: "datetime",
      title: "Date format",
      description:
        "'datetime' produces [[Apr 17th, 2026]] 12:05 · 'date' produces [[Apr 17th, 2026]]",
      enumChoices: ["datetime", "date"],
      enumPicker: "radio",
    },
  ];

  /**
   * Reads the current LogSeq plugin settings and returns a typed Settings object.
   * Provides safe defaults in case a setting hasn't been initialised yet.
   */
  export function getSettings(): Settings {
    const s = logseq.settings!;
    return {
      enableRule_TODO_DOING: (s["enableRule_TODO_DOING"] as boolean) ?? true,
      enableRule_LATER_NOW:  (s["enableRule_LATER_NOW"]  as boolean) ?? true,
      enableRule_DOING_DONE: (s["enableRule_DOING_DONE"] as boolean) ?? true,
      enableRule_NOW_DONE:   (s["enableRule_NOW_DONE"]   as boolean) ?? true,
      customRules: (s["customRules"] as string) ?? "[]",
      excludedPages: ((s["excludedPages"] as string) ?? "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      dateFormat: ((s["dateFormat"] as string) ?? "datetime") as "datetime" | "date",
    };
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/settings.ts
  git commit -m "feat: settings schema and typed accessor"
  ```

---

## Task 6: src/properties.ts

**Files:**
- Create: `src/properties.ts`

- [ ] **Step 1: Create src/properties.ts**

  ```typescript
  /**
   * Adds or updates a block property via the LogSeq Editor API.
   *
   * @param blockUuid  UUID of the block to update
   * @param property   Property name (without "::" suffix), e.g. "started"
   * @param value      Property value string, e.g. "[[Apr 17th, 2026]] 12:05"
   * @param overwrite  If false, skip the update when the property already has a value
   */
  export async function upsertProperty(
    blockUuid: string,
    property: string,
    value: string,
    overwrite: boolean
  ): Promise<void> {
    if (!overwrite) {
      const block = await logseq.Editor.getBlock(blockUuid, { includeChildren: false });
      if (block?.properties?.[property] != null) return;
    }
    await logseq.Editor.upsertBlockProperty(blockUuid, property, value);
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/properties.ts
  git commit -m "feat: block property upserter wrapping LogSeq Editor API"
  ```

---

## Task 7: src/index.ts & Build Verification

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create src/index.ts**

  ```typescript
  import "@logseq/libs";
  import { SETTINGS_SCHEMA, getSettings } from "./settings";
  import { detectTransitionsFromDatoms, type Datom } from "./detector";
  import { getActiveRules, matchRules, parseCustomRules, isPageExcluded } from "./rules";
  import { formatDatetime } from "./datetime";
  import { upsertProperty } from "./properties";

  // Tracks whether we have already shown the invalid-JSON warning this session
  let customRulesWarningShown = false;

  /**
   * Shows a one-time warning notification if customRules is non-empty but invalid JSON.
   * Does nothing on subsequent calls.
   */
  function validateCustomRules(customRulesJson: string): void {
    if (customRulesWarningShown) return;
    const trimmed = customRulesJson.trim();
    if (trimmed === "" || trimmed === "[]") return;
    if (parseCustomRules(trimmed).length === 0) {
      logseq.UI.showMsg(
        "Task Transition Plugin: Custom rules JSON is invalid. Check plugin settings.",
        "warning"
      );
      customRulesWarningShown = true;
    }
  }

  async function main(): Promise<void> {
    // Register settings schema — LogSeq renders this as the plugin settings UI
    logseq.useSettingsSchema(SETTINGS_SCHEMA);

    // Validate custom rules on startup and warn once if malformed
    validateCustomRules(getSettings().customRules);

    logseq.DB.onChanged(async ({ blocks, txData }) => {
      const settings = getSettings();
      const activeRules = getActiveRules(settings);

      // Detect which blocks changed their task marker
      const transitions = detectTransitionsFromDatoms(
        txData as Datom[],
        blocks.map((b) => ({ id: b.id, uuid: b.uuid }))
      );

      // Compute the datetime string once for all transitions in this batch
      const value = formatDatetime(new Date(), settings.dateFormat === "datetime");

      for (const { blockUuid, from, to } of transitions) {
        const matched = matchRules(from, to, activeRules);
        if (matched.length === 0) continue;

        // Fetch the block to get its page ID (needed for exclusion check)
        const block = await logseq.Editor.getBlock(blockUuid, { includeChildren: false });
        if (!block?.page) continue;

        const page = await logseq.Editor.getPage(block.page.id);
        if (!page) continue;

        if (isPageExcluded(page.name, settings.excludedPages)) continue;

        for (const rule of matched) {
          try {
            await upsertProperty(blockUuid, rule.property, value, rule.overwrite);
          } catch (err) {
            // Never let a property-write failure surface to the user
            console.error("[task-transition] Failed to upsert property:", err);
          }
        }
      }
    });
  }

  logseq.ready(main).catch(console.error);
  ```

- [ ] **Step 2: Run the build**

  ```bash
  npm run build
  ```

  Expected output (no errors):
  ```
  vite v5.x.x building for production...
  ✓ built in Xms
  dist/index.js  XX.XX kB
  ```

  Verify `dist/index.js` was created:
  ```bash
  ls dist/
  ```
  Expected: `index.js`

- [ ] **Step 3: Run all unit tests one more time to confirm nothing regressed**

  ```bash
  npm test
  ```

  Expected: All tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add src/index.ts
  git commit -m "feat: plugin entry point — wires DB hook to detector, rules, and properties"
  ```

---

## Task 8: Placeholder Icon

**Files:**
- Create: `scripts/create-icon.cjs`
- Create: `icon.png` (generated by the script)

LogSeq marketplace requires a 128×128 `icon.png` in the repository root. This task generates a simple blue placeholder. Replace it with a proper graphic before publishing.

- [ ] **Step 1: Create scripts/create-icon.cjs**

  ```javascript
  // Generates a 128×128 solid-colour PNG as a placeholder plugin icon.
  // Requires: npm install (jimp is in devDependencies)
  // Run with:  npm run create-icon
  const Jimp = require("jimp");

  Jimp.create(128, 128, 0x4a7fe8ff) // solid blue #4a7fe8
    .then((img) => img.writeAsync("icon.png"))
    .then(() =>
      console.log(
        "Created icon.png (128×128 blue placeholder). " +
        "Replace with a proper icon before submitting to the marketplace."
      )
    )
    .catch(console.error);
  ```

- [ ] **Step 2: Generate the icon**

  ```bash
  npm run create-icon
  ```

  Expected: `Created icon.png (128×128 blue placeholder)...`
  Verify: `ls icon.png` shows the file exists.

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/create-icon.cjs icon.png
  git commit -m "chore: add placeholder icon (128×128 blue) for marketplace"
  ```

---

## Task 9: Documentation

**Files:**
- Create: `README.md`
- Create: `TESTING.md`
- Create: `DEVELOPMENT.md`

- [ ] **Step 1: Create README.md**

  ```markdown
  # LogSeq Task Transition Plugin

  Automatically adds properties to your tasks when their status changes.

  **Example:** When you click a `TODO` task to move it to `DOING`, the plugin
  immediately adds `started:: [[Apr 17th, 2026]] 12:05` to that block.

  ## Default behaviour

  | Status change | Property added / updated |
  |---|---|
  | `TODO` → `DOING` | `started:: [[date]] HH:mm` |
  | `LATER` → `NOW` | `started:: [[date]] HH:mm` |
  | `DOING` → `DONE` | `completed:: [[date]] HH:mm` |
  | `NOW` → `DONE` | `completed:: [[date]] HH:mm` |

  Properties are **always overwritten** — cycling a task back and forth updates
  the timestamp each time.

  ## Installation

  ### From the LogSeq Marketplace (recommended)
  1. Open LogSeq → Settings (⚙️) → Plugins
  2. Search for **Task Transition Properties**
  3. Click **Install**

  ### Manual installation
  1. Download the latest `dist.zip` from the [Releases](../../releases) page
  2. Unzip it anywhere on your computer
  3. Open LogSeq → Settings → Plugins → Enable developer mode
  4. Click **Load unpacked plugin** and select the unzipped folder

  ## Configuration

  Open LogSeq → Settings → Plugins → Task Transition Properties.

  | Setting | Description |
  |---|---|
  | **TODO → DOING: add 'started'** | Toggle this default rule on/off |
  | **LATER → NOW: add 'started'** | Toggle this default rule on/off |
  | **DOING → DONE: add 'completed'** | Toggle this default rule on/off |
  | **NOW → DONE: add 'completed'** | Toggle this default rule on/off |
  | **Custom rules (JSON)** | Add your own transition rules (see below) |
  | **Excluded pages** | Comma-separated pages/namespaces to skip |
  | **Date format** | `datetime` (date + time) or `date` (date only) |

  ### Adding custom rules

  Paste a JSON array into the **Custom rules** setting field:

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

  | Field | Required | Description |
  |---|---|---|
  | `from` | yes | Old task state (uppercase): `TODO`, `DOING`, `DONE`, `WAITING`, `LATER`, `NOW`, `CANCELLED` |
  | `to` | yes | New task state (uppercase) |
  | `property` | yes | Property name to add/update (without `::`) |
  | `overwrite` | no | `true` (default) = always update; `false` = only set once |

  ### Excluding pages

  In the **Excluded pages** field, enter a comma-separated list. Use a trailing
  `/` to exclude an entire namespace:

  ```
  templates/, inbox, scratch
  ```

  ## Supported task markers

  `TODO` · `DOING` · `DONE` · `WAITING` · `LATER` · `NOW` · `CANCELLED`

  ## Licence

  MIT
  ```

- [ ] **Step 2: Create TESTING.md**

  ```markdown
  # Manual Integration Testing Guide

  These tests verify the plugin works correctly inside LogSeq. Run them after
  every build before publishing a new release.

  ## Setup

  1. Build the plugin:
     ```bash
     npm run build
     ```
  2. Open LogSeq → Settings (⚙️) → Plugins → Enable developer mode
  3. Click **Load unpacked plugin** and select this project folder
  4. The plugin should appear in the plugins list with status **Enabled**

  ---

  ## Test 1 — TODO → DOING adds `started`

  1. Create a new page (e.g. `plugin-test`)
  2. Type `TODO Test task` and press Enter to create a task block
  3. Click the `TODO` marker to cycle it to `DOING`
  4. **Expected:** the block now shows a `started` property with today's date and time,
     e.g. `started:: [[Apr 17th, 2026]] 12:05`

  ---

  ## Test 2 — LATER → NOW adds `started`

  1. On the same page, type `LATER Another task`
  2. Click `LATER` to cycle it to `NOW`
  3. **Expected:** `started:: [[<today>]] HH:mm` appears under the block

  ---

  ## Test 3 — DOING → DONE adds `completed`

  1. Take the task from Test 1 (currently `DOING`)
  2. Click `DOING` to cycle it to `DONE`
  3. **Expected:** `completed:: [[<today>]] HH:mm` appears under the block.
     The `started` property from Test 1 is still present.

  ---

  ## Test 4 — Overwrite on re-transition

  1. Take the task from Test 3 (currently `DONE`)
  2. Click `DONE` to cycle it back to `TODO`, then to `DOING`
  3. **Expected:** the `started` property is updated to the current time (not the
     time from Test 1)
  4. Click `DOING` → `DONE`
  5. **Expected:** the `completed` property is updated to the current time

  ---

  ## Test 5 — Custom rule

  1. Open plugin settings → **Custom rules (JSON)** field
  2. Enter:
     ```json
     [{"from":"TODO","to":"CANCELLED","property":"cancelled","overwrite":true}]
     ```
  3. Save settings
  4. Create a `TODO` task and click the marker to `CANCELLED`
  5. **Expected:** `cancelled:: [[<today>]] HH:mm` appears under the block

  ---

  ## Test 6 — Excluded page

  1. Open plugin settings → **Excluded pages** field → enter `plugin-test`
  2. Save settings
  3. On the `plugin-test` page, create a new `TODO` task and cycle it to `DOING`
  4. **Expected:** **no** `started` property is added
  5. Create the same task on a different page (e.g. today's journal)
  6. **Expected:** `started` property IS added on the journal page

  ---

  ## Test 7 — Malformed custom rules JSON

  1. Open plugin settings → **Custom rules (JSON)** → enter `this is not json`
  2. Save and reload the plugin (disable then enable in the plugins list)
  3. **Expected:** a warning notification appears:
     _"Task Transition Plugin: Custom rules JSON is invalid. Check plugin settings."_
  4. Default rules still work: create a `TODO` task → `DOING` → `started` is added

  ---

  ## Test 8 — Date only format

  1. Open plugin settings → **Date format** → select `date`
  2. Create a `TODO` task and cycle it to `DOING`
  3. **Expected:** `started:: [[<today>]]` — no time component
  ```

- [ ] **Step 3: Create DEVELOPMENT.md**

  ```markdown
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
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add README.md TESTING.md DEVELOPMENT.md
  git commit -m "docs: README, TESTING guide, and DEVELOPMENT guide"
  ```

---

## Task 10: PUBLISHING.md & Marketplace Files

**Files:**
- Create: `PUBLISHING.md`
- Create: `marketplace/package.json`

- [ ] **Step 1: Create marketplace/package.json**

  > **Action required:** Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username before committing.

  ```json
  {
    "id": "logseq-task-transition-plugin",
    "title": "Task Transition Properties",
    "description": "Automatically adds properties (started, completed, etc.) to tasks when their status changes. Fully configurable via plugin settings.",
    "author": "Otakar Dokoupil",
    "repo": "YOUR_GITHUB_USERNAME/logseq-task-transition-plugin",
    "icon": "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/logseq-task-transition-plugin/main/icon.png",
    "theme": false,
    "effect": false,
    "sponsors": []
  }
  ```

- [ ] **Step 2: Create PUBLISHING.md**

  ```markdown
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
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add PUBLISHING.md marketplace/package.json
  git commit -m "docs: publishing guide and marketplace submission files"
  ```

---

## Task 11: GitHub Repo Creation & Push

- [ ] **Step 1: Verify GitHub CLI is installed**

  ```bash
  gh --version
  ```

  Expected: `gh version X.X.X (...)`. If not installed, download from https://cli.github.com/ and run the installer.

- [ ] **Step 2: Authenticate with GitHub (if not already)**

  ```bash
  gh auth status
  ```

  If you see `Logged in to github.com as ...` — you're already authenticated, skip to Step 3.

  If not authenticated:
  ```bash
  gh auth login
  ```
  Choose: `GitHub.com` → `HTTPS` → `Login with a web browser`. Follow the prompts (a code appears in the terminal; paste it in the browser).

- [ ] **Step 3: Create the public GitHub repository**

  ```bash
  cd "C:/Users/Otakar/OneDrive/Personal/JavaScript/logseq-task-transition-plugin"
  gh repo create logseq-task-transition-plugin \
    --public \
    --description "LogSeq plugin — automatically adds properties to tasks on status transition" \
    --source . \
    --remote origin \
    --push
  ```

  Expected: Repository created at `https://github.com/YOUR_GITHUB_USERNAME/logseq-task-transition-plugin` and all commits pushed.

- [ ] **Step 4: Verify on GitHub**

  ```bash
  gh repo view --web
  ```

  This opens the repository in your browser. Confirm all files are visible.

- [ ] **Step 5: Update marketplace/package.json with your actual GitHub username**

  Open `marketplace/package.json` and replace both occurrences of `YOUR_GITHUB_USERNAME` with the username shown in the GitHub browser tab.

  Then commit and push:
  ```bash
  git add marketplace/package.json
  git commit -m "chore: set real GitHub username in marketplace package.json"
  git push
  ```

---

## Task 12: GitHub Release & dist.zip

- [ ] **Step 1: Build the final bundle**

  ```bash
  npm run build
  ```

  Expected: `dist/index.js` created, no errors.

- [ ] **Step 2: Create dist.zip (run in PowerShell)**

  ```powershell
  cd "C:/Users/Otakar/OneDrive/Personal/JavaScript/logseq-task-transition-plugin"
  Compress-Archive -Force -Path dist, icon.png, package.json, README.md -DestinationPath dist.zip
  ```

  Verify:
  ```powershell
  ls dist.zip
  ```

- [ ] **Step 3: Tag the release**

  ```bash
  git tag v0.1.0
  git push origin v0.1.0
  ```

- [ ] **Step 4: Create the GitHub Release with dist.zip attached**

  ```bash
  gh release create v0.1.0 dist.zip \
    --title "v0.1.0 — Initial release" \
    --notes "First public release.

  ## What it does
  Automatically adds properties to tasks when their status changes:
  - TODO → DOING: adds \`started\`
  - LATER → NOW: adds \`started\`
  - DOING → DONE: adds \`completed\`
  - NOW → DONE: adds \`completed\`

  All rules are configurable via plugin settings."
  ```

  Expected: Release URL printed, e.g. `https://github.com/.../releases/tag/v0.1.0`

- [ ] **Step 5: Verify the release**

  ```bash
  gh release view v0.1.0
  ```

  Expected: Shows title, notes, and `dist.zip` as an asset.

  The plugin is now ready for marketplace submission. Follow `PUBLISHING.md` → Step 3 to submit the PR to the LogSeq marketplace.
