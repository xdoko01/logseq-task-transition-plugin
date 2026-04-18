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
