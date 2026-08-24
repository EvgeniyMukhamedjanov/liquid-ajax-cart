// src/line-item-errors/index.ts
// Side-effect init: wire the module into the core request lifecycle.
//
// Registration order matters, and it is decided by this module's import
// position in src/index.ts rather than by anything here: the REQUEST_END
// listener must run AFTER the sections module's. A 422 still re-renders the
// fragment, so a slot written before that render is destroyed and the
// re-rendered slot comes back empty from Liquid. The emitter runs listeners
// sequentially in subscription order, and subscription happens at import time.
import { on, EVENTS } from "../core";
import { handleRequestStart, handleRequestEnd } from "./line-item-errors";

on(EVENTS.REQUEST_START, async (detail) => handleRequestStart(detail));
on(EVENTS.REQUEST_END, async (detail) => handleRequestEnd(detail));
