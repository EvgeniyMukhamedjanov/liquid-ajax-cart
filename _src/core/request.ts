export type RequestBody = Record<string, unknown> | FormData | URLSearchParams;

export type RequestOptions = {
  signal?: AbortSignal;
  meta?: Record<string, unknown>;
};

export type RequestResult = {
  ok: boolean;
  status: number | null;
  body: object | null;
};

const ENDPOINTS = {
  add: { url: "/cart/add.js", httpMethod: "POST" },
  change: { url: "/cart/change.js", httpMethod: "POST" },
  update: { url: "/cart/update.js", httpMethod: "POST" },
  clear: { url: "/cart/clear.js", httpMethod: "POST" },
  get: { url: "/cart.js", httpMethod: "GET" },
} as const;

type Endpoint = keyof typeof ENDPOINTS;

type RequestStartContext = {
  endpoint: Endpoint;
  body: RequestBody | null;
  meta: Record<string, unknown>;
};

type RequestEndContext = RequestStartContext & {
  result: RequestResult;
};

type RequestHooks = {
  onStart?: (ctx: RequestStartContext) => Promise<void>;
  onEnd?: (ctx: RequestEndContext) => Promise<void>;
};

function buildRequestInit(
  endpoint: Endpoint,
  body: RequestBody | null,
  signal?: AbortSignal,
): RequestInit {
  const init: RequestInit = {
    method: ENDPOINTS[endpoint].httpMethod,
    signal,
  };

  if (endpoint === "get") return init;

  if (body instanceof FormData || body instanceof URLSearchParams) {
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

    await this.#hooks.onStart?.({ endpoint, body, meta });

    let result: RequestResult;

    try {
      const url = ENDPOINTS[endpoint].url;
      const init = buildRequestInit(endpoint, body, options?.signal);
      const response = await fetch(url, init);

      let responseBody: object | null = null;
      try {
        responseBody = await response.json();
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
      result = { ok: false, status: null, body: null };
    }

    await this.#hooks.onEnd?.({ endpoint, body, meta, result });

    return result;
  }
}
