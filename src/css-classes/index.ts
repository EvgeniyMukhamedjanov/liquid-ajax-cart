// src/css-classes/index.ts
// Side-effect init: wire the module into the core request lifecycle.
//
// `document.addEventListener`, NOT core's internal `on()`, and that is a
// correctness requirement rather than a convenience. emitter.ts awaits every
// internal listener (`:49-57`) before dispatching the DOM event (`:65`), and the
// sections module subscribes internally with an awaited reconcile()
// (`sections.ts:165-167`) — so this module always runs after the render has
// fully completed, including any follow-up `GET /?sections=`.
//
// Reversed, a removal would flash: project() would strip the removing class,
// snapping the row back to full opacity, and only then would the render replace
// it. The DOM path also means this module's position in src/index.ts does not
// matter, unlike line-item-errors.
import { EVENTS } from "../core";
import {
  markInitialized,
  handleRequestStart,
  handleRequestEnd,
  handleQueueStart,
  handleQueueIdle,
} from "./css-classes";

markInitialized();

document.addEventListener(EVENTS.REQUEST_START, (event) => handleRequestStart(event.detail));
document.addEventListener(EVENTS.REQUEST_END, (event) => handleRequestEnd(event.detail));

// queue-idle rather than queue-end: queue.ts clears #running only after the
// queue-end hook, so the queue still reports busy throughout it.
document.addEventListener(EVENTS.QUEUE_START, handleQueueStart);
document.addEventListener(EVENTS.QUEUE_IDLE, handleQueueIdle);
