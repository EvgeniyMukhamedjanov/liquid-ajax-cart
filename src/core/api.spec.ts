import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { CartApi, type RequestResult } from "./api";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as any).Shopify;
});

function mockResponse(opts: { status?: number; body?: object | null; jsonThrows?: boolean } = {}) {
  const status = opts.status ?? 200;
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (opts.jsonThrows) throw new SyntaxError("Unexpected token");
      return opts.body ?? null;
    },
  } as Response);
}

function callArgs(call = 0): [string, RequestInit] {
  return fetchMock.mock.calls[call] as [string, RequestInit];
}

// =============================================================================
// HTTP request shape
// =============================================================================

test("add() POSTs to /cart/add.js with JSON body", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1, quantity: 2 });
  const [url, init] = callArgs();
  expect(url).toBe("/cart/add.js");
  expect(init.method).toBe("POST");
  expect(init.body).toBe(JSON.stringify({ id: 1, quantity: 2 }));
});

test("change() POSTs to /cart/change.js", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().change({ id: 1, quantity: 0 });
  expect(callArgs()[0]).toBe("/cart/change.js");
  expect(callArgs()[1].method).toBe("POST");
});

test("update() POSTs to /cart/update.js", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().update({ updates: { "1": 1 } });
  expect(callArgs()[0]).toBe("/cart/update.js");
  expect(callArgs()[1].method).toBe("POST");
});

test("clear() POSTs to /cart/clear.js with empty JSON body", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().clear();
  const [url, init] = callArgs();
  expect(url).toBe("/cart/clear.js");
  expect(init.method).toBe("POST");
  expect(init.body).toBe("{}");
});

test("get() GETs from /cart.js with no body", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().get();
  const [url, init] = callArgs();
  expect(url).toBe("/cart.js");
  expect(init.method).toBe("GET");
  expect(init.body).toBeUndefined();
  expect(init.headers).toBeUndefined();
});

test("plain-object body sets Content-Type: application/json (no X-Requested-With)", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 });
  expect(callArgs()[1].headers).toEqual({ "Content-Type": "application/json" });
});

test("FormData body sets X-Requested-With and is passed through (no Content-Type)", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  const fd = new FormData();
  fd.append("id", "1");
  await new CartApi().add(fd);
  const [, init] = callArgs();
  expect(init.body).toBe(fd);
  expect(init.headers).toEqual({ "X-Requested-With": "XMLHttpRequest" });
});

test("URLSearchParams body sets X-Requested-With and is passed through", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  const params = new URLSearchParams({ id: "1" });
  await new CartApi().add(params);
  const [, init] = callArgs();
  expect(init.body).toBe(params);
  expect(init.headers).toEqual({ "X-Requested-With": "XMLHttpRequest" });
});

// =============================================================================
// Locale routing (window.Shopify.routes.root)
// =============================================================================

test("window.Shopify undefined → URL prefix defaults to /", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 });
  expect(callArgs()[0]).toBe("/cart/add.js");
});

test('routes.root = "/" → URL is /cart/add.js', async () => {
  (window as any).Shopify = { routes: { root: "/" } };
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 });
  expect(callArgs()[0]).toBe("/cart/add.js");
});

test('routes.root = "/en/" → URL is prefixed', async () => {
  (window as any).Shopify = { routes: { root: "/en/" } };
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 });
  expect(callArgs()[0]).toBe("/en/cart/add.js");
});

test("window.Shopify exists but routes missing → falls back to /", async () => {
  (window as any).Shopify = {};
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 });
  expect(callArgs()[0]).toBe("/cart/add.js");
});

// =============================================================================
// Result shape
// =============================================================================

test("200 OK with JSON → result has ok/status/body", async () => {
  fetchMock.mockResolvedValue(mockResponse({ status: 200, body: { token: "abc" } }));
  const result = await new CartApi().get();
  expect(result).toEqual({ ok: true, status: 200, body: { token: "abc" } });
});

test("4xx response → result has ok=false with parsed body", async () => {
  fetchMock.mockResolvedValue(mockResponse({ status: 422, body: { description: "oops" } }));
  const result = await new CartApi().add({ id: 1 });
  expect(result).toEqual({ ok: false, status: 422, body: { description: "oops" } });
});

test("network error → result is full failure", async () => {
  fetchMock.mockRejectedValue(new TypeError("network"));
  const result = await new CartApi().add({ id: 1 });
  expect(result).toEqual({ ok: false, status: null, body: null });
});

