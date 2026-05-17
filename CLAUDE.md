# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liquid Ajax Cart is a JavaScript library for Shopify that enables Ajax-powered cart functionality using only Liquid templates and HTML data attributes — no JavaScript required by the merchant. Published as `liquid-ajax-cart` on npm.

- **Docs**: https://liquid-ajax-cart.js.org
- **Demo store**: https://liquid-ajax-cart.myshopify.com (password: `liquid-ajax-cart`)

## Build & Development Commands

```bash
npm start                  # Run webpack watch + Shopify theme dev in parallel
npm run webpack-watch      # Webpack dev build with watch mode only
npm run shopify-watch      # Shopify theme dev server only (store: liquid-ajax-cart)
npm run build              # Production build (3 outputs: versioned, latest, npm)
```

Production build outputs:
1. `docs/v2/releases/liquid-ajax-cart-v{VERSION}.js` — versioned release
2. `docs/v2/releases/last/liquid-ajax-cart.js` — latest release for docs
3. `liquid-ajax-cart.js` — npm package distribution

No test suite or linter is configured.

## Branch State (v3 Refactor)

The `v3` branch has a major rewrite in progress:
- `src/` — new source (entry point at `src/index.ts`, currently near-empty)
- `_src-old/` — complete v2 source code moved here for reference (untracked)
- Webpack entry point is `src/index.ts`
- The built `demo/assets/liquid-ajax-cart.js` is used by the demo Shopify theme
- **See `V3-ARCHITECTURE.md`** for all decided architecture directions and open questions

## Architecture (v2 source in `_src-old/`)

**Entry**: `index.ts` — initializes all modules, exposes `window.liquidAjaxCart` API with read-only properties via `Object.defineProperty`.

**Initialization order** (matters — modules depend on earlier ones):
1. `sections` → `messages` → `mutations` → `state` (async) → `dom-binder` → `controls` → `global-classes` → API methods → event listeners → dispatch `liquid-ajax-cart:init`

**Core modules**:

| Module | Purpose |
|---|---|
| `ajax-api.ts` | Request queue system for Shopify Cart API (`/cart/*.js`). Queues requests sequentially to prevent race conditions. Supports priority (`important`), AbortSignal, section HTML fetching (batched max 5/request), and event dispatching. |
| `state.ts` | Cart state (`cart` + `previousCart`). Initializes from `data-ajax-cart-initial-state` script tag or falls back to `/cart.js` fetch. |
| `sections.ts` | Auto-detects sections with `data-ajax-cart-section`, re-renders HTML on cart updates. Preserves scroll positions (`data-ajax-cart-section-scroll`) and static elements (`data-ajax-cart-static-element`). |
| `dom-binder.ts` | Data binding via `data-ajax-cart-bind="cart.item_count"` with pipe formatters (e.g. `| money_with_currency`). |
| `controls/` | Custom elements (`<ajax-cart-product-form>`, `<ajax-cart-quantity>`) and data-attribute controls (`data-ajax-cart-quantity-input`, `data-ajax-cart-property-input`, `data-ajax-cart-request-button`). Quantity controls have debouncing (default 300ms). |
| `mutations.ts` | Middleware system — functions that can modify/inject requests before execution. |
| `messages.ts` | Error display routing to `data-ajax-cart-errors` containers. |
| `global-classes.ts` | Body CSS classes: `js-ajax-cart-init`, `js-ajax-cart-processing`, `js-ajax-cart-empty`, `js-ajax-cart-not-empty`. |
| `settings.ts` | Configuration via `window.liquidAjaxCart.conf()`: `binderFormatters`, `requestErrorText`, `updateOnWindowFocus`, `quantityTagAllowZero`, `quantityTagDebounce`, `mutations`, `extraRequestOnError`. |

**Event system**: Public events on `document` — `liquid-ajax-cart:init`, `liquid-ajax-cart:queue-start`, `liquid-ajax-cart:queue-end`, `liquid-ajax-cart:request-start`, `liquid-ajax-cart:request-end`. Internal variants use `-internal` suffix.

**Public API** (`window.liquidAjaxCart`): `conf()`, `get()`, `add()`, `change()`, `update()`, `clear()`, plus read-only `cart`, `processing`, `init`.

## Tech Stack

- TypeScript (ES6 target, ES6 modules) compiled via ts-loader
- Webpack 5 bundling to ES module output
- No framework dependencies — vanilla JS with Web Components API
- Docs site: Jekyll (in `docs/`)
- Demo store files live in `demo/`: `demo/sections/`, `demo/snippets/`, `demo/templates/`, `demo/layout/`, `demo/assets/`, `demo/config/`, `demo/locales/`

## Key Implementation Details

- All Shopify Cart API calls go through a single sequential queue in `ajax-api.ts` to avoid race conditions
- Section HTML requests are automatically batched (max 5 sections per Shopify API call) and paginated if more are needed
- Custom elements use the Web Components API (`customElements.define`)
- The library attaches to `window.liquidAjaxCart` only once (guarded by `if (!('liquidAjaxCart' in window))`)
- Cart state refresh happens on window focus and back/forward navigation (`pageshow` event)
