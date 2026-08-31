import { describe, it, expect } from "vitest";
import { parseIdentity } from "./identity";

describe("parseIdentity", () => {
  it("reads a positive integer as a line index", () => {
    expect(parseIdentity("3")).toEqual({ key: "line", value: "3" });
    expect(parseIdentity("1000")).toEqual({ key: "line", value: "1000" });
  });

  it("reads a value containing a colon as an item key", () => {
    expect(parseIdentity("39897499729974:d0e2a4")).toEqual({
      key: "id",
      value: "39897499729974:d0e2a4",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseIdentity("  4  ")).toEqual({ key: "line", value: "4" });
  });

  it("rejects empty, zero, and anything else", () => {
    expect(parseIdentity("")).toBeNull();
    expect(parseIdentity("   ")).toBeNull();
    expect(parseIdentity("0")).toBeNull();
    expect(parseIdentity("-2")).toBeNull();
    expect(parseIdentity("abc")).toBeNull();
  });

  // Corrected from an earlier version of this test that rejected these:
  // Shopify's cart/change.js treats `line=01` the same as `line=1`, so "01" is
  // an alternate spelling of a real line index, not malformed input. Rejecting
  // it client-side would be stricter than the server for no reason.
  it("normalizes a leading zero to the equivalent line index", () => {
    expect(parseIdentity("03")).toEqual({ key: "line", value: "3" });
    expect(parseIdentity("007")).toEqual({ key: "line", value: "7" });
    expect(parseIdentity("01")).toEqual({ key: "line", value: "1" });
  });

  // "00" strips to "" under a naive `value.replace(/^0+/, "")` — the lookahead
  // in parseIdentity's regex exists specifically so an all-zero string is left
  // unchanged and falls through to rejection, rather than being stripped to an
  // empty string and read as a line index of "".
  it("still rejects an all-zero value, however padded", () => {
    expect(parseIdentity("00")).toBeNull();
    expect(parseIdentity("000")).toBeNull();
  });

  it("leaves a value with no leading zero unaffected", () => {
    expect(parseIdentity("10")).toEqual({ key: "line", value: "10" });
    expect(parseIdentity("100")).toEqual({ key: "line", value: "100" });
  });
});
