import { Queue } from "./queue";
import { EventEmitter } from "./emitter";
import {
  CartApi,
  type RequestBody,
  type RequestOptions,
  type RequestResult,
} from "./api";

const emitter = new EventEmitter("liquid-ajax-cart");

const api: CartApi = new CartApi({
  onStart: (ctx) => emitter.emit("request-start", ctx, api),
  onEnd: (ctx) => emitter.emit("request-end", ctx, api),
});

const queue = new Queue({
  onStart: () => emitter.emit("queue-start", {}, api),
  onEnd: () => emitter.emit("queue-end", {}, api),
  // onIdle is sync — fire-and-forget the emit (its async tail runs after).
  onIdle: () => void emitter.emit("queue-idle", {}, api),
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
