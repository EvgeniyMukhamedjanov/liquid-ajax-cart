import { test, expect, vi } from 'vitest';
import { Queue } from './queue';

test('runs tasks sequentially', async () => {
  const queue = new Queue();
  const order: number[] = [];

  queue.enqueue(async () => { order.push(1); });
  queue.enqueue(async () => { order.push(2); });
  await queue.enqueue(async () => { order.push(3); });

  expect(order).toEqual([1, 2, 3]);
});

test('returns the task result', async () => {
  const queue = new Queue();
  const result = await queue.enqueue(async () => 42);
  expect(result).toBe(42);
});

test('rejects when task throws', async () => {
  const queue = new Queue();
  await expect(
    queue.enqueue(async () => { throw new Error('fail'); })
  ).rejects.toThrow('fail');
});

test('continues processing after a task throws', async () => {
  const queue = new Queue();

  queue.enqueue(async () => { throw new Error('fail'); }).catch(() => {});
  const result = await queue.enqueue(async () => 'ok');

  expect(result).toBe('ok');
});

test('isProcessing is true while running', async () => {
  const queue = new Queue();

  expect(queue.isProcessing).toBe(false);

  let processingDuringTask = false;
  await queue.enqueue(async () => {
    processingDuringTask = queue.isProcessing;
  });

  expect(processingDuringTask).toBe(true);
  expect(queue.isProcessing).toBe(false);
});

test('tasks wait for previous task to complete', async () => {
  const queue = new Queue();
  const order: string[] = [];

  queue.enqueue(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    order.push('slow');
  });
  await queue.enqueue(async () => {
    order.push('fast');
  });

  expect(order).toEqual(['slow', 'fast']);
});

test('calls onStart when queue begins processing', async () => {
  let started = false;
  let startedDuringTask = false;
  const queue = new Queue({ onStart: async () => { started = true; } });

  expect(started).toBe(false);
  await queue.enqueue(async () => {
    startedDuringTask = started;
  });
  expect(startedDuringTask).toBe(true);
  expect(started).toBe(true);
});

test('calls onEnd when queue becomes idle', async () => {
  let ended = false;
  let endedDuringTask = false;
  const queue = new Queue({ onEnd: async () => { ended = true; } });

  await queue.enqueue(async () => {
    endedDuringTask = ended;
  });
  expect(endedDuringTask).toBe(false);
  expect(ended).toBe(true);
});

test('onStart/onEnd fire once per batch', async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => { starts++; },
    onEnd: async () => { ends++; },
  });

  queue.enqueue(async () => {});
  queue.enqueue(async () => {});
  await queue.enqueue(async () => { });

  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test('onStart hook error does not block items from running', async () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const queue = new Queue({
    onStart: async () => { throw new Error('onStart boom'); },
  });

  const result = await queue.enqueue(async () => 'ok');

  expect(result).toBe('ok');
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
});

test('onEnd hook error does not break the queue for subsequent enqueues', async () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const queue = new Queue({
    onEnd: async () => { throw new Error('onEnd boom'); },
  });

  const first = await queue.enqueue(async () => 'first');
  const second = await queue.enqueue(async () => 'second');

  expect(first).toBe('first');
  expect(second).toBe('second');
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
});

test('isProcessing resets to false after onStart hook throws', async () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const queue = new Queue({
    onStart: async () => { throw new Error('boom'); },
  });

  await queue.enqueue(async () => {});

  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test('isProcessing resets to false after onEnd hook throws', async () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const queue = new Queue({
    onEnd: async () => { throw new Error('boom'); },
  });

  await queue.enqueue(async () => {});
  // The queue keeps #running=true across onEnd (including its catch path) so a
  // re-entrant enqueue can't start a new batch in parallel with the current
  // onEnd. Wait one tick for that lifecycle to unwind before asserting.
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(queue.isProcessing).toBe(false);
  errSpy.mockRestore();
});

test('does not start a new batch in parallel with the previous onEnd', async () => {
  const events: string[] = [];
  const queue = new Queue({
    onStart: async () => { events.push('start'); },
    onEnd: async () => {
      events.push('end-begin');
      await new Promise(resolve => setTimeout(resolve, 20));
      events.push('end-finish');
    },
  });

  await queue.enqueue(async () => { events.push('task1'); });
  await queue.enqueue(async () => { events.push('task2'); });
  await new Promise(resolve => setTimeout(resolve, 80));

  expect(events).toEqual([
    'start', 'task1', 'end-begin', 'end-finish',
    'start', 'task2', 'end-begin', 'end-finish',
  ]);
});

