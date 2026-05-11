type Listener = (detail: unknown) => Promise<void>;
type WaitUntilCallback = (waitUntilContext: unknown) => Promise<void>;

interface WaitUntilEventState {
  open: boolean;
  callbacks: (() => Promise<unknown>)[];
  waitUntilContext: unknown;
}

export class WaitUntilEvent<T> extends CustomEvent<T> {
  #state: WaitUntilEventState;

  constructor(
    type: string,
    init: CustomEventInit<T>,
    state: WaitUntilEventState,
  ) {
    super(type, init);
    this.#state = state;
  }

  waitUntil(fn: WaitUntilCallback): void {
    if (!this.#state.open) {
      throw new DOMException(
        "waitUntil() must be called synchronously during event dispatch",
        "InvalidStateError",
      );
    }
    this.#state.callbacks.push(() => fn(this.#state.waitUntilContext));
  }
}

export class EventEmitter {
  #prefix: string;
  #listeners = new Map<string, Listener[]>();

  constructor(prefix: string) {
    this.#prefix = prefix;
  }

  on(event: string, fn: Listener): void {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event)!.push(fn);
  }

  async emit(
    event: string,
    detail: object,
    waitUntilContext: unknown,
  ): Promise<void> {
    // 1. Internal async subscribers run sequentially; one failure must not skip the rest.
    //    Snapshot the list so listeners added during dispatch only run on the next emit.
    const listeners = [...(this.#listeners.get(event) || [])];
    for (const fn of listeners) {
      try {
        await fn(detail);
      } catch (err) {
        console.error(`${this.#prefix}:${event} internal listener threw`, err);
      }
    }

    // 2. Public DOM event — sync listeners run, waitUntil() callbacks collected on the event itself
    const state: WaitUntilEventState = {
      open: true,
      callbacks: [],
      waitUntilContext,
    };
    document.dispatchEvent(
      new WaitUntilEvent(`${this.#prefix}:${event}`, { detail }, state),
    );
    // Seal the event so late waitUntil() calls fail loudly
    state.open = false;

    // 3. Run collected callbacks sequentially.
    for (const fn of state.callbacks) {
      try {
        await fn();
      } catch (err) {
        console.error(`${this.#prefix}:${event} waitUntil callback threw`, err);
      }
    }
    // Drop heavy references so a user that retains the event doesn't drag the
    // waitUntilContext and the user-supplied callbacks into long-term memory.
    state.callbacks = [];
    state.waitUntilContext = null;
  }
}
