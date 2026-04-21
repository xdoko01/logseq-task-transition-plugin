import { describe, it, expect } from "vitest";
import { detectTransitionsFromDatoms } from "../src/detector";
import type { Datom } from "../src/detector";

const singleBlock = [{ id: 1, uuid: "uuid-1" }];

describe("detectTransitionsFromDatoms", () => {
  it("detects a TODO → DOING transition", () => {
    const datoms: Datom[] = [
      [1, "block/marker", "TODO", 100, false],
      [1, "block/marker", "DOING", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
      { blockUuid: "uuid-1", from: "TODO", to: "DOING" },
    ]);
  });

  it("detects a DOING → DONE transition", () => {
    const datoms: Datom[] = [
      [1, "block/marker", "DOING", 100, false],
      [1, "block/marker", "DONE", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
      { blockUuid: "uuid-1", from: "DOING", to: "DONE" },
    ]);
  });

  it("ignores non-marker datoms", () => {
    const datoms: Datom[] = [
      [1, "block/content", "some content", 100, true],
      [1, "block/updated-at", 1234567890, 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
  });

  it("ignores a block that only has a new marker with no old marker (fresh task creation)", () => {
    const datoms: Datom[] = [
      [1, "block/marker", "TODO", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
  });

  it("ignores a block where old and new marker are the same", () => {
    const datoms: Datom[] = [
      [1, "block/marker", "TODO", 100, false],
      [1, "block/marker", "TODO", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
  });

  it("ignores blocks whose id is not in the blocks list", () => {
    const datoms: Datom[] = [
      [999, "block/marker", "TODO", 100, false],
      [999, "block/marker", "DOING", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toHaveLength(0);
  });

  it("handles multiple blocks transitioning in the same DB change", () => {
    const blocks = [
      { id: 1, uuid: "uuid-1" },
      { id: 2, uuid: "uuid-2" },
    ];
    const datoms: Datom[] = [
      [1, "block/marker", "TODO", 100, false],
      [1, "block/marker", "DOING", 100, true],
      [2, "block/marker", "DOING", 100, false],
      [2, "block/marker", "DONE", 100, true],
    ];
    const result = detectTransitionsFromDatoms(datoms, blocks);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ blockUuid: "uuid-1", from: "TODO", to: "DOING" });
    expect(result).toContainEqual({ blockUuid: "uuid-2", from: "DOING", to: "DONE" });
  });

  it("handles mixed marker and non-marker datoms for same block", () => {
    const datoms: Datom[] = [
      [1, "block/content", "DOING updated task", 100, true],
      [1, "block/marker", "TODO", 100, false],
      [1, "block/marker", "DOING", 100, true],
    ];
    expect(detectTransitionsFromDatoms(datoms, singleBlock)).toEqual([
      { blockUuid: "uuid-1", from: "TODO", to: "DOING" },
    ]);
  });
});
