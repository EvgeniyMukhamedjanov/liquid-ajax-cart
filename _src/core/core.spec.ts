import { test, expect } from "vitest";
import { task, isProcessing } from "./index";

test("task runs the callback and returns its result", async () => {
  const result = await task(async () => 42);
  expect(result).toBe(42);
});

test("task passes a context object with cart methods to the callback", async () => {
  let received: Record<string, unknown> = {};
  await task(async (ctx) => {
    received = ctx as unknown as Record<string, unknown>;
  });
  expect(received).toHaveProperty("add");
  expect(received).toHaveProperty("change");
  expect(received).toHaveProperty("update");
  expect(received).toHaveProperty("clear");
  expect(received).toHaveProperty("get");
  expect(typeof received.add).toBe("function");
});

test("tasks are queued sequentially", async () => {
  const order: number[] = [];

  task(async () => {
    await new Promise((r) => setTimeout(r, 50));
    order.push(1);
  });
  task(async () => {
    order.push(2);
  });
  await task(async () => {
    order.push(3);
  });

  expect(order).toEqual([1, 2, 3]);
});

test("task rejects when callback throws", async () => {
  await expect(
    task(async () => {
      throw new Error("boom");
    }),
  ).rejects.toThrow("boom");
});

test("queue continues after a task rejection", async () => {
  task(async () => {
    throw new Error("fail");
  }).catch(() => {});
  const result = await task(async () => "ok");
  expect(result).toBe("ok");
});

test("isProcessing reflects task execution", async () => {
  expect(isProcessing()).toBe(false);

  let during = false;
  await task(async () => {
    during = isProcessing();
  });
  // The queue has an onEnd hook (the queue-end emit) and keeps #running=true
  // across it so the next batch can't overlap with the previous queue-end.
  // Wait one tick for that emit to finish before asserting isProcessing.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(during).toBe(true);
  expect(isProcessing()).toBe(false);
});

test("task preserves generic return type", async () => {
  const str = await task(async () => "hello");
  const num = await task(async () => 123);
  const obj = await task(async () => ({ a: 1 }));

  expect(str).toBe("hello");
  expect(num).toBe(123);
  expect(obj).toEqual({ a: 1 });
});
