import type { TaskMarker } from "./detector";
import { VALID_MARKERS } from "./detector";

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
        typeof (r as Record<string, unknown>).property === "string" &&
        VALID_MARKERS.has(((r as Record<string, unknown>).from as string).toUpperCase()) &&
        VALID_MARKERS.has(((r as Record<string, unknown>).to as string).toUpperCase())
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
 * or starts with it when the entry ends with "/" (namespace prefix like "templates/").
 */
export function isPageExcluded(pageName: string, excludedPages: string[]): boolean {
  const lowerPageName = pageName.toLowerCase();
  return excludedPages.some((ex) => {
    const lowerEx = ex.toLowerCase();
    return lowerPageName === lowerEx || (ex.endsWith("/") && lowerPageName.startsWith(lowerEx));
  });
}
