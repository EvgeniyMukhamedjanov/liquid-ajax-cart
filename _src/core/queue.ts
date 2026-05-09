type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type QueueOptions = {
  onStart?: () => Promise<void>;
  onEnd?: () => Promise<void>;
};

export class Queue {
  #items: QueueItem[] = [];
  #running = false;
  #options?: QueueOptions;

  constructor(options?: QueueOptions) {
    this.#options = options;
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.#items.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.#process();
    });
  }

  get isProcessing(): boolean {
    return this.#running;
  }

  async #process(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    await this.#options?.onStart?.();

    while (this.#items.length > 0) {
      const item = this.#items.shift()!;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.#running = false;
    await this.#options?.onEnd?.();
  }
}
