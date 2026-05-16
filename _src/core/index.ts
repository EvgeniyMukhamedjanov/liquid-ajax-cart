import { Queue } from "./queue";
import { EventEmitter } from "./emitter";
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

// A queued request still running this long has most likely deadlocked.
const SLOW_REQUEST_SECONDS = 10;

// TODO: add a link to docs about deadlocks
const SLOW_REQUEST_WARNING =
  `Liquid Ajax Cart: a queued request has been running for over ` +
  `${SLOW_REQUEST_SECONDS}s — possible deadlock. Calling ` +
  `liquidAjaxCart.add/change/update/clear/get inside task() deadlocks ` +
  `the queue; use the methods on the task() context instead.`;

const queue = new Queue({
  onStart: () => emitter.emit(EVENTS.QUEUE_START, {}, api),
  onEnd: () => emitter.emit(EVENTS.QUEUE_END, {}, api),
  onIdle: () => document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} })),
  itemSlowAfterMs: SLOW_REQUEST_SECONDS * 1000,
  onItemSlow: () => console.warn(SLOW_REQUEST_WARNING),
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
