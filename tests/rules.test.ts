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

  it("filters out entries with invalid marker values for 'from' or 'to'", () => {
    expect(
      parseCustomRules('[{"from":"BOGUS","to":"DOING","property":"started"}]')
    ).toHaveLength(0);
    expect(
      parseCustomRules('[{"from":"TODO","to":"INVALID","property":"started"}]')
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

  it("matches case-insensitively for exact page names", () => {
    expect(isPageExcluded("Inbox", ["inbox"])).toBe(true);
  });

  it("matches case-insensitively for namespace prefixes", () => {
    expect(isPageExcluded("Templates/Daily", ["templates/"])).toBe(true);
  });
});
