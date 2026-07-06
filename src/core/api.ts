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

const ENDPOINTS = {
  add: { path: "cart/add.js", httpMethod: "POST" },
  change: { path: "cart/change.js", httpMethod: "POST" },
  update: { path: "cart/update.js", httpMethod: "POST" },
  clear: { path: "cart/clear.js", httpMethod: "POST" },
  get: { path: "cart.js", httpMethod: "GET" },
} as const;

type Endpoint = keyof typeof ENDPOINTS;

type RequestStartContext = {
  endpoint: Endpoint;
  body: RequestBody | null;
  trigger?: RequestTrigger;
  meta: Record<string, unknown>;
  abort: (reason?: unknown) => void;
};

type RequestEndContext = Omit<RequestStartContext, "abort"> & {
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
      result = { ok: false, status: null, body: null };
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
        };
      } catch {
        // Network error or abort
        // TODO: handle abort differently, add error, abort info
        result = { ok: false, status: null, body: null };
      }
    }

    removeSignalListener?.();

    await this.#hooks.onEnd?.({ endpoint, body, trigger, meta, result });

    return result;
  }
}
