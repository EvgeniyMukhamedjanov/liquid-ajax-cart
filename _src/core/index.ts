import { Queue } from "./queue";
import { EventEmitter } from "./events";
import { CartRequest } from "./request";
import type {
  AddBody,
  ChangeBody,
  UpdateBody,
  RequestOptions,
  CartRequestResult,
  CartApi,
} from "./types";

export type { CartApi, CartRequestResult, RequestOptions };

const events = new EventEmitter("liquid-ajax-cart");
const request = new CartRequest((event, detail): Promise<void> => {
  return events.emit(event, detail, request);
});

const queue = new Queue({
  onStart() {
    return events.emit("queue-start", {}, request);
  },
  onEnd() {
    return events.emit("queue-end", {}, request);
  },
});

export function task<T>(fn: (ctx: CartApi) => Promise<T>): Promise<T> {
  checkForDeadlock(fn);
  return queue.enqueue(() => fn(request));
}

export function add(
  body: AddBody | FormData | URLSearchParams,
  options?: RequestOptions,
): Promise<CartRequestResult> {
  return task(async (ctx) => ctx.add(body, options));
}

export function change(
  body: ChangeBody | FormData | URLSearchParams,
  options?: RequestOptions,
): Promise<CartRequestResult> {
  return task(async (ctx) => ctx.change(body, options));
}

export function update(
  body: UpdateBody | FormData | URLSearchParams,
  options?: RequestOptions,
): Promise<CartRequestResult> {
  return task(async (ctx) => ctx.update(body, options));
}

export function clear(options?: RequestOptions): Promise<CartRequestResult> {
  return task(async (ctx) => ctx.clear(options));
}

export function get(options?: RequestOptions): Promise<CartRequestResult> {
  return task(async (ctx) => ctx.get(options));
}

export function isProcessing(): boolean {
  return queue.isProcessing;
}

// --- Deadlock detection ---

const QUEUED_METHOD_PATTERN =
  /liquidAjaxCart\.(add|change|update|clear|get)\s*\(/;

function checkForDeadlock<T>(fn: (ctx: CartApi) => Promise<T>): void {
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
