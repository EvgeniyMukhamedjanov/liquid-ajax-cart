import type {
  AddBody,
  ChangeBody,
  UpdateBody,
  RequestOptions,
  CartRequestResult,
  CartMethod,
} from './types';

type EmitFn = (event: string, detail: Record<string, unknown>) => Promise<void>;

const ENDPOINTS: Record<CartMethod, string> = {
  add: '/cart/add.js',
  change: '/cart/change.js',
  update: '/cart/update.js',
  clear: '/cart/clear.js',
  get: '/cart.js',
};

const HTTP_METHODS: Record<CartMethod, string> = {
  add: 'POST',
  change: 'POST',
  update: 'POST',
  clear: 'POST',
  get: 'GET',
};

function buildRequestInit(
  method: CartMethod,
  body?: AddBody | ChangeBody | UpdateBody | FormData | URLSearchParams,
  signal?: AbortSignal,
): RequestInit {
  const init: RequestInit = {
    method: HTTP_METHODS[method],
    signal,
  };

  if (method === 'get') return init;

  if (body instanceof FormData || body instanceof URLSearchParams) {
    init.body = body;
  } else {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body ?? {});
  }

  return init;
}

export class CartRequest {
  private emit: EmitFn;

  constructor(emit: EmitFn) {
    this.emit = emit;
  }

  add(body: AddBody | FormData | URLSearchParams, options?: RequestOptions): Promise<CartRequestResult> {
    return this.request('add', body, options);
  }

  change(body: ChangeBody | FormData | URLSearchParams, options?: RequestOptions): Promise<CartRequestResult> {
    return this.request('change', body, options);
  }

  update(body: UpdateBody | FormData | URLSearchParams, options?: RequestOptions): Promise<CartRequestResult> {
    return this.request('update', body, options);
  }

  clear(options?: RequestOptions): Promise<CartRequestResult> {
    return this.request('clear', undefined, options);
  }

  get(options?: RequestOptions): Promise<CartRequestResult> {
    return this.request('get', undefined, options);
  }

  private async request(
    method: CartMethod,
    body: AddBody | ChangeBody | UpdateBody | FormData | URLSearchParams | undefined,
    options: RequestOptions | undefined,
  ): Promise<CartRequestResult> {
    const info = options?.info ?? {};

    await this.emit('request-start', { method, body: body ?? null, info });

    let result: CartRequestResult;

    try {
      const url = ENDPOINTS[method];
      const init = buildRequestInit(method, body, options?.signal);
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

    await this.emit('request-end', { method, body: body ?? null, info, result });

    return result;
  }
}
