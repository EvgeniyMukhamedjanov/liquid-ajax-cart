// src/sections/index.ts
// Side-effect init: wire the sections module into the core request lifecycle.
import { on, EVENTS } from "../core";
import { handleRequestStart, handleRequestEnd } from "./sections";

on(EVENTS.REQUEST_START, handleRequestStart);
on(EVENTS.REQUEST_END, handleRequestEnd);
