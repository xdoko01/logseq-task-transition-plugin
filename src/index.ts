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
