import { test, expect, afterEach, beforeEach } from "vitest";
import { EventEmitter, WaitUntilEvent } from "./emitter";

// Store listeners added during tests so we can clean them up
const domCleanups: (() => void)[] = [];
function listenDOM(event: string, fn: EventListener) {
  document.addEventListener(event, fn);
  domCleanups.push(() => document.removeEventListener(event, fn));
}
afterEach(() => {
  domCleanups.forEach((fn) => fn());
  domCleanups.length = 0;
});

let emitter: EventEmitter;
beforeEach(() => {
  emitter = new EventEmitter("liquid-ajax-cart");
});

const waitUntilContext = { marker: true };

test("internal listeners run sequentially in subscription order", async () => {
  const order: number[] = [];

  emitter.on("test-seq", async () => {
    await new Promise((r) => setTimeout(r, 50));
    order.push(1);
  });
  emitter.on("test-seq", async () => {
    order.push(2);
  });

  await emitter.emit("test-seq", {}, waitUntilContext);
  expect(order).toEqual([1, 2]);
});

test("internal listeners receive detail", async () => {
  let receivedDetail: unknown;

  emitter.on("test-args", async (detail) => {
    receivedDetail = detail;
  });

  const detail = { foo: "bar" };
  await emitter.emit("test-args", detail, waitUntilContext);

  expect(receivedDetail).toEqual({ foo: "bar" });
});

test("public DOM event fires with detail and exposes waitUntil on the event", async () => {
  let receivedDetail: any;
  let receivedEvent: any;

  listenDOM("liquid-ajax-cart:test-dom", ((e: WaitUntilEvent<any>) => {
    receivedDetail = e.detail;
    receivedEvent = e;
  }) as EventListener);

  await emitter.emit("test-dom", { value: 42 }, waitUntilContext);

  expect(receivedDetail.value).toBe(42);
  expect(receivedEvent).toBeInstanceOf(WaitUntilEvent);
  expect(typeof receivedEvent.waitUntil).toBe("function");
});

test("internal listeners run before public DOM event", async () => {
  const order: string[] = [];

  listenDOM("liquid-ajax-cart:test-order", () => {
    order.push("public");
  });

  emitter.on("test-order", async () => {
    order.push("internal");
  });

  await emitter.emit("test-order", {}, waitUntilContext);
  expect(order).toEqual(["internal", "public"]);
});

test("waitUntil() callbacks are awaited before emit resolves", async () => {
  let done = false;

  listenDOM("liquid-ajax-cart:test-await", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      await new Promise((r) => setTimeout(r, 50));
      done = true;
    });
  }) as EventListener);

  await emitter.emit("test-await", {}, waitUntilContext);
  expect(done).toBe(true);
});

test("waitUntil() callback receives waitUntilContext", async () => {
  let receivedCtx: unknown;

  listenDOM("liquid-ajax-cart:test-await-waitUntilContext", ((
    e: WaitUntilEvent<unknown>,
  ) => {
    e.waitUntil(async (c: unknown) => {
      receivedCtx = c;
    });
  }) as EventListener);

  await emitter.emit("test-await-waitUntilContext", {}, waitUntilContext);
  expect(receivedCtx).toBe(waitUntilContext);
});

test("multiple waitUntil() callbacks run sequentially", async () => {
  const order: number[] = [];

  listenDOM("liquid-ajax-cart:test-sequential", ((
    e: WaitUntilEvent<unknown>,
  ) => {
    e.waitUntil(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
    });
    e.waitUntil(async () => {
      order.push(2);
    });
  }) as EventListener);

  await emitter.emit("test-sequential", {}, waitUntilContext);

  expect(order).toEqual([1, 2]);
});

test("emit works when no listeners are registered", async () => {
  await expect(
    emitter.emit("test-no-listeners", {}, waitUntilContext),
  ).resolves.toBeUndefined();
});

test("uses custom prefix for DOM events", async () => {
  const custom = new EventEmitter("my-lib");
  let fired = false;

  listenDOM("my-lib:test-prefix", () => {
    fired = true;
  });

  await custom.emit("test-prefix", {}, waitUntilContext);
  expect(fired).toBe(true);
});

test("waitUntil() called after emit completes throws InvalidStateError", async () => {
  // The event seals itself once dispatch returns, so listeners that stash the
  // event and call waitUntil() asynchronously fail loudly instead of silently
  // dropping work into a closed-over array. Matches ExtendableEvent semantics.
  let savedEvent: any;
  listenDOM("liquid-ajax-cart:test-late-await", ((
    e: WaitUntilEvent<unknown>,
  ) => {
    savedEvent = e;
  }) as EventListener);

  await emitter.emit("test-late-await", {}, waitUntilContext);

  expect(() => {
    savedEvent.waitUntil(async () => {});
  }).toThrow(DOMException);
});

test("detail is a passthrough — caller-controlled keys are not overwritten", async () => {
  // The waitUntil helper lives on the event, not on detail, so detail is purely
  // caller-controlled. A caller-supplied `await` (or any other) field survives
  // unchanged.
  let observed: unknown;
  listenDOM("liquid-ajax-cart:test-detail-passthrough", ((
    e: WaitUntilEvent<any>,
  ) => {
    observed = e.detail.await;
  }) as EventListener);

  await emitter.emit(
    "test-detail-passthrough",
    { await: "user-payload" },
    waitUntilContext,
  );

  expect(observed).toBe("user-payload");
});

test("listener registered during emit does not run in the same emit", async () => {
  // The internal listeners array is snapshotted before iteration so a listener
  // that registers another listener via `on()` does not have the new one
  // picked up by the running loop. Matches Node EventEmitter semantics.
  let count = 0;
  emitter.on("test-reentrant-on", async () => {
    count++;
    if (count === 1) {
      emitter.on("test-reentrant-on", async () => {
        count++;
      });
    }
  });

  await emitter.emit("test-reentrant-on", {}, waitUntilContext);
  expect(count).toBe(1);
});

test("one throwing waitUntil callback does not skip other modules' callbacks", async () => {
  // A throw in one waitUntil callback is reported via console.error but does
  // not abort the loop, so independent modules cannot silently break each other.
  let secondRan = false;
  listenDOM("liquid-ajax-cart:test-await-isolation", ((
    e: WaitUntilEvent<unknown>,
  ) => {
    e.waitUntil(async () => {
      throw new Error("boom");
    });
    e.waitUntil(async () => {
      secondRan = true;
    });
  }) as EventListener);

  await emitter.emit("test-await-isolation", {}, waitUntilContext);
  expect(secondRan).toBe(true);
});
