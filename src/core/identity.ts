export type Identity = { key: "line" | "id"; value: string };

// Shopify line indices are 1-based integers; item keys are always
// `variantId:hash`. The two languages are disjoint, so the check is decidable —
// unlike v2's `length > 3` heuristic, under which line="1000" became a key.
//
// A leading zero is normalized away, not rejected: Shopify's cart/change.js
// treats `line=01` the same as `line=1`, so "01" is an alternate spelling of a
// real line index, not malformed input. Stripped via string manipulation
// rather than `Number()` — a round trip through Number() is a known way to
// mangle a large digit string elsewhere in this codebase (quantity-input.ts's
// commit()) and there is no reason to reintroduce that risk here. The
// lookahead keeps a bare "0" (or "00") unchanged so it still falls through to
// rejection below — there is no line 0 — rather than stripping it to "".
export function parseIdentity(raw: string): Identity | null {
  const value = raw.trim();
  if (/^[0-9]+$/.test(value)) {
    const line = value.replace(/^0+(?=[0-9])/, "");
    if (line !== "0") return { key: "line", value: line };
  }
  if (value.includes(":")) return { key: "id", value };
  return null;
}
