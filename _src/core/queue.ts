type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type QueueOptions = {
  onStart?: () => Promise<void> | void;
  onEnd?: () => Promise<void> | void;
};

export class Queue {
  private items: QueueItem[] = [];
  private running = false;
  private onStart?: () => Promise<void> | void;
  private onEnd?: () => Promise<void> | void;

  constructor(options?: QueueOptions) {
    this.onStart = options?.onStart;
    this.onEnd = options?.onEnd;
  }

  private async process(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.onStart?.();

    while (this.items.length > 0) {
      const item = this.items.shift()!;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.running = false;
    await this.onEnd?.();
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.items.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.process();
    });
  }

  get isProcessing(): boolean {
    return this.running;
  }
}
