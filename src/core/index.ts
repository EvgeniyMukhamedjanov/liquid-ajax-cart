import { Queue } from "./queue";
import { EventEmitter, type Listener } from "./emitter";
import { CartApi, type RequestBody, type RequestOptions, type RequestResult } from "./api";

export const EVENTS = {
  REQUEST_START: "liquid-ajax-cart:request-start",
  REQUEST_END: "liquid-ajax-cart:request-end",
  QUEUE_START: "liquid-ajax-cart:queue-start",
  QUEUE_END: "liquid-ajax-cart:queue-end",
  QUEUE_IDLE: "liquid-ajax-cart:queue-idle",
} as const;

const emitter = new EventEmitter();

const api: CartApi = new CartApi({
  onStart: (ctx) => emitter.emit(EVENTS.REQUEST_START, ctx, api),
  onEnd: (ctx) => emitter.emit(EVENTS.REQUEST_END, ctx, api),
});

// A single queue step still running this long has most likely deadlocked.
const QUEUE_STUCK_SECONDS = 10;

// TODO: add a link to docs about deadlocks
const QUEUE_STUCK_WARNING =
  `Liquid Ajax Cart: the cart queue has been stuck for over ${QUEUE_STUCK_SECONDS}s — ` +
  `possible deadlock. Calling a queued method (liquidAjaxCart.add/change/update/clear/` +
  `get) from inside task() or a queue-start/queue-end listener deadlocks the queue; ` +
  `use the api passed to your callback instead.`;

const queue = new Queue({
  onStart: () => emitter.emit(EVENTS.QUEUE_START, {}, api),
  onEnd: () => emitter.emit(EVENTS.QUEUE_END, {}, api),
  onIdle: () => document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} })),
  slowAfterMs: QUEUE_STUCK_SECONDS * 1000,
  onSlow: () => console.warn(QUEUE_STUCK_WARNING),
});

export function task<T>(fn: (api: CartApi) => Promise<T>): Promise<T> {
  return queue.enqueue(() => fn(api));
}

export function add(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
  return task(async (api) => api.add(body, options));
}

export function change(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
  return task(async (api) => api.change(body, options));
}

export function update(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
  return task(async (api) => api.update(body, options));
}

export function clear(options?: RequestOptions): Promise<RequestResult> {
  return task(async (api) => api.clear(options));
}

export function get(options?: RequestOptions): Promise<RequestResult> {
  return task(async (api) => api.get(options));
}

export function isProcessing(): boolean {
  return queue.isProcessing;
}

export function on(event: string, fn: Listener): void {
  emitter.on(event, fn);
}
