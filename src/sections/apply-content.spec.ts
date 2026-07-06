// src/sections/apply-content.spec.ts
import { describe, it, expect } from "vitest";
import { applyContent, clearContent } from "./apply-content";

function el(html: string): HTMLElement {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild as HTMLElement;
}

describe("applyContent", () => {
  it("replaces the target's children with clones of the source's children", () => {
    const target = el(`<div><span>old</span></div>`);
    const source = el(`<div><b>new</b> text</div>`);
    applyContent(target, source);
    expect(target.innerHTML).toBe("<b>new</b> text");
  });

  it("does not move nodes out of the source (clones, not adopts)", () => {
    const target = el(`<div></div>`);
    const source = el(`<div><i>x</i></div>`);
    applyContent(target, source);
    expect(source.innerHTML).toBe("<i>x</i>"); // source untouched
    expect(target.querySelector("i")).not.toBe(source.querySelector("i"));
  });

  it("clears the target when the source is empty", () => {
    const target = el(`<div><span>old</span></div>`);
    const source = el(`<div></div>`);
    applyContent(target, source);
    expect(target.childNodes.length).toBe(0);
  });

  it("reads a <template> source's content (not its empty child list)", () => {
    const target = el(`<span>old</span>`);
    const source = el(`<template><b>3</b></template>`) as HTMLTemplateElement;
    applyContent(target, source);
    expect(target.innerHTML).toBe("<b>3</b>");
  });

  it("writes into a <template> target's content", () => {
    const target = el(`<template><span>old</span></template>`) as HTMLTemplateElement;
    const source = el(`<div><i>9</i></div>`);
    applyContent(target, source);
    // light-DOM child list stays empty; the content fragment holds the clones
    expect(target.childNodes.length).toBe(0);
    expect(target.content.querySelector("i")!.textContent).toBe("9");
  });

  it("mirrors between two <template>s via their content", () => {
    const target = el(`<template><span>old</span></template>`) as HTMLTemplateElement;
    const source = el(`<template><em>new</em></template>`) as HTMLTemplateElement;
    applyContent(target, source);
    expect(target.content.querySelector("em")!.textContent).toBe("new");
  });
});

describe("clearContent", () => {
  it("empties a normal element", () => {
    const target = el(`<div><span>old</span></div>`);
    clearContent(target);
    expect(target.childNodes.length).toBe(0);
  });

  it("empties a <template> target's content", () => {
    const target = el(`<template><span>old</span></template>`) as HTMLTemplateElement;
    clearContent(target);
    expect(target.content.childNodes.length).toBe(0);
  });
});