test('enqueue called from inside onEnd waits for current onEnd to finish', async () => {
  const events: string[] = [];
  let scheduled = false;
  const queue = new Queue({
    onStart: async () => { events.push('start'); },
    onEnd: async () => {
      events.push('end-begin');
      if (!scheduled) {
        scheduled = true;
        queue.enqueue(async () => { events.push('task2'); });
      }
      await new Promise(resolve => setTimeout(resolve, 20));
      events.push('end-finish');
    },
  });

  await queue.enqueue(async () => { events.push('task1'); });
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(events).toEqual([
    'start', 'task1', 'end-begin', 'end-finish',
    'start', 'task2', 'end-begin', 'end-finish',
  ]);
});

test('isProcessing stays true while onEnd is running', async () => {
  let processingDuringEnd: boolean | undefined;
  const queue = new Queue({
    onEnd: async () => {
      processingDuringEnd = queue.isProcessing;
    },
  });

  await queue.enqueue(async () => {});

  expect(processingDuringEnd).toBe(true);
});

test('onStart of the next batch does not fire while the previous onEnd is still pending', async () => {
  let starts = 0;
  const queue = new Queue({
    onStart: async () => { starts++; },
    onEnd: async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
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

test('tasks enqueued from inside a running task run in the same batch', async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => { starts++; order.push('start'); },
    onEnd: async () => { ends++; order.push('end'); },
  });

  await queue.enqueue(async () => {
    order.push('A');
    queue.enqueue(async () => { order.push('B'); });
    queue.enqueue(async () => { order.push('C'); });
  });
  // Let the nested tasks finish — they were enqueued without an await.
  await new Promise(resolve => setTimeout(resolve, 10));

  expect(order).toEqual(['start', 'A', 'B', 'C', 'end']);
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test('tasks enqueued from inside onStart run in the same batch', async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  let injected = false;
  const queue = new Queue({
    onStart: async () => {
      starts++;
      order.push('start');
      if (!injected) {
        injected = true;
        queue.enqueue(async () => { order.push('injected'); });
      }
    },
    onEnd: async () => { ends++; order.push('end'); },
  });

  await queue.enqueue(async () => { order.push('original'); });
  await new Promise(resolve => setTimeout(resolve, 10));

  expect(order).toEqual(['start', 'original', 'injected', 'end']);
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test('tasks enqueued from a task that throws still run in the same batch', async () => {
  let starts = 0;
  let ends = 0;
  const order: string[] = [];
  const queue = new Queue({
    onStart: async () => { starts++; },
    onEnd: async () => { ends++; },
  });

  queue.enqueue(async () => {
    order.push('a');
    queue.enqueue(async () => { order.push('b'); });
    throw new Error('fail');
  }).catch(() => { order.push('a-rejected'); });

  await new Promise(resolve => setTimeout(resolve, 10));

  expect(order).toContain('a');
  expect(order).toContain('b');
  expect(order).toContain('a-rejected');
  expect(starts).toBe(1);
  expect(ends).toBe(1);
});

test('enqueue inside a throwing onEnd is still processed in a new batch', async () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  let injected = false;
  const order: string[] = [];
  const queue = new Queue({
    onEnd: async () => {
      if (!injected) {
        injected = true;
        queue.enqueue(async () => { order.push('injected'); });
      }
      throw new Error('onEnd boom');
    },
  });

  await queue.enqueue(async () => { order.push('original'); });
  await new Promise(resolve => setTimeout(resolve, 20));

  expect(order).toEqual(['original', 'injected']);
  errSpy.mockRestore();
});

test('tasks never overlap, even when each yields multiple microtasks', async () => {
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

test('FIFO ordering is preserved when tasks resolve at different real-time rates', async () => {
  const queue = new Queue();
  const order: number[] = [];

  const slow = queue.enqueue(async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
    order.push(1);
  });
  const med = queue.enqueue(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    order.push(2);
  });
  const fast = queue.enqueue(async () => { order.push(3); });

  await Promise.all([slow, med, fast]);
  expect(order).toEqual([1, 2, 3]);
});

test('isProcessing is true during onStart', async () => {
  let processingDuringStart: boolean | undefined;
  const queue = new Queue({
    onStart: async () => { processingDuringStart = queue.isProcessing; },
  });

  await queue.enqueue(async () => {});
  expect(processingDuringStart).toBe(true);
});

test('enqueue chained via .then on a previous enqueue starts a new batch', async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => { starts++; },
    onEnd: async () => { ends++; },
  });

  await queue
    .enqueue(async () => 'a')
    .then(() => queue.enqueue(async () => 'b'));
  // Let the second batch's onEnd settle.
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(starts).toBe(2);
  expect(ends).toBe(2);
});

test('rapid await/enqueue cycles produce one batch per cycle', async () => {
  let starts = 0;
  let ends = 0;
  const queue = new Queue({
    onStart: async () => { starts++; },
    onEnd: async () => { ends++; },
  });

  for (let i = 0; i < 5; i++) {
    await queue.enqueue(async () => {});
  }

  expect(starts).toBe(5);
  expect(ends).toBe(5);
});