test("non-JSON response body → body is null but ok/status preserved", async () => {
  fetchMock.mockResolvedValue(mockResponse({ status: 200, jsonThrows: true }));
  const result = await new CartApi().get();
  expect(result).toEqual({ ok: true, status: 200, body: null });
});

test("empty response body (null) → body is null", async () => {
  fetchMock.mockResolvedValue(mockResponse({ status: 200, body: null }));
  const result = await new CartApi().get();
  expect(result).toEqual({ ok: true, status: 200, body: null });
});

// =============================================================================
// Hook lifecycle
// =============================================================================

test("onStart fires before fetch with correct context", async () => {
  const order: string[] = [];
  let startCtx: any;
  fetchMock.mockImplementation(async () => {
    order.push("fetch");
    return mockResponse();
  });
  const api = new CartApi({
    onStart: async (ctx) => {
      order.push("start");
      startCtx = ctx;
    },
  });
  await api.add({ id: 1 });
  expect(order).toEqual(["start", "fetch"]);
  expect(startCtx.endpoint).toBe("add");
  expect(startCtx.body).toEqual({ id: 1 });
  expect(typeof startCtx.abort).toBe("function");
});

test("onEnd fires after fetch with result in context", async () => {
  let endCtx: any;
  fetchMock.mockResolvedValue(mockResponse({ status: 200, body: { ok: 1 } }));
  const api = new CartApi({
    onEnd: async (ctx) => {
      endCtx = ctx;
    },
  });
  await api.add({ id: 1 });
  expect(endCtx.endpoint).toBe("add");
  expect(endCtx.body).toEqual({ id: 1 });
  expect(endCtx.result).toEqual({ ok: true, status: 200, body: { ok: 1 } });
  expect(endCtx.abort).toBeUndefined();
});

test("onEnd fires when fetch fails", async () => {
  let endCtx: any;
  fetchMock.mockRejectedValue(new Error("boom"));
  const api = new CartApi({
    onEnd: async (ctx) => {
      endCtx = ctx;
    },
  });
  await api.add({ id: 1 });
  expect(endCtx.result).toEqual({ ok: false, status: null, body: null });
});

test("async onStart blocks fetch until resolved", async () => {
  const order: string[] = [];
  let releaseStart!: () => void;
  fetchMock.mockImplementation(async () => {
    order.push("fetch");
    return mockResponse();
  });
  const api = new CartApi({
    onStart: () =>
      new Promise<void>((resolve) => {
        order.push("start");
        releaseStart = resolve;
      }),
  });
  const promise = api.add({ id: 1 });
  await Promise.resolve();
  expect(order).toEqual(["start"]);
  releaseStart();
  await promise;
  expect(order).toEqual(["start", "fetch"]);
});

test("async onEnd blocks the returned promise until resolved", async () => {
  let releaseEnd!: () => void;
  let endStarted = false;
  let endFinished = false;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onEnd: () =>
      new Promise<void>((resolve) => {
        endStarted = true;
        releaseEnd = () => {
          endFinished = true;
          resolve();
        };
      }),
  });
  const promise = api.add({ id: 1 });
  await new Promise((r) => setTimeout(r, 0));
  expect(endStarted).toBe(true);
  expect(endFinished).toBe(false);
  releaseEnd();
  await promise;
  expect(endFinished).toBe(true);
});

test("hooks are optional — no error when undefined", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await expect(new CartApi().add({ id: 1 })).resolves.toBeDefined();
});

test("options.meta propagates to both hooks", async () => {
  let startMeta: unknown;
  let endMeta: unknown;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      startMeta = ctx.meta;
    },
    onEnd: async (ctx) => {
      endMeta = ctx.meta;
    },
  });
  await api.add({ id: 1 }, { meta: { initiator: "button-1" } });
  expect(startMeta).toEqual({ initiator: "button-1" });
  expect(endMeta).toEqual({ initiator: "button-1" });
});

test("meta is a shared mutable scratchpad — onStart mutations are visible in onEnd", async () => {
  let endMeta: Record<string, unknown> | undefined;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      ctx.meta.startedAt = 123;
    },
    onEnd: async (ctx) => {
      endMeta = ctx.meta;
    },
  });
  const passed = { initiator: "button-1" };
  await api.add({ id: 1 }, { meta: passed });
  expect(endMeta).toEqual({ initiator: "button-1", startedAt: 123 });
  // same object reference end-to-end — not a defensive copy
  expect(endMeta).toBe(passed);
});

