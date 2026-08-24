export * from "./core";

// Modules auto-initialize on import (side-effect pattern).
//
// Order is load-bearing for line-item-errors only: it writes into DOM that the
// sections module replaces on the same request, so it must subscribe after it.
// See src/line-item-errors/index.ts.
import "./product-form";
import "./sections";
import "./line-item-errors";
import "./quantity";
