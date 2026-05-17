type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type QueueOptions = {
  onStart?: () => Promise<void>;
  onEnd?: () => Promise<void>;
  onIdle?: () => void;
  slowAfterMs?: number;
  onSlow?: () => void;
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

    // the outer while loop is needed because tasks might be added to the items list during onEnd execution
    // so the new queue loop will start again without calling onIdle
    while (this.#items.length > 0) {
      if (this.#options?.onStart) {
        const timer = this.#startSlowTimer();
        try {
          await this.#options.onStart();
        } catch (error) {
          console.error("Liquid Ajax Cart: queue onStart hook threw", error);
        } finally {
          if (timer !== undefined) clearTimeout(timer);
        }
      }

      while (this.#items.length > 0) {
        const item = this.#items.shift()!;
        const timer = this.#startSlowTimer();

        try {
          const result = await item.fn();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        } finally {
          if (timer !== undefined) clearTimeout(timer);
        }
      }

      if (this.#options?.onEnd) {
        const timer = this.#startSlowTimer();
        try {
          await this.#options.onEnd();
        } catch (error) {
          console.error("Liquid Ajax Cart: queue onEnd hook threw", error);
        } finally {
          if (timer !== undefined) clearTimeout(timer);
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
    const { slowAfterMs, onSlow } = this.#options ?? {};
    if (slowAfterMs === undefined || !onSlow) return undefined;

    return setTimeout(() => {
      try {
        onSlow();
      } catch (error) {
        console.error("Liquid Ajax Cart: queue onSlow hook threw", error);
      }
    }, slowAfterMs);
  }
}