test("missing meta defaults to {} in hook context", async () => {
  let startMeta: unknown;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      startMeta = ctx.meta;
    },
  });
  await api.add({ id: 1 });
  expect(startMeta).toEqual({});
});

test("options.trigger propagates to both hooks", async () => {
  let startTrigger: unknown;
  let endTrigger: unknown;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      startTrigger = ctx.trigger;
    },
    onEnd: async (ctx) => {
      endTrigger = ctx.trigger;
    },
  });
  await api.add({ id: 1 }, { trigger: { source: "product-form" } });
  expect(startTrigger).toEqual({ source: "product-form" });
  expect(endTrigger).toEqual({ source: "product-form" });
});

test("missing trigger stays undefined in hook context", async () => {
  let startTrigger: unknown = "unset";
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      startTrigger = ctx.trigger;
    },
  });
  await api.add({ id: 1 });
  expect(startTrigger).toBeUndefined();
});

// =============================================================================
// Abort behavior
// =============================================================================

test("pre-aborted caller signal → fetch not called, result is failure", async () => {
  const controller = new AbortController();
  controller.abort("pre");
  fetchMock.mockResolvedValue(mockResponse());
  const result = await new CartApi().add({ id: 1 }, { signal: controller.signal });
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result).toEqual({ ok: false, status: null, body: null });
});

test("caller-signal abort during fetch cancels the request", async () => {
  const callerController = new AbortController();
  fetchMock.mockImplementation((_url, init: RequestInit) => {
    return new Promise((_, reject) => {
      const sig = init.signal as AbortSignal;
      sig.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  });
  const promise = new CartApi().add({ id: 1 }, { signal: callerController.signal });
  await Promise.resolve();
  callerController.abort("user");
  const result = await promise;
  expect(result).toEqual({ ok: false, status: null, body: null });
});

test("subscriber abort() in onStart → fetch skipped, result is failure", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      ctx.abort("subscriber");
    },
  });
  const result = await api.add({ id: 1 });
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result).toEqual({ ok: false, status: null, body: null });
});

test("onEnd still fires after subscriber-triggered abort", async () => {
  let endCalled = false;
  let endResult: RequestResult | undefined;
  fetchMock.mockResolvedValue(mockResponse());
  const api = new CartApi({
    onStart: async (ctx) => {
      ctx.abort("cancel");
    },
    onEnd: async (ctx) => {
      endCalled = true;
      endResult = ctx.result;
    },
  });
  await api.add({ id: 1 });
  expect(endCalled).toBe(true);
  expect(endResult).toEqual({ ok: false, status: null, body: null });
});

test("caller-signal listener is removed after request completes", async () => {
  const controller = new AbortController();
  const removeSpy = vi.spyOn(controller.signal, "removeEventListener");
  fetchMock.mockResolvedValue(mockResponse());
  await new CartApi().add({ id: 1 }, { signal: controller.signal });
  expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
});

test("caller signal abort with reason propagates to fetch signal", async () => {
  const callerController = new AbortController();
  let fetchSignal: AbortSignal | undefined;
  fetchMock.mockImplementation((_url, init: RequestInit) => {
    fetchSignal = init.signal as AbortSignal;
    return new Promise((_, reject) => {
      fetchSignal!.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    });
  });
  const promise = new CartApi().add({ id: 1 }, { signal: callerController.signal });
  await Promise.resolve();
  callerController.abort("user-cancel");
  await promise;
  expect(fetchSignal!.aborted).toBe(true);
  expect(fetchSignal!.reason).toBe("user-cancel");
});

// =============================================================================
// Endpoint dispatch
// =============================================================================

test.each(["add", "change", "update", "clear", "get"] as const)(
  "%s() passes endpoint name to onStart context",
  async (method) => {
    let endpoint: string | undefined;
    fetchMock.mockResolvedValue(mockResponse());
    const api = new CartApi({
      onStart: async (ctx) => {
        endpoint = ctx.endpoint;
      },
    });
    if (method === "clear" || method === "get") {
      await api[method]();
    } else {
      await api[method]({ id: 1 });
    }
    expect(endpoint).toBe(method);
  },
);
