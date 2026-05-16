type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type QueueOptions = {
  onStart?: () => Promise<void>;
  onEnd?: () => Promise<void>;
  onIdle?: () => void;
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

        try {
          const result = await item.fn();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
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
}
