export type AddBody =
  | { items: AddItemBody[] }
  | AddItemBody;

export type AddItemBody = {
  id: number;
  quantity?: number;
  selling_plan?: number;
  properties?: Record<string, string>;
  [key: string]: unknown;
};

export type ChangeBody = {
  id: string | number;
  quantity: number;
  [key: string]: unknown;
};

export type UpdateBody = {
  updates?: Record<string, number>;
  note?: string;
  attributes?: Record<string, string>;
  [key: string]: unknown;
};

export type RequestBody = AddBody | ChangeBody | UpdateBody | FormData | URLSearchParams;

export type RequestOptions = {
  signal?: AbortSignal;
  info?: Record<string, unknown>;
};

export type CartRequestResult = {
  ok: boolean;
  status: number | null;
  body: object | null;
};

export type CartMethod = 'add' | 'change' | 'update' | 'clear' | 'get';

export type CartApi = {
  add: (body: AddBody | FormData | URLSearchParams, options?: RequestOptions) => Promise<CartRequestResult>;
  change: (body: ChangeBody | FormData | URLSearchParams, options?: RequestOptions) => Promise<CartRequestResult>;
  update: (body: UpdateBody | FormData | URLSearchParams, options?: RequestOptions) => Promise<CartRequestResult>;
  clear: (options?: RequestOptions) => Promise<CartRequestResult>;
  get: (options?: RequestOptions) => Promise<CartRequestResult>;
};
