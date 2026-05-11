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
