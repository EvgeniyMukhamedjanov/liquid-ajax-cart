import { test, expect, vi } from "vitest";
import { Queue } from "./queue";

test("runs tasks sequentially", async () => {
  const queue = new Queue();
  const order: number[] = [];

  queue.enqueue(async () => {
    order.push(1);
  });
  queue.enqueue(async () => {
    order.push(2);
  });
  await queue.enqueue(async () => {
    order.push(3);
  });

  expect(order).toEqual([1, 2, 3]);
});

test("returns the task result", async () => {
  const queue = new Queue();
  const result = await queue.enqueue(async () => 42);
  expect(result).toBe(42);
});

test("rejects when task throws", async () => {
  const queue = new Queue();
  await expect(
    queue.enqueue(async () => {
      throw new Error("fail");
    }),
  ).rejects.toThrow("fail");
});

test("continues processing after a task throws", async () => {
  const queue = new Queue();

  queue
    .enqueue(async () => {
      throw new Error("fail");
    })
    .catch(() => {});
  const result = await queue.enqueue(async () => "ok");

  expect(result).toBe("ok");
});

test("isProcessing is true while running", async () => {
  const queue = new Queue();

  expect(queue.isProcessing).toBe(false);

  let processingDuringTask = false;
  await queue.enqueue(async () => {
    processingDuringTask = queue.isProcessing;
  });

  expect(processingDuringTask).toBe(true);
  expect(queue.isProcessing).toBe(false);
});

test("tasks wait for previous task to complete", async () => {
  const queue = new Queue();
  const order: string[] = [];

  queue.enqueue(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    order.push("slow");
  });
  await queue.enqueue(async () => {
    order.push("fast");
  });

  expect(order).toEqual(["slow", "fast"]);
});

test("calls onStart when queue begins processing", async () => {
  let started = false;
  let startedDuringTask = false;
  const queue = new Queue({
    onStart: async () => {
      started = true;
    },
  });

  expect(started).toBe(false);
  await queue.enqueue(async () => {
    startedDuringTask = started;
  });
  expect(startedDuringTask).toBe(true);
  expect(started).toBe(true);
});

test("calls onEnd when queue becomes idle", async () => {
  let ended = false;
  let endedDuringTask = false;
  const queue = new Queue({
    onEnd: async () => {
      ended = true;
    },
  });

  await queue.enqueue(async () => {
    endedDuringTask = ended;
  });
  expect(endedDuringTask).toBe(false);
  expect(ended).toBe(true);
});

test("onStart/onEnd fire once per batch", async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onEnd: async () => {
      ends++;
    },
  });

  queue.enqueue(async () => {});
  queue.enqueue(async () => {});
  await queue.enqueue(async () => {});

  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test("onStart hook error does not block items from running", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onStart: async () => {
      throw new Error("onStart boom");
    },
  });

  const result = await queue.enqueue(async () => "ok");

  expect(result).toBe("ok");
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
});

test("onEnd hook error does not break the queue for subsequent enqueues", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onEnd: async () => {
      throw new Error("onEnd boom");
    },
  });

  const first = await queue.enqueue(async () => "first");
  const second = await queue.enqueue(async () => "second");

  expect(first).toBe("first");
  expect(second).toBe("second");
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
});

test("isProcessing resets to false after onStart hook throws", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onStart: async () => {
      throw new Error("boom");
    },
  });

  await queue.enqueue(async () => {});

  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test("isProcessing resets to false after onEnd hook throws", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onEnd: async () => {
      throw new Error("boom");
    },
  });

  await queue.enqueue(async () => {});
  // The queue keeps #running=true across onEnd (including its catch path) so a
  // re-entrant enqueue can't start a new batch in parallel with the current
  // onEnd. Wait one tick for that lifecycle to unwind before asserting.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test("does not start a new batch in parallel with the previous onEnd", async () => {
  const events: string[] = [];
  const queue = new Queue({
    onStart: async () => {
      events.push("start");
    },
    onEnd: async () => {
      events.push("end-begin");
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push("end-finish");
    },
  });

  await queue.enqueue(async () => {
    events.push("task1");
  });
  await queue.enqueue(async () => {
    events.push("task2");
  });
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(events).toEqual([
    "start",
    "task1",
    "end-begin",
    "end-finish",
    "start",
    "task2",
    "end-begin",
    "end-finish",
  ]);
});

