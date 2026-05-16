type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type QueueOptions = {
  onStart?: () => Promise<void>;
  onEnd?: () => Promise<void>;
  onIdle?: () => void;
  itemSlowAfterMs?: number;
  onItemSlow?: () => void;
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

    while (this.#items.length > 0) {
      if (this.#options?.onStart) {
        try {
          await this.#options.onStart();
        } catch (error) {
          console.error("Liquid Ajax Cart: queue onStart hook threw", error);
        }
      }

      while (this.#items.length > 0) {
        const item = this.#items.shift()!;
        const slowTimer = this.#startSlowTimer();

        try {
          const result = await item.fn();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        } finally {
          if (slowTimer !== undefined) clearTimeout(slowTimer);
        }
      }

      if (this.#options?.onEnd) {
        try {
          await this.#options.onEnd();
        } catch (error) {
          console.error("Liquid Ajax Cart: queue onEnd hook threw", error);
        }
      }
    }

    this.#running = false;

    if (this.#options?.onIdle) {
      try {
        this.#options.onIdle();
      } catch (error) {
        console.error("Liquid Ajax Cart: queue onIdle hook threw", error);
      }
    }
  }

  #startSlowTimer(): ReturnType<typeof setTimeout> | undefined {
    const { itemSlowAfterMs, onItemSlow } = this.#options ?? {};
    if (itemSlowAfterMs === undefined || !onItemSlow) return undefined;

    return setTimeout(() => {
      try {
        onItemSlow();
      } catch (error) {
        console.error("Liquid Ajax Cart: queue onItemSlow hook threw", error);
      }
    }, itemSlowAfterMs);
  }
}
