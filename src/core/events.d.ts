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
 * The payload types come from `CartEventDetailMap` in core.ts, which `on()` is
 * also keyed on — one source of truth for both subscription paths. Only the
 * event *names* are repeated below, because an interface cannot be written as a
 * mapped type; the assertion at the bottom is what stops those drifting.
 *
 * **What is written here is still a claim the compiler cannot check.** Nothing
 * verifies that the events core.ts really dispatches carry these details. The
 * gain is not safety, it is that there is now one place to be wrong instead of
 * one per listener.
 */
import type { EVENTS, CartEventDetailMap } from "./core";
import type { WaitUntilEvent } from "./emitter";

declare global {
  interface DocumentEventMap {
    "liquid-ajax-cart:request-start": WaitUntilEvent<
      CartEventDetailMap["liquid-ajax-cart:request-start"]
    >;
    "liquid-ajax-cart:request-end": WaitUntilEvent<
      CartEventDetailMap["liquid-ajax-cart:request-end"]
    >;
    "liquid-ajax-cart:queue-start": WaitUntilEvent<
      CartEventDetailMap["liquid-ajax-cart:queue-start"]
    >;
    "liquid-ajax-cart:queue-end": WaitUntilEvent<CartEventDetailMap["liquid-ajax-cart:queue-end"]>;
    // A plain CustomEvent, not a WaitUntilEvent: core.ts dispatches this one
    // directly rather than through the emitter, so it has no internal
    // subscribers and no waitUntil(). The difference is invisible at the call
    // site and would otherwise only surface as a runtime TypeError.
    "liquid-ajax-cart:queue-idle": CustomEvent<CartEventDetailMap["liquid-ajax-cart:queue-idle"]>;
  }
}

/**
 * Fails the build if an event is added to `EVENTS` without an entry above.
 * `CartEventDetailMap` is keyed off `EVENTS` directly and so cannot drift; this
 * interface must repeat the names, so it needs the check.
 */
type AssertMapped<T extends keyof DocumentEventMap> = T;
type _EveryEventIsMapped = AssertMapped<(typeof EVENTS)[keyof typeof EVENTS]>;
