declare global {
  interface Window {
    Shopify?: {
      routes?: { root?: string };
    };
  }
}

export type RequestBody = Record<string, unknown> | FormData | URLSearchParams;

export type RequestTrigger = {
  source: string;
  initiator?: Element;
};

export type RequestOptions = {
  signal?: AbortSignal;
  trigger?: RequestTrigger;
  meta?: Record<string, unknown>;
};

export type RequestResult = {
  ok: boolean;
  status: number | null;
  body: Record<string, unknown> | null;
  /**
   * The request was deliberately called off — by a caller's `signal` or by a
   * `request-start` subscriber calling `abort()` — rather than failing.
   *
   * Exists so modules that surface errors to shoppers can stay silent: nobody
   * needs to be told about a request they themselves cancelled. Without it a
   * cancellation is indistinguishable from a network failure, since both
   * produce `{ok: false, status: null, body: null}`. v2 carried the same
   * distinction as `info.cancel` and checked it before rendering
   * (`_src-old/messages.ts:113`).
   *
   * **A timeout is not a cancellation.** `AbortSignal.timeout()` aborts the
   * signal too, but a request that ran out of time is a real failure the
   * shopper should hear about, exactly like a dropped connection. So this is
   * `false` for timeouts, and they fall in with network failures.
   *
   * This is one bit rather than an outcome enum because one bit is all any
   * consumer branches on: suppress, or report. Timeouts and network failures
   * are treated identically, so naming them apart would expose a distinction
   * nothing acts on.
   *
   * **Neither the signal nor the abort reason is carried**, and neither is the
   * decision left to whoever aborted. `request-end` is a broadcast event, so
   * the party that aborts is not the party that renders — a merchant calling
   * `detail.abort()` from a `request-start` listener has no handle on the error
   * modules downstream. The decision has to travel with the result. Carrying
   * the signal instead would also publish this internal controller as contract,
   * make an otherwise inert result non-cloneable, and make the wrong check
   * (`signal.aborted`, which mis-reports timeouts) the easiest one to write.
   *
   * If a module ever needs to know *why* a request was called off, add
   * `cause?: unknown` — additive and non-breaking — rather than the signal.
   */
  cancelled: boolean;
};

/**
 * Type guard for a plain object, used to narrow untyped JSON (`any` from
 * `response.json()`) at the single boundary where it enters the typed world.
 * Arrays, primitives, and null are rejected — the Shopify Cart API always returns
 * a JSON object (success or error), so anything else is malformed and unusable.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether an aborted signal represents a deliberate cancellation rather than a
 * timeout.
 *
 * `AbortSignal.timeout()` aborts with a `TimeoutError` DOMException, while
 * `controller.abort()` aborts with an `AbortError` (or whatever reason the
 * caller passed). Reading `signal.reason` is the only way to tell them apart —
 * `signal.aborted` is `true` for both. The check lives here, once, rather than
 * at every consumer that would otherwise have to sniff the reason itself.
 */
function isCancellation(signal: AbortSignal): boolean {
  if (!signal.aborted) return false;
  const reason: unknown = signal.reason;
  return !(reason instanceof DOMException && reason.name === "TimeoutError");
}

const ENDPOINTS = {
  add: { path: "cart/add.js", httpMethod: "POST" },
  change: { path: "cart/change.js", httpMethod: "POST" },
  update: { path: "cart/update.js", httpMethod: "POST" },
  clear: { path: "cart/clear.js", httpMethod: "POST" },
  get: { path: "cart.js", httpMethod: "GET" },
} as const;

export type Endpoint = keyof typeof ENDPOINTS;

// Exported because these are the `detail` of the public `request-start` /
// `request-end` DOM events — see core/events.d.ts, which maps them onto
// DocumentEventMap so listeners read `event.detail` without a cast. Kept
// internal, every listener had to re-declare the shape by hand, and each
// re-declaration was free to get it wrong.
export type RequestStartContext = {
  endpoint: Endpoint;
  body: RequestBody | null;
  trigger?: RequestTrigger;
  meta: Record<string, unknown>;
  abort: (reason?: unknown) => void;
};

export type RequestEndContext = Omit<RequestStartContext, "abort"> & {
  result: RequestResult;
};

type RequestHooks = {
  onStart?: (ctx: RequestStartContext) => Promise<void>;
  onEnd?: (ctx: RequestEndContext) => Promise<void>;
};

function buildRequestInit(
  endpoint: Endpoint,
  body: RequestBody | null,
  signal: AbortSignal,
): RequestInit {
  const init: RequestInit = {
    method: ENDPOINTS[endpoint].httpMethod,
    signal,
  };

  if (endpoint === "get") return init;

  if (body instanceof FormData || body instanceof URLSearchParams) {
    init.headers = { "X-Requested-With": "XMLHttpRequest" };
    init.body = body;
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body ?? {});
  }

  return init;
}

export class CartApi {
  #hooks: RequestHooks;

  constructor(hooks: RequestHooks = {}) {
    this.#hooks = hooks;
  }

  add(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
    return this.#request("add", body, options);
  }

  change(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
    return this.#request("change", body, options);
  }

  update(body: RequestBody, options?: RequestOptions): Promise<RequestResult> {
    return this.#request("update", body, options);
  }

  clear(options?: RequestOptions): Promise<RequestResult> {
    return this.#request("clear", null, options);
  }

  get(options?: RequestOptions): Promise<RequestResult> {
    return this.#request("get", null, options);
  }

  async #request(
    endpoint: Endpoint,
    body: RequestBody | null,
    options: RequestOptions | undefined,
  ): Promise<RequestResult> {
    const meta = options?.meta ?? {};
    const trigger = options?.trigger;

    const controller = new AbortController();
    const callerSignal = options?.signal;
    let removeSignalListener: (() => void) | undefined;

    if (callerSignal) {
      if (callerSignal.aborted) {
        controller.abort(callerSignal.reason);
      } else {
        const onCallerAbort = () => controller.abort(callerSignal.reason);
        callerSignal.addEventListener("abort", onCallerAbort);
        removeSignalListener = () => callerSignal.removeEventListener("abort", onCallerAbort);
      }
    }

    const signal = controller.signal;
    const abort = (reason?: unknown) => controller.abort(reason);

    await this.#hooks.onStart?.({ endpoint, body, trigger, meta, abort });

    let result: RequestResult;

    if (signal.aborted) {
      result = { ok: false, status: null, body: null, cancelled: isCancellation(signal) };
    } else {
      try {
        const root = window.Shopify?.routes?.root ?? "/";
        const url = `${root}${ENDPOINTS[endpoint].path}`;
        const init = buildRequestInit(endpoint, body, signal);
        const response = await fetch(url, init);

        let responseBody: Record<string, unknown> | null = null;
        try {
          const raw: unknown = await response.json();
          responseBody = isRecord(raw) ? raw : null;
        } catch {
          // Some responses may not have JSON body
        }

        result = {
          ok: response.ok,
          status: response.status,
          body: responseBody,
          cancelled: false,
        };
      } catch {
        // Network error, or an abort that landed after fetch was already in
        // flight. isCancellation() reads the signal rather than sniffing the
        // rejection: fetch rejects with an AbortError only once the signal is
        // aborted, a network failure leaves it untouched, and a timeout aborts
        // it with a TimeoutError that must NOT count as a cancellation.
        result = { ok: false, status: null, body: null, cancelled: isCancellation(signal) };
      }
    }

    removeSignalListener?.();

    await this.#hooks.onEnd?.({ endpoint, body, trigger, meta, result });

    return result;
  }
}
