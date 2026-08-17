import { applyContent, clearContent } from "./apply-content";
import type {
  RequestBody,
  RequestResult,
  RequestStartContext,
  RequestEndContext,
} from "../core";

const FRAGMENT_ATTR = "data-ajax-cart-fragment";
const SECTIONS_PER_REQUEST = 5;

export function parseToken(value: string | null): { sectionId: string; name: string } | null {
  if (!value) return null;
  const slash = value.indexOf("/");
  if (slash <= 0 || slash >= value.length - 1) return null;
  return { sectionId: value.slice(0, slash), name: value.slice(slash + 1) };
}

export function collectSectionIds(root: ParentNode = document): string[] {
  const ids = new Set<string>();
  root.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((el) => {
    const token = parseToken(el.getAttribute(FRAGMENT_ATTR));
    if (token) ids.add(token.sectionId);
  });
  return [...ids];
}

export function renderSections(
  sections: Record<string, string>,
  root: ParentNode = document,
): void {
  const parser = new DOMParser();
  for (const [sectionId, html] of Object.entries(sections)) {
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll('img[loading="lazy"]').forEach((img) => img.removeAttribute("loading"));

    const sources = new Map<string, Element>();
    doc.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((source) => {
      const token = parseToken(source.getAttribute(FRAGMENT_ATTR));
      if (!token || token.sectionId !== sectionId) return;
      if (sources.has(token.name)) {
        console.warn(
          `Liquid Ajax Cart: duplicate fragment "${sectionId}/${token.name}" in the rendered section; using the first.`,
        );
        return;
      }
      sources.set(token.name, source);
    });

    root.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((target) => {
      const token = parseToken(target.getAttribute(FRAGMENT_ATTR));
      if (!token || token.sectionId !== sectionId) return;
      const source = sources.get(token.name);
      if (source) {
        applyContent(target, source);
      } else {
        console.warn(
          `Liquid Ajax Cart: fragment "${sectionId}/${token.name}" not found in the rendered "${sectionId}" section; clearing it.`,
        );
        clearContent(target);
      }
    });
  }
}

export function buildSectionsParam(existing: string | null, ids: string[]): string {
  const set = new Set<string>();
  for (const part of (existing ?? "").split(",")) {
    const trimmed = part.trim();
    if (trimmed) set.add(trimmed);
  }
  for (const id of ids) set.add(id);
  return [...set].slice(0, SECTIONS_PER_REQUEST).join(",");
}

export function injectSections(body: RequestBody, ids: string[]): void {
  if (body instanceof FormData || body instanceof URLSearchParams) {
    const existing = body.get("sections");
    body.set("sections", buildSectionsParam(existing == null ? null : String(existing), ids));
  } else if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const existing = typeof record.sections === "string" ? record.sections : null;
    record.sections = buildSectionsParam(existing, ids);
  }
}

// Copies only string-valued entries of an untrusted JSON payload into `into`,
// dropping (and warning about) anything else. Section HTML always arrives as a
// map of `sectionId -> htmlString`; validating at the boundary keeps a malformed
// value (object, number, null) from being coerced into garbage HTML downstream.
export function assignStringEntries(
  data: unknown,
  into: Record<string, string>,
  context: string,
): void {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    console.warn(`Liquid Ajax Cart: ${context} returned a non-object sections payload; ignoring.`);
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      into[key] = value;
    } else {
      console.warn(
        `Liquid Ajax Cart: section "${key}" from ${context} was not a string HTML value; ignoring.`,
      );
    }
  }
}

export async function fetchSections(ids: string[]): Promise<Record<string, string>> {
  const root = window.Shopify?.routes?.root ?? "/";
  const result: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += SECTIONS_PER_REQUEST) {
    const chunk = ids.slice(i, i + SECTIONS_PER_REQUEST);
    const url = `${root}?sections=${chunk.join(",")}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        assignStringEntries(await response.json(), result, `GET ${url}`);
      } else {
        console.warn(`Liquid Ajax Cart: GET ${url} returned ${response.status}.`);
      }
    } catch (err) {
      console.warn(`Liquid Ajax Cart: GET ${url} failed.`, err);
    }
  }
  return result;
}

export async function reconcile(
  result: RequestResult,
  fetchMissing: (ids: string[]) => Promise<Record<string, string>> = fetchSections,
  root: ParentNode = document,
): Promise<void> {
  if (result.status === null) return;

  const provided: Record<string, string> = {};
  const rawSections = result.body?.sections;
  if (rawSections !== undefined) {
    assignStringEntries(rawSections, provided, "the request response");
  }

  const onPageIds = collectSectionIds(root);
  const missing = onPageIds.filter((id) => !(id in provided));
  const fetched = missing.length ? await fetchMissing(missing) : {};

  for (const id of missing) {
    if (!(id in fetched)) {
      console.warn(
        `Liquid Ajax Cart: section "${id}" could not be rendered; its fragments are left unchanged.`,
      );
    }
  }

  renderSections({ ...provided, ...fetched }, root);
}

// These arrive through the internal emitter, whose Listener signature is
// `(detail: unknown)`, so a cast is still needed here — core/events.d.ts only
// types the public DOM path. What changed is the target: core/api.ts now exports
// the real context types, so this asserts the contract itself rather than a
// hand-written approximation of it that was free to drift.
export async function handleRequestStart(detail: unknown): Promise<void> {
  const { endpoint, body } = detail as RequestStartContext;
  if (endpoint === "get" || !body) return;
  const ids = collectSectionIds();
  if (ids.length) injectSections(body, ids);
}

export async function handleRequestEnd(detail: unknown): Promise<void> {
  await reconcile((detail as RequestEndContext).result);
}