test("enqueue called from inside onEnd waits for current onEnd to finish", async () => {
  const events: string[] = [];
  let scheduled = false;
  const queue = new Queue({
    onStart: async () => {
      events.push("start");
    },
    onEnd: async () => {
      events.push("end-begin");
      if (!scheduled) {
        scheduled = true;
        queue.enqueue(async () => {
          events.push("task2");
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push("end-finish");
    },
  });

  await queue.enqueue(async () => {
    events.push("task1");
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(events).toEqual([
    "start",
    "task1",
    "end-begin",
    "end-finish",
    "start",
    "task2",
    "end-begin",
    "end-finish",
  ]);
});

test("isProcessing stays true while onEnd is running", async () => {
  let processingDuringEnd: boolean | undefined;
  const queue = new Queue({
    onEnd: async () => {
      processingDuringEnd = queue.isProcessing;
    },
  });

  await queue.enqueue(async () => {});

  expect(processingDuringEnd).toBe(true);
});

test("onStart of the next batch does not fire while the previous onEnd is still pending", async () => {
  let starts = 0;
  const queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onEnd: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    },
  });

  await queue.enqueue(async () => {});
  // Previous onEnd is now in flight (still inside its setTimeout).
  // Enqueueing a new task must not synchronously kick off batch 2's onStart —
  // otherwise the two batches' lifecycles overlap.
  const pending = queue.enqueue(async () => {});
  expect(starts).toBe(1);

  await pending;
  expect(starts).toBe(2);
});

test("tasks enqueued from inside a running task run in the same batch", async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => {
      starts++;
      order.push("start");
    },
    onEnd: async () => {
      ends++;
      order.push("end");
    },
  });

  await queue.enqueue(async () => {
    order.push("A");
    queue.enqueue(async () => {
      order.push("B");
    });
    queue.enqueue(async () => {
      order.push("C");
    });
  });
  // Let the nested tasks finish — they were enqueued without an await.
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(order).toEqual(["start", "A", "B", "C", "end"]);
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test("tasks enqueued from inside onStart run in the same batch", async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  let injected = false;
  const queue = new Queue({
    onStart: async () => {
      starts++;
      order.push("start");
      if (!injected) {
        injected = true;
        queue.enqueue(async () => {
          order.push("injected");
        });
      }
    },
    onEnd: async () => {
      ends++;
      order.push("end");
    },
  });

  await queue.enqueue(async () => {
    order.push("original");
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(order).toEqual(["start", "original", "injected", "end"]);
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test("tasks enqueued from a task that throws still run in the same batch", async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onEnd: async () => {
      ends++;
    },
  });

  queue
    .enqueue(async () => {
      order.push("a");
      queue.enqueue(async () => {
        order.push("b");
      });
      throw new Error("fail");
    })
    .catch(() => {
      order.push("a-rejected");
    });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(order).toContain("a");
  expect(order).toContain("b");
  expect(order).toContain("a-rejected");
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test("enqueue inside a throwing onEnd is still processed in a new batch", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  let injected = false;
  const order: string[] = [];
  const queue = new Queue({
    onEnd: async () => {
      if (!injected) {
        injected = true;
        queue.enqueue(async () => {
          order.push("injected");
        });
      }
      throw new Error("onEnd boom");
    },
  });

  await queue.enqueue(async () => {
    order.push("original");
  });
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(order).toEqual(["original", "injected"]);
  errSpy.mockRestore();
});

test("tasks never overlap, even when each yields multiple microtasks", async () => {
  const queue = new Queue();
  let inFlight = 0;
  let maxConcurrent = 0;

  const work = async () => {
    inFlight++;
    maxConcurrent = Math.max(maxConcurrent, inFlight);
    await Promise.resolve();
    await Promise.resolve();
    inFlight--;
  };

  await Promise.all(Array.from({ length: 20 }, () => queue.enqueue(work)));

  expect(maxConcurrent).toBe(1);
  expect(inFlight).toBe(0);
});

test("FIFO ordering is preserved when tasks resolve at different real-time rates", async () => {
  const queue = new Queue();
  const order: number[] = [];

  const slow = queue.enqueue(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    order.push(1);
  });
  const med = queue.enqueue(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    order.push(2);
  });
  const fast = queue.enqueue(async () => {
    order.push(3);
  });

  await Promise.all([slow, med, fast]);
  expect(order).toEqual([1, 2, 3]);
});

test("isProcessing is true during onStart", async () => {
  let processingDuringStart: boolean | undefined;
  const queue = new Queue({
    onStart: async () => {
      processingDuringStart = queue.isProcessing;
    },
  });

  await queue.enqueue(async () => {});
  expect(processingDuringStart).toBe(true);
});

