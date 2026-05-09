import { Queue } from "./queue";
import { EventEmitter } from "./events";
import {
  CartApi,
  type RequestBody,
  type RequestOptions,
  type RequestResult,
} from "./api";

const events = new EventEmitter("liquid-ajax-cart");

const api: CartApi = new CartApi({
  onStart: (ctx) => events.emit("request-start", ctx, api),
  onEnd: (ctx) => events.emit("request-end", ctx, api),
});

const queue = new Queue({
  onStart: () => events.emit("queue-start", {}, api),
  onEnd: () => events.emit("queue-end", {}, api),
});

export function task<T>(fn: (api: CartApi) => Promise<T>): Promise<T> {
  checkForDeadlock(fn);
  return queue.enqueue(() => fn(api));
}

export function add(
  body: RequestBody,
  options?: RequestOptions,
): Promise<RequestResult> {
  return task(async (api) => api.add(body, options));
}

export function change(
  body: RequestBody,
  options?: RequestOptions,
): Promise<RequestResult> {
  return task(async (api) => api.change(body, options));
}

export function update(
  body: RequestBody,
  options?: RequestOptions,
): Promise<RequestResult> {
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

const QUEUED_METHOD_PATTERN =
  /liquidAjaxCart\.(add|change|update|clear|get)\s*\(/;

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
