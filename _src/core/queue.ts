type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class Queue {
  private items: QueueItem[] = [];
  private running = false;

  private async process(): Promise<void> {
    if (this.running) return;
    this.running = true;

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
