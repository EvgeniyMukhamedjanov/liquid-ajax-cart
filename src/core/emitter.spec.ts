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
  emitter = new EventEmitter();
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

  listenDOM("test-dom", ((e: WaitUntilEvent<any>) => {
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

  listenDOM("test-order", () => {
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

  listenDOM("test-await", ((e: WaitUntilEvent<unknown>) => {
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

  listenDOM("test-await-waitUntilContext", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async (c: unknown) => {
      receivedCtx = c;
    });
  }) as EventListener);

  await emitter.emit("test-await-waitUntilContext", {}, waitUntilContext);
  expect(receivedCtx).toBe(waitUntilContext);
});

test("multiple waitUntil() callbacks run sequentially", async () => {
  const order: number[] = [];

  listenDOM("test-sequential", ((e: WaitUntilEvent<unknown>) => {
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
  await expect(emitter.emit("test-no-listeners", {}, waitUntilContext)).resolves.toBeUndefined();
});

test("waitUntil() called after emit completes throws InvalidStateError", async () => {
  // The event seals itself once dispatch returns, so listeners that stash the
  // event and call waitUntil() asynchronously fail loudly instead of silently
  // dropping work into a closed-over array. Matches ExtendableEvent semantics.
  let savedEvent: any;
  listenDOM("test-late-await", ((e: WaitUntilEvent<unknown>) => {
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
  listenDOM("test-detail-passthrough", ((e: WaitUntilEvent<any>) => {
    observed = e.detail.await;
  }) as EventListener);

  await emitter.emit("test-detail-passthrough", { await: "user-payload" }, waitUntilContext);

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
  listenDOM("test-await-isolation", ((e: WaitUntilEvent<unknown>) => {
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

test("one throwing internal listener does not skip subsequent internal listeners", async () => {
  // Mirror of the waitUntil-isolation guarantee: an internal subscriber that
  // rejects should be logged but not break the chain for other modules.
  const order: number[] = [];
  emitter.on("test-internal-isolation", async () => {
    order.push(1);
    throw new Error("boom");
  });
  emitter.on("test-internal-isolation", async () => {
    order.push(2);
  });

  await emitter.emit("test-internal-isolation", {}, waitUntilContext);
  expect(order).toEqual([1, 2]);
});

test("internal listener throw does not skip the public DOM event", async () => {
  // The DOM event must fire even when an internal listener rejected — internal
  // and public phases are independent.
  let publicFired = false;
  emitter.on("test-internal-throw-dom", async () => {
    throw new Error("boom");
  });
  listenDOM("test-internal-throw-dom", () => {
    publicFired = true;
  });

  await emitter.emit("test-internal-throw-dom", {}, waitUntilContext);
  expect(publicFired).toBe(true);
});

test("synchronously throwing internal listener is caught like an async rejection", async () => {
  // The type says Listener returns Promise<void>, but a JS caller can pass a
  // sync-throwing function. `await fn()` converts sync throws into the same
  // rejected-promise path, so the catch block must still apply.
  let secondRan = false;
  emitter.on("test-internal-sync-throw", (() => {
    throw new Error("sync boom");
  }) as unknown as (detail: unknown) => Promise<void>);
  emitter.on("test-internal-sync-throw", async () => {
    secondRan = true;
  });

  await emitter.emit("test-internal-sync-throw", {}, waitUntilContext);
  expect(secondRan).toBe(true);
});

test("synchronously throwing waitUntil callback is caught like an async rejection", async () => {
  // Same shape as the internal-listener sync-throw case, but on the waitUntil
  // queue. The wrapper `() => fn(ctx)` throws synchronously when fn does, and
  // the surrounding `await` + try/catch must still isolate it.
  let secondRan = false;
  listenDOM("test-wu-sync-throw", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil((() => {
      throw new Error("sync boom");
    }) as unknown as Parameters<typeof e.waitUntil>[0]);
    e.waitUntil(async () => {
      secondRan = true;
    });
  }) as EventListener);

  await emitter.emit("test-wu-sync-throw", {}, waitUntilContext);
  expect(secondRan).toBe(true);
});

test("waitUntil() called from a microtask after dispatch throws", async () => {
  // dispatchEvent is synchronous and the event seals immediately after it
  // returns, so any waitUntil() call deferred even one microtask is too late.
  let captured: unknown;
  listenDOM("test-wu-microtask", ((e: WaitUntilEvent<unknown>) => {
    Promise.resolve().then(() => {
      try {
        e.waitUntil(async () => {});
      } catch (err) {
        captured = err;
      }
    });
  }) as EventListener);

  await emitter.emit("test-wu-microtask", {}, waitUntilContext);
  expect(captured).toBeInstanceOf(DOMException);
});

test("waitUntil() called from inside a waitUntil callback throws", async () => {
  // By the time the waitUntil queue runs, the event is already sealed
  // (state.open = false sits between dispatch and the callback loop). A
  // callback that captured the event and tries to push more work must fail.
  let innerError: unknown;
  let outerCompleted = false;
  listenDOM("test-wu-nested", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      try {
        e.waitUntil(async () => {});
      } catch (err) {
        innerError = err;
      }
      outerCompleted = true;
    });
  }) as EventListener);

  await emitter.emit("test-wu-nested", {}, waitUntilContext);
  expect(outerCompleted).toBe(true);
  expect(innerError).toBeInstanceOf(DOMException);
});

test("listener registered during emit runs on the next emit", async () => {
  // Complement to the snapshot-semantics test: the new listener is added to
  // the map even though it was skipped this emit, so the next emit's fresh
  // snapshot must include it.
  let count = 0;
  emitter.on("test-next-emit", async () => {
    count++;
    if (count === 1) {
      emitter.on("test-next-emit", async () => {
        count++;
      });
    }
  });

  await emitter.emit("test-next-emit", {}, waitUntilContext);
  expect(count).toBe(1);

  await emitter.emit("test-next-emit", {}, waitUntilContext);
  // emit 2: original runs (count=2), then the listener added during emit 1
  // is now in the snapshot and runs (count=3).
  expect(count).toBe(3);
});

test("multiple DOM listeners each contribute waitUntil callbacks in registration order", async () => {
  // Two independent modules listening to the same DOM event must both be
  // able to register waitUntil work, and the queue must preserve the order
  // in which calls happened across listeners.
  const order: string[] = [];
  listenDOM("test-multi-dom", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      order.push("a");
    });
  }) as EventListener);
  listenDOM("test-multi-dom", ((e: WaitUntilEvent<unknown>) => {
    e.waitUntil(async () => {
      order.push("b");
    });
  }) as EventListener);

  await emitter.emit("test-multi-dom", {}, waitUntilContext);
  expect(order).toEqual(["a", "b"]);
});

test("nested emit() of a different event from inside an internal listener works", async () => {
  // emit is reentrant: a listener for `outer` can emit `inner` and the inner
  // listeners must complete before the outer listener resumes.
  const order: string[] = [];
  emitter.on("outer", async () => {
    order.push("outer-start");
    await emitter.emit("inner", {}, waitUntilContext);
    order.push("outer-end");
  });
  emitter.on("inner", async () => {
    order.push("inner");
  });

  await emitter.emit("outer", {}, waitUntilContext);
  expect(order).toEqual(["outer-start", "inner", "outer-end"]);
});

test("concurrent emits of the same event keep their WaitUntilEventState isolated", async () => {
  // Each emit constructs a fresh state object, so two emits in flight at the
  // same time cannot cross-contaminate their open flag or callback queue.
  let aRan = 0;
  let bRan = 0;
  listenDOM("test-concurrent", ((e: WaitUntilEvent<{ id: string }>) => {
    e.waitUntil(async () => {
      if (e.detail.id === "a") aRan++;
      if (e.detail.id === "b") bRan++;
    });
  }) as EventListener);

  const p1 = emitter.emit("test-concurrent", { id: "a" }, waitUntilContext);
  const p2 = emitter.emit("test-concurrent", { id: "b" }, waitUntilContext);
  await Promise.all([p1, p2]);

  expect(aRan).toBe(1);
  expect(bRan).toBe(1);
});

test("event detail remains readable on a retained event after emit completes", async () => {
  // The end-of-emit cleanup nulls the waitUntilContext but does NOT touch
  // CustomEvent.detail, so listeners that stash the event can still read it.
  let saved: WaitUntilEvent<{ value: number }> | undefined;
  listenDOM("test-retain", ((e: WaitUntilEvent<{ value: number }>) => {
    saved = e;
  }) as EventListener);

  await emitter.emit("test-retain", { value: 7 }, waitUntilContext);
  expect(saved!.detail.value).toBe(7);
});
