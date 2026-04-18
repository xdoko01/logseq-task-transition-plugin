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
