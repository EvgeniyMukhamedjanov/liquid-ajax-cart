import { test, expect, afterEach, beforeEach } from 'vitest';
import { EventEmitter } from './emitter';

// Store listeners added during tests so we can clean them up
const domCleanups: (() => void)[] = [];
function listenDOM(event: string, fn: EventListener) {
  document.addEventListener(event, fn);
  domCleanups.push(() => document.removeEventListener(event, fn));
}
afterEach(() => {
  domCleanups.forEach(fn => fn());
  domCleanups.length = 0;
});

let emitter: EventEmitter;
beforeEach(() => {
  emitter = new EventEmitter('liquid-ajax-cart');
});

const ctx = { marker: true };

test('internal listeners run sequentially in subscription order', async () => {
  const order: number[] = [];

  emitter.on('test-seq', async () => {
    await new Promise(r => setTimeout(r, 50));
    order.push(1);
  });
  emitter.on('test-seq', async () => {
    order.push(2);
  });

  await emitter.emit('test-seq', {}, ctx);
  expect(order).toEqual([1, 2]);
});

test('internal listeners receive detail', async () => {
  let receivedDetail: unknown;

  emitter.on('test-args', async (detail) => {
    receivedDetail = detail;
  });

  const detail = { foo: 'bar' };
  await emitter.emit('test-args', detail, ctx);

  expect(receivedDetail).toEqual({ foo: 'bar' });
});

test('public DOM event fires with detail', async () => {
  let receivedDetail: any;

  listenDOM('liquid-ajax-cart:test-dom', ((e: CustomEvent) => {
    receivedDetail = e.detail;
  }) as EventListener);

  await emitter.emit('test-dom', { value: 42 }, ctx);

  expect(receivedDetail.value).toBe(42);
  expect(typeof receivedDetail.await).toBe('function');
});

test('internal listeners run before public DOM event', async () => {
  const order: string[] = [];

  listenDOM('liquid-ajax-cart:test-order', () => {
    order.push('public');
  });

  emitter.on('test-order', async () => {
    order.push('internal');
  });

  await emitter.emit('test-order', {}, ctx);
  expect(order).toEqual(['internal', 'public']);
});

test('detail.await() collects async callbacks and awaits them', async () => {
  let done = false;

  listenDOM('liquid-ajax-cart:test-await', ((e: CustomEvent) => {
    e.detail.await(async () => {
      await new Promise(r => setTimeout(r, 50));
      done = true;
    });
  }) as EventListener);

  await emitter.emit('test-await', {}, ctx);
  expect(done).toBe(true);
});

test('detail.await() passes ctx to callback', async () => {
  let receivedCtx: unknown;

  listenDOM('liquid-ajax-cart:test-await-ctx', ((e: CustomEvent) => {
    e.detail.await(async (c: unknown) => {
      receivedCtx = c;
    });
  }) as EventListener);

  await emitter.emit('test-await-ctx', {}, ctx);
  expect(receivedCtx).toBe(ctx);
});

test('multiple detail.await() callbacks run sequentially', async () => {
  const order: number[] = [];

  listenDOM('liquid-ajax-cart:test-sequential', ((e: CustomEvent) => {
    e.detail.await(async () => {
      await new Promise(r => setTimeout(r, 50));
      order.push(1);
    });
    e.detail.await(async () => {
      order.push(2);
    });
  }) as EventListener);

  await emitter.emit('test-sequential', {}, ctx);

  expect(order).toEqual([1, 2]);
});

test('emit works when no listeners are registered', async () => {
  await expect(emitter.emit('test-no-listeners', {}, ctx)).resolves.toBeUndefined();
});

test('uses custom prefix for DOM events', async () => {
  const custom = new EventEmitter('my-lib');
  let fired = false;

  listenDOM('my-lib:test-prefix', () => { fired = true; });

  await custom.emit('test-prefix', {}, ctx);
  expect(fired).toBe(true);
});
