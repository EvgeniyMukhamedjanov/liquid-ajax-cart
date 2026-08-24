import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { task, add, change, update, clear, get, isProcessing, EVENTS } from "./core";
import { WaitUntilEvent } from "./emitter";

// These tests cover ONLY what core/index.ts adds on top of its components:
// the wiring between queue, emitter and api. Queue sequencing, emitter
// waitUntil mechanics and api HTTP details are owned by queue.spec.ts /
// emitter.spec.ts / api.spec.ts and are deliberately not re-tested here.

let fetchMock: ReturnType<typeof vi.fn>;

const domCleanups: (() => void)[] = [];
function listenDOM(event: string, fn: EventListener) {
  document.addEventListener(event, fn);
  domCleanups.push(() => document.removeEventListener(event, fn));
}

function mockResponse(opts: { status?: number; body?: object | null } = {}) {
  const status = opts.status ?? 200;
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => opts.body ?? null,
  } as Response);
}

function callMethod(method: "add" | "change" | "update" | "clear" | "get") {
  switch (method) {
    case "add":
      return add({ id: 1 });
    case "change":
      return change({ id: 1, quantity: 0 });
    case "update":
      return update({ updates: { "1": 1 } });
    case "clear":
      return clear();
    case "get":
      return get();
  }
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  domCleanups.forEach((fn) => fn());
  domCleanups.length = 0;
});

// =============================================================================
// task() — the api context it hands to the callback
// =============================================================================

test("task() passes the shared api instance to its callback", async () => {
  let first: any;
  let second: any;
  await task(async (api) => {
    first = api;
  });
  await task(async (api) => {
    second = api;
  });

  // The context exposes the direct cart methods...
  for (const method of ["add", "change", "update", "clear", "get"]) {
    expect(typeof first[method]).toBe("function");
  }
  // ...and it is the same instance on every call.
  expect(first).toBe(second);
});

// =============================================================================
// Deadlock warning — index.ts arms the queue's slow-item timer
// =============================================================================

test("a queued request that runs too long triggers a deadlock warning", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.useFakeTimers();

  // A task that runs far longer than the queue's slow-request threshold.
  const slow = task(async () => {
    await new Promise((r) => setTimeout(r, 120_000));
  });

  await vi.advanceTimersByTimeAsync(30_000);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("deadlock"));

  // Let the task finish so the singleton queue is left clean for later tests.
  await vi.advanceTimersByTimeAsync(120_000);
  await slow;

  vi.useRealTimers();
  warn.mockRestore();
});

// =============================================================================
// Queued cart methods — sugar that routes through the queue into the api
// =============================================================================

test.each([
  ["add", "/cart/add.js", "POST"],
  ["change", "/cart/change.js", "POST"],
  ["update", "/cart/update.js", "POST"],
  ["clear", "/cart/clear.js", "POST"],
  ["get", "/cart.js", "GET"],
] as const)("%s() is wired to %s (%s)", async (method, path, httpMethod) => {
  fetchMock.mockResolvedValue(mockResponse());
  await callMethod(method);
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe(path);
  expect(init.method).toBe(httpMethod);
});

test("add() forwards the request body to the api", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  await add({ id: 42, quantity: 3 });
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(init.body).toBe(JSON.stringify({ id: 42, quantity: 3 }));
});

test("add() forwards options to the api — a pre-aborted signal skips fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  fetchMock.mockResolvedValue(mockResponse());

  const result = await add({ id: 1 }, { signal: controller.signal });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(result).toEqual({ ok: false, status: null, body: null, cancelled: true });
});

test("add() resolves to the RequestResult produced by the api", async () => {
  fetchMock.mockResolvedValue(mockResponse({ status: 200, body: { token: "abc" } }));
  const result = await add({ id: 1 });
  expect(result).toEqual({ ok: true, status: 200, body: { token: "abc" }, cancelled: false });
});

test("queued cart methods run through the queue, so they never overlap", async () => {
  const order: string[] = [];
  fetchMock.mockImplementation(async (url: string) => {
    order.push(`start ${url}`);
    await new Promise((r) => setTimeout(r, 10));
    order.push(`end ${url}`);
    return mockResponse();
  });

  await Promise.all([add({ id: 1 }), get()]);

  expect(order).toEqual([
    "start /cart/add.js",
    "end /cart/add.js",
    "start /cart.js",
    "end /cart.js",
  ]);
});

// =============================================================================
// Event wiring — index.ts routes queue/api hooks into emitter events
// =============================================================================

test("a full request dispatches the lifecycle events on document, in order", async () => {
  const order: string[] = [];
  for (const ev of [
    EVENTS.QUEUE_START,
    EVENTS.REQUEST_START,
    EVENTS.REQUEST_END,
    EVENTS.QUEUE_END,
    EVENTS.QUEUE_IDLE,
  ]) {
    listenDOM(ev, () => order.push(ev));
  }
  fetchMock.mockResolvedValue(mockResponse());

  await add({ id: 1 });
  // queue-end / queue-idle run on the post-resolve tail.
  await new Promise((r) => setTimeout(r, 0));

  expect(order).toEqual([
    EVENTS.QUEUE_START,
    EVENTS.REQUEST_START,
    EVENTS.REQUEST_END,
    EVENTS.QUEUE_END,
    EVENTS.QUEUE_IDLE,
  ]);
});

test("cart methods called inside task() also dispatch request events", async () => {
  const seen: string[] = [];
  listenDOM(EVENTS.REQUEST_START, () => seen.push("start"));
  listenDOM(EVENTS.REQUEST_END, () => seen.push("end"));
  fetchMock.mockResolvedValue(mockResponse());

  await task(async (cart) => {
    await cart.add({ id: 1 });
  });

  expect(seen).toEqual(["start", "end"]);
});

