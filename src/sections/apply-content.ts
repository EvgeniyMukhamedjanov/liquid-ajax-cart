// src/sections/apply-content.ts

// The content of a <template> lives in its `.content` DocumentFragment, not in
// its child node list — reading `template.childNodes` yields nothing. So both
// reading a source and writing a target route through the element's `.content`
// when it is a <template>, and through the element itself otherwise. This lets a
// merchant use an inert <template> as a mirror source (e.g. a header cart-count
// rendered inside the cart section) whose content is copied into a visible target.
function contentHost(el: Element): DocumentFragment | Element {
  return el instanceof HTMLTemplateElement ? el.content : el;
}

// The single seam where the live DOM is mutated. A future morph strategy
// swaps this out; nothing else in the module changes. Children are cloned via
// importNode so the parsed source document is never mutated or drained.
export function applyContent(target: Element, source: Element): void {
  contentHost(target).replaceChildren(
    ...Array.from(contentHost(source).childNodes, (node) => document.importNode(node, true)),
  );
}

// Clearing is also a DOM mutation, so it goes through the same template-aware
// seam: emptying a <template> target must clear its `.content`, not its (empty)
// child node list.
export function clearContent(target: Element): void {
  contentHost(target).replaceChildren();
}
