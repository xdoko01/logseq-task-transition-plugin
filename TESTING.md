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
2. Save settings
3. **Expected:** a warning notification appears:
   _"Task Transition Plugin: Custom rules JSON is invalid. Check plugin settings."_
4. Default rules still work: create a `TODO` task → `DOING` → `started` is added

---

## Test 8 — Date only format

1. Open plugin settings → **Date format** → select `date`
2. Create a `TODO` task and cycle it to `DOING`
3. **Expected:** `started:: [[<today>]]` — no time component
