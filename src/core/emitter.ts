export type Listener<D = unknown> = (detail: D) => Promise<void>;
type WaitUntilCallback = (waitUntilContext: unknown) => Promise<void>;

interface WaitUntilEventState {
  open: boolean;
  callbacks: (() => Promise<unknown>)[];
  waitUntilContext: unknown;
}

export class WaitUntilEvent<T> extends CustomEvent<T> {
  #state: WaitUntilEventState;

  constructor(type: string, init: CustomEventInit<T>, state: WaitUntilEventState) {
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

export class EventEmitter<M extends Record<string, object> = Record<string, object>> {
  // A mapped object, not a Map: a Map needs one value type for every key, and
  // there isn't one — Listener is contravariant in its detail, so a
  // `Listener<M[K]>` is not a `Listener<M[keyof M]>`. Indexing a mapped type
  // keeps each event's listeners at that event's own detail type, which is what
  // lets core.ts subscribe without a cast.
  #listeners: { [K in keyof M]?: Listener<M[K]>[] } = {};

  on<K extends keyof M>(event: K, fn: Listener<M[K]>): void {
    const existing = this.#listeners[event];
    if (existing) existing.push(fn);
    else this.#listeners[event] = [fn];
  }

  // `& string` because WaitUntilEvent's constructor takes a string type name.
  async emit<K extends keyof M & string>(
    event: K,
    detail: M[K],
    waitUntilContext: unknown,
  ): Promise<void> {
    // 1. Internal async subscribers
    const listeners = [...(this.#listeners[event] ?? [])];
    for (const fn of listeners) {
      try {
        await fn(detail);
      } catch (err) {
        console.error(`${event} internal listener threw`, err);
      }
    }

    // 2. Public DOM event — sync listeners run, waitUntil() callbacks collected on the event itself
    const state: WaitUntilEventState = {
      open: true,
      callbacks: [],
      waitUntilContext,
    };
    document.dispatchEvent(new WaitUntilEvent<M[K]>(event, { detail }, state));
    // Seal the event so late waitUntil() calls fail loudly
    state.open = false;

    // 3. Run collected callbacks sequentially.
    for (const fn of state.callbacks) {
      try {
        await fn();
      } catch (err) {
        console.error(`${event} waitUntil callback threw`, err);
      }
    }
    // Drop heavy references so a user that retains the event doesn't drag the
    // waitUntilContext and the user-supplied callbacks into long-term memory.
    state.callbacks = [];
    state.waitUntilContext = null;
  }
}