test("enqueue chained via .then on a previous enqueue starts a new batch", async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onEnd: async () => {
      ends++;
    },
  });

  await queue.enqueue(async () => "a").then(() => queue.enqueue(async () => "b"));
  // Let the second batch's onEnd settle.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(starts).toBe(2);
  expect(ends).toBe(2);
});

test("rapid await/enqueue cycles produce one batch per cycle", async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onEnd: async () => {
      ends++;
    },
  });

  for (let i = 0; i < 5; i++) {
    await queue.enqueue(async () => {});
  }

  expect(starts).toBe(5);
  expect(ends).toBe(5);
});

test("calls onIdle after the queue settles", async () => {
  let idle = 0;
  const queue = new Queue({
    onIdle: () => {
      idle++;
    },
  });

  await queue.enqueue(async () => {});

  expect(idle).toBe(1);
});

test("onIdle fires after onEnd", async () => {
  const order: string[] = [];
  const queue = new Queue({
    onEnd: async () => {
      order.push("end");
    },
    onIdle: () => {
      order.push("idle");
    },
  });

  await queue.enqueue(async () => {
    order.push("task");
  });
  // The task promise resolves before onEnd is awaited; drain microtasks so
  // the full end → idle tail runs before we assert.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(order).toEqual(["task", "end", "idle"]);
});

test("onIdle sees isProcessing = false", async () => {
  let processingDuringIdle: boolean | undefined;
  const queue = new Queue({
    onIdle: () => {
      processingDuringIdle = queue.isProcessing;
    },
  });

  await queue.enqueue(async () => {});

  expect(processingDuringIdle).toBe(false);
});

test("onIdle fires once per batch", async () => {
  let idle = 0;
  const queue = new Queue({
    onIdle: () => {
      idle++;
    },
  });

  queue.enqueue(async () => {});
  queue.enqueue(async () => {});
  await queue.enqueue(async () => {});

  expect(idle).toBe(1);
});

test("onIdle does not fire while onEnd re-enqueues work", async () => {
  let idle = 0;
  let injected = false;
  const order: string[] = [];
  const queue = new Queue({
    onEnd: async () => {
      order.push("end");
      if (!injected) {
        injected = true;
        queue.enqueue(async () => {
          order.push("injected");
        });
      }
    },
    onIdle: () => {
      idle++;
      order.push("idle");
    },
  });

  await queue.enqueue(async () => {
    order.push("original");
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(idle).toBe(1);
  expect(order).toEqual(["original", "end", "injected", "end", "idle"]);
});

test("onIdle fires once per drain cycle across separate batches", async () => {
  let idle = 0;
  const queue = new Queue({
    onIdle: () => {
      idle++;
    },
  });

  await queue.enqueue(async () => {});
  await queue.enqueue(async () => {});
  await queue.enqueue(async () => {});

  expect(idle).toBe(3);
});

test("an async onEnd hook merges sequentially awaited enqueues into one drain cycle", async () => {
  // Counterpart to the test above. There the queue has no onEnd, so #running
  // clears synchronously before each caller's await resumes — every enqueue is
  // its own drain and onIdle fires three times. Add an async onEnd and the
  // timing shifts: onEnd dispatches but #process suspends on `await onEnd()`
  // with #running still true, so the caller's await resumes mid-drain. The
  // next sequentially-awaited enqueue lands in that in-flight drain instead of
  // opening a fresh one. onStart/onEnd live inside the per-batch loop and
  // still fire per call; onIdle lives outside it and fires once for the whole
  // merged drain. This is the exact shape core/index.ts runs (its onEnd hook
  // is emitter.emit(QUEUE_END)).
  let starts = 0;
  let ends = 0;
  let idle = 0;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => {
      starts++;
      order.push("start");
    },
    onEnd: async () => {
      ends++;
      order.push("end");
    },
    onIdle: () => {
      idle++;
      order.push("idle");
    },
  });

  await queue.enqueue(async () => {
    order.push("t1");
  });
  await queue.enqueue(async () => {
    order.push("t2");
  });
  await queue.enqueue(async () => {
    order.push("t3");
  });
  // Let the final drain's onEnd then onIdle tail unwind.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(starts).toBe(3);
  expect(ends).toBe(3);
  expect(idle).toBe(1);
  expect(order).toEqual([
    "start",
    "t1",
    "end",
    "start",
    "t2",
    "end",
    "start",
    "t3",
    "end",
    "idle",
  ]);
});

test("onIdle hook error does not break subsequent batches", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onIdle: () => {
      throw new Error("onIdle boom");
    },
  });

  const first = await queue.enqueue(async () => "first");
  const second = await queue.enqueue(async () => "second");

  expect(first).toBe("first");
  expect(second).toBe("second");
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
});