test("request-end waitUntil callback receives the cart api as its context", async () => {
  let ctx: any;
  listenDOM(EVENTS.REQUEST_END, ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async (c) => {
      ctx = c;
    });
  }) as EventListener);
  fetchMock.mockResolvedValue(mockResponse());

  await add({ id: 1 });

  expect(typeof ctx.add).toBe("function");
  expect(typeof ctx.get).toBe("function");
});

test("a request-end waitUntil callback blocks the queue before the next item", async () => {
  const order: string[] = [];
  listenDOM(EVENTS.REQUEST_END, ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      order.push("waitUntil-start");
      await new Promise((r) => setTimeout(r, 20));
      order.push("waitUntil-end");
    });
  }) as EventListener);
  fetchMock.mockImplementation(async () => {
    order.push("fetch");
    return mockResponse();
  });

  await Promise.all([add({ id: 1 }), add({ id: 2 })]);

  expect(order).toEqual([
    "fetch",
    "waitUntil-start",
    "waitUntil-end",
    "fetch",
    "waitUntil-start",
    "waitUntil-end",
  ]);
});

// =============================================================================
// Adversarial — error paths and wiring seams the happy-path tests skip
// =============================================================================

test("isProcessing() tracks the queue lifecycle, not individual task resolution", async () => {
  expect(isProcessing()).toBe(false);

  let busyInsideTask = false;
  const running = task(async () => {
    busyInsideTask = isProcessing();
  });
  // Enqueuing flips the queue to running synchronously, before the first await.
  expect(isProcessing()).toBe(true);

  await running;
  expect(busyInsideTask).toBe(true);
  // A resolved task is NOT an idle queue: queue-end still has to run after it.
  expect(isProcessing()).toBe(true);

  // The queue only reports idle once it has fully drained (queue-idle fired).
  await new Promise<void>((resolve) => listenDOM(EVENTS.QUEUE_IDLE, () => resolve()));
  expect(isProcessing()).toBe(false);
});

test("a task that throws rejects, yet still drains the queue for the next caller", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  const seen: string[] = [];
  listenDOM(EVENTS.QUEUE_END, () => seen.push("queue-end"));
  listenDOM(EVENTS.QUEUE_IDLE, () => seen.push("queue-idle"));

  await expect(
    task(async () => {
      throw new Error("boom");
    }),
  ).rejects.toThrow("boom");
  // queue-end / queue-idle run on the post-resolve tail.
  await new Promise((r) => setTimeout(r, 0));

  // A thrown task must not strand the queue: it still closes out cleanly...
  expect(seen).toEqual(["queue-end", "queue-idle"]);
  // ...and the next request goes through as normal.
  expect(await add({ id: 1 })).toEqual({ ok: true, status: 200, body: null, cancelled: false });
});

test("a network failure resolves to a failed result and still emits both request events", async () => {
  fetchMock.mockRejectedValue(new TypeError("network down"));
  const seen: string[] = [];
  listenDOM(EVENTS.REQUEST_START, () => seen.push("start"));
  listenDOM(EVENTS.REQUEST_END, () => seen.push("end"));

  // The api swallows network errors, so the queued method resolves, never rejects.
  const result = await add({ id: 1 });

  expect(result).toEqual({ ok: false, status: null, body: null, cancelled: false });
  expect(seen).toEqual(["start", "end"]);
});

test("request-start waitUntil callback receives the cart api as its context", async () => {
  let ctx: any;
  listenDOM(EVENTS.REQUEST_START, ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async (c) => {
      ctx = c;
    });
  }) as EventListener);
  fetchMock.mockResolvedValue(mockResponse());

  await add({ id: 1 });

  expect(typeof ctx.add).toBe("function");
  expect(typeof ctx.get).toBe("function");
});

test("a request-start listener can abort the request before fetch is reached", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  // request-start carries the live request context as event.detail, abort included.
  listenDOM(EVENTS.REQUEST_START, ((e: WaitUntilEvent<{ abort: () => void }>) => {
    e.detail.abort();
  }) as EventListener);

  const result = await add({ id: 1 });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(result).toEqual({ ok: false, status: null, body: null, cancelled: true });
});

test("a request-start waitUntil callback blocks fetch until it settles", async () => {
  const order: string[] = [];
  listenDOM(EVENTS.REQUEST_START, ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      order.push("waitUntil-start");
      await new Promise((r) => setTimeout(r, 20));
      order.push("waitUntil-end");
    });
  }) as EventListener);
  fetchMock.mockImplementation(async () => {
    order.push("fetch");
    return mockResponse();
  });

  await add({ id: 1 });

  expect(order).toEqual(["waitUntil-start", "waitUntil-end", "fetch"]);
});

test("two requests inside one task() emit one queue pair but two request pairs", async () => {
  fetchMock.mockResolvedValue(mockResponse());
  const order: string[] = [];
  for (const ev of [
    EVENTS.QUEUE_START,
    EVENTS.REQUEST_START,
    EVENTS.REQUEST_END,
    EVENTS.QUEUE_END,
  ]) {
    listenDOM(ev, () => order.push(ev));
  }

  await task(async (cart) => {
    await cart.add({ id: 1 });
    await cart.add({ id: 2 });
  });
  await new Promise((r) => setTimeout(r, 0));

  expect(order).toEqual([
    EVENTS.QUEUE_START,
    EVENTS.REQUEST_START,
    EVENTS.REQUEST_END,
    EVENTS.REQUEST_START,
    EVENTS.REQUEST_END,
    EVENTS.QUEUE_END,
  ]);
});
