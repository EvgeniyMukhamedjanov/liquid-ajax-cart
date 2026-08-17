/**
 * Teaches TypeScript what `document.addEventListener` hands a listener for each
 * Liquid Ajax Cart event, so `event.detail` reads without a cast.
 *
 * `DocumentEventMap` is an open interface in TypeScript's own `lib.dom.d.ts`
 * (`interface DocumentEventMap extends GlobalEventHandlersEventMap`). `Document`
 * declares two `addEventListener` overloads: a generic one keyed on that map, and
 * a `type: string` fallback whose listener receives a bare `Event`. Our event
 * names are not keys of the stock map, so every listener hit the fallback and had
 * to cast to reach `.detail`. Re-opening the interface here through
 * `declare global` merges these keys in, and the generic overload wins instead.
 *
 * **This is a claim the compiler cannot check.** Nothing verifies that what
 * `core.ts` actually dispatches matches what is written below; keep the two in
 * step by hand. The gain is not safety, it is that there is now one place to be
 * wrong instead of one per listener. The assertion at the bottom recovers the
 * part that *is* checkable — that every event in `EVENTS` has an entry.
 */
import type { EVENTS } from "./core";
import type { WaitUntilEvent } from "./emitter";
import type { RequestStartContext, RequestEndContext } from "./api";

/** The `detail` of an event that carries no payload. */
type EmptyDetail = Record<string, never>;

declare global {
  interface DocumentEventMap {
    "liquid-ajax-cart:request-start": WaitUntilEvent<RequestStartContext>;
    "liquid-ajax-cart:request-end": WaitUntilEvent<RequestEndContext>;
    "liquid-ajax-cart:queue-start": WaitUntilEvent<EmptyDetail>;
    "liquid-ajax-cart:queue-end": WaitUntilEvent<EmptyDetail>;
    // A plain CustomEvent, not a WaitUntilEvent: core.ts dispatches this one
    // directly rather than through the emitter, so it has no internal
    // subscribers and no waitUntil(). The difference is invisible at the call
    // site and would otherwise only surface as a runtime TypeError.
    "liquid-ajax-cart:queue-idle": CustomEvent<EmptyDetail>;
  }
}

/**
 * Fails the build if an event is added to `EVENTS` without an entry above.
 * Interface keys must be literals, so the names are duplicated between the two —
 * this is what stops them drifting apart.
 */
type AssertMapped<T extends keyof DocumentEventMap> = T;
type _EveryEventIsMapped = AssertMapped<(typeof EVENTS)[keyof typeof EVENTS]>;