test("isProcessing stays false after onIdle throws", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onIdle: () => {
      throw new Error("boom");
    },
  });

  await queue.enqueue(async () => {});

  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test("enqueue from inside onIdle starts a new batch", async () => {
  let starts = 0;
  let idles = 0;
  let injected = false;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => {
      starts++;
      order.push("start");
    },
    onIdle: () => {
      idles++;
      order.push("idle");
      if (!injected) {
        injected = true;
        queue.enqueue(async () => {
          order.push("injected");
        });
      }
    },
  });

  await queue.enqueue(async () => {
    order.push("original");
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(starts).toBe(2);
  expect(idles).toBe(2);
  expect(order).toEqual(["start", "original", "idle", "start", "injected", "idle"]);
});

test("onIdle does not fire when items are still pending", async () => {
  let idle = 0;
  const order: string[] = [];
  const queue = new Queue({
    onIdle: () => {
      idle++;
      order.push("idle");
    },
  });

  queue.enqueue(async () => {
    order.push("a");
    // Sees idle === 0 — siblings B and C are still pending.
    expect(idle).toBe(0);
  });
  queue.enqueue(async () => {
    order.push("b");
    expect(idle).toBe(0);
  });
  await queue.enqueue(async () => {
    order.push("c");
  });

  expect(idle).toBe(1);
  expect(order).toEqual(["a", "b", "c", "idle"]);
});

test("onIdle runs synchronously after the task promise resolves", async () => {
  let idle = false;
  const queue = new Queue({
    onIdle: () => {
      idle = true;
    },
  });

  await queue.enqueue(async () => {});

  // onIdle fired inside #process before the task promise's awaiter resumed.
  expect(idle).toBe(true);
});

// ---------------------------------------------------------------------------
// Breaking tests — probe documented failure modes and edge cases that could
// expose subtle bugs.
// ---------------------------------------------------------------------------

test("deadlocks when a task awaits a same-queue enqueue", async () => {
  // The current task holds the inner while loop; the nested item is queued
  // but won't be shifted until the current task.fn() resolves — and it can't,
  // because it's awaiting the nested item. This is the failure mode v3 plans
  // to mitigate via task() + bypass-queue cart methods.
  const queue = new Queue();
  let nestedRan = false;

  queue.enqueue(async () => {
    await queue.enqueue(async () => {
      nestedRan = true;
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(nestedRan).toBe(false);
  expect(queue.isProcessing).toBe(true);
});

test("deadlocks when onStart awaits an enqueue", async () => {
  let nestedRan = false;
  const queue: Queue = new Queue({
    onStart: async () => {
      await queue.enqueue(async () => {
        nestedRan = true;
      });
    },
  });

  queue.enqueue(async () => {});
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(nestedRan).toBe(false);
});

test("deadlocks when onEnd awaits an enqueue", async () => {
  let nestedRan = false;
  const queue: Queue = new Queue({
    onEnd: async () => {
      await queue.enqueue(async () => {
        nestedRan = true;
      });
    },
  });

  queue.enqueue(async () => {});
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(nestedRan).toBe(false);
});

test("preserves FIFO order across 500 items with mixed microtask timing", async () => {
  const queue = new Queue();
  const order: number[] = [];
  const count = 500;

  const tasks = Array.from({ length: count }, (_, i) =>
    queue.enqueue(async () => {
      // Force a couple of microtask hops so the scheduler has room to misbehave.
      await Promise.resolve();
      await Promise.resolve();
      order.push(i);
    }),
  );

  await Promise.all(tasks);

  expect(order.length).toBe(count);
  expect(order).toEqual(Array.from({ length: count }, (_, i) => i));
});

test("rejects when fn throws synchronously before any await", async () => {
  const queue = new Queue();

  await expect(
    queue.enqueue((() => {
      throw new Error("sync fail");
    }) as () => Promise<unknown>),
  ).rejects.toThrow("sync fail");
});

test("a synchronous throw in one task does not break the same batch", async () => {
  const queue = new Queue();
  const results: string[] = [];

  queue
    .enqueue((() => {
      throw new Error("sync fail");
    }) as () => Promise<unknown>)
    .catch(() => results.push("rejected"));
  const second = await queue.enqueue(async () => "ok");

  expect(second).toBe("ok");
  expect(results).toEqual(["rejected"]);
});

test("handles a task that returns a non-Promise value", async () => {
  const queue = new Queue();
  // Type contract says Promise<unknown>, but JS allows anything — await unwraps it.
  const result = await queue.enqueue((() => 42) as unknown as () => Promise<unknown>);
  expect(result).toBe(42);
});

test("hook returning a rejected Promise (without throwing) is caught", async () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    onStart: () => Promise.reject(new Error("rejected start")),
    onEnd: () => Promise.reject(new Error("rejected end")),
  });

  const result = await queue.enqueue(async () => "ok");

  // The task promise resolves before onEnd is awaited; drain microtasks so
  // the full end → idle tail runs before we assert.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(result).toBe("ok");
  expect(errSpy).toHaveBeenCalled();
  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test("onIdle re-enqueuing across multiple cycles processes everything", async () => {
  const order: number[] = [];
  let cycle = 0;
  const queue: Queue = new Queue({
    onIdle: () => {
      if (cycle < 3) {
        cycle++;
        for (let i = 0; i < 5; i++) {
          queue.enqueue(async () => {
            order.push(cycle * 10 + i);
          });
        }
      }
    },
  });

  await queue.enqueue(async () => {
    order.push(0);
  });
  await new Promise((resolve) => setTimeout(resolve, 50));

  // initial + 3 cycles × 5 items
  expect(order.length).toBe(1 + 3 * 5);
  expect(queue.isProcessing).toBe(false);
});

test("50 nested enqueues from inside a single task all land in the same batch", async () => {
  let starts = 0;
  let idles = 0;
  const seen: number[] = [];
  const queue: Queue = new Queue({
    onStart: async () => {
      starts++;
    },
    onIdle: () => {
      idles++;
    },
  });

  await queue.enqueue(async () => {
    for (let i = 0; i < 50; i++) {
      queue.enqueue(async () => {
        seen.push(i);
      });
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(seen.length).toBe(50);
  expect(starts).toBe(1);
  expect(idles).toBe(1);
});

// ---------------------------------------------------------------------------
// Slow-step detection — onSlow fires when any queue step (a lifecycle hook or a
// queued item) out-runs slowAfterMs.
// ---------------------------------------------------------------------------

test("onSlow fires when an item runs past slowAfterMs", async () => {
  vi.useFakeTimers();
  let slow = 0;
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      slow++;
    },
  });

  const item = queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 500)));
  await vi.advanceTimersByTimeAsync(100);
  expect(slow).toBe(1);

  await vi.advanceTimersByTimeAsync(500);
  await item;
  vi.useRealTimers();
});

