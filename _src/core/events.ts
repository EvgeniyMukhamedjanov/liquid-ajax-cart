type Listener = (detail: unknown) => Promise<void>;

export class EventEmitter {
  private prefix: string;
  private listeners = new Map<string, Listener[]>();

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  on(event: string, fn: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(fn);
  }

  async emit(
    event: string,
    detail: Record<string, unknown>,
    ctx: unknown,
  ): Promise<void> {
    // 1. Internal async subscribers run sequentially
    const listeners = this.listeners.get(event) || [];
    for (const fn of listeners) {
      await fn(detail);
    }

    // 2. Public DOM event — sync listeners run, detail.await() callbacks are collected
    const awaitCallbacks: (() => Promise<unknown>)[] = [];

    const publicDetail = {
      ...detail,
      await: (fn: (ctx: unknown) => Promise<void>) => {
        awaitCallbacks.push(() => fn(ctx));
      },
    };

    document.dispatchEvent(
      new CustomEvent(`${this.prefix}:${event}`, { detail: publicDetail }),
    );

    // 3. Run collected callbacks sequentially
    for (const fn of awaitCallbacks) {
      await fn();
    }
  }
}
