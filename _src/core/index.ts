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

const queue = new Queue({
  onStart: () => emitter.emit(EVENTS.QUEUE_START, {}, api),
  onEnd: () => emitter.emit(EVENTS.QUEUE_END, {}, api),
  onIdle: () => document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} })),
});

export function task<T>(fn: (api: CartApi) => Promise<T>): Promise<T> {
  checkForDeadlock(fn);
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

// --- Deadlock detection ---

const QUEUED_METHOD_PATTERN = /liquidAjaxCart\.(add|change|update|clear|get)\s*\(/;

function checkForDeadlock<T>(fn: (api: CartApi) => Promise<T>): void {
  try {
    const source = fn.toString();
    if (QUEUED_METHOD_PATTERN.test(source)) {
      console.warn(
        "Liquid Ajax Cart: possible deadlock — use ctx.add/change/update/clear/get inside task(), not liquidAjaxCart.add/etc.",
      );
    }
  } catch {
    // toString() may not be available in all environments
  }
}