test("onSlow does not fire for an item that settles before slowAfterMs", async () => {
  vi.useFakeTimers();
  let slow = 0;
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      slow++;
    },
  });

  const item = queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 20)));
  await vi.advanceTimersByTimeAsync(20);
  await item;
  // Advance well past the threshold — the timer was cleared on settle.
  await vi.advanceTimersByTimeAsync(500);

  expect(slow).toBe(0);
  vi.useRealTimers();
});

test("onSlow arms per item — two slow items warn twice", async () => {
  vi.useFakeTimers();
  let slow = 0;
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      slow++;
    },
  });

  const first = queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 300)));
  const second = queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 300)));
  await vi.advanceTimersByTimeAsync(700);
  await Promise.all([first, second]);

  expect(slow).toBe(2);
  vi.useRealTimers();
});

test("onSlow hook error does not break the queue", async () => {
  vi.useFakeTimers();
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      throw new Error("onSlow boom");
    },
  });

  const slow = queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 300)));
  await vi.advanceTimersByTimeAsync(300);
  await slow;

  const next = await queue.enqueue(async () => "ok");
  expect(next).toBe("ok");
  expect(errSpy).toHaveBeenCalled();

  errSpy.mockRestore();
  vi.useRealTimers();
});

test("onSlow fires when an onStart hook runs past slowAfterMs", async () => {
  vi.useFakeTimers();
  let slow = 0;
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      slow++;
    },
    onStart: () => new Promise<void>((resolve) => setTimeout(resolve, 500)),
  });

  const item = queue.enqueue(async () => {});
  await vi.advanceTimersByTimeAsync(100);
  expect(slow).toBe(1);

  await vi.advanceTimersByTimeAsync(500);
  await item;
  vi.useRealTimers();
});

test("onSlow fires when an onEnd hook runs past slowAfterMs", async () => {
  vi.useFakeTimers();
  let slow = 0;
  const queue = new Queue({
    slowAfterMs: 100,
    onSlow: () => {
      slow++;
    },
    onEnd: () => new Promise<void>((resolve) => setTimeout(resolve, 500)),
  });

  const item = queue.enqueue(async () => {});
  await vi.advanceTimersByTimeAsync(600);
  await item;

  expect(slow).toBe(1);
  vi.useRealTimers();
});
