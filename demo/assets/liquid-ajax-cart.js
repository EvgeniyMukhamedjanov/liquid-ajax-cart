/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ var __webpack_modules__ = ({

/***/ "./src/core/api.ts":
/*!*************************!*\
  !*** ./src/core/api.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"CartApi\": () => (/* binding */ CartApi)\n/* harmony export */ });\nconst ENDPOINTS = {\n    add: { path: \"cart/add.js\", httpMethod: \"POST\" },\n    change: { path: \"cart/change.js\", httpMethod: \"POST\" },\n    update: { path: \"cart/update.js\", httpMethod: \"POST\" },\n    clear: { path: \"cart/clear.js\", httpMethod: \"POST\" },\n    get: { path: \"cart.js\", httpMethod: \"GET\" },\n};\nfunction buildRequestInit(endpoint, body, signal) {\n    const init = {\n        method: ENDPOINTS[endpoint].httpMethod,\n        signal,\n    };\n    if (endpoint === \"get\")\n        return init;\n    if (body instanceof FormData || body instanceof URLSearchParams) {\n        init.headers = { \"X-Requested-With\": \"XMLHttpRequest\" };\n        init.body = body;\n    }\n    else {\n        init.headers = { \"Content-Type\": \"application/json\" };\n        init.body = JSON.stringify(body ?? {});\n    }\n    return init;\n}\nclass CartApi {\n    #hooks;\n    constructor(hooks = {}) {\n        this.#hooks = hooks;\n    }\n    add(body, options) {\n        return this.#request(\"add\", body, options);\n    }\n    change(body, options) {\n        return this.#request(\"change\", body, options);\n    }\n    update(body, options) {\n        return this.#request(\"update\", body, options);\n    }\n    clear(options) {\n        return this.#request(\"clear\", null, options);\n    }\n    get(options) {\n        return this.#request(\"get\", null, options);\n    }\n    async #request(endpoint, body, options) {\n        const meta = options?.meta ?? {};\n        const controller = new AbortController();\n        const callerSignal = options?.signal;\n        let removeSignalListener;\n        if (callerSignal) {\n            if (callerSignal.aborted) {\n                controller.abort(callerSignal.reason);\n            }\n            else {\n                const onCallerAbort = () => controller.abort(callerSignal.reason);\n                callerSignal.addEventListener(\"abort\", onCallerAbort);\n                removeSignalListener = () => callerSignal.removeEventListener(\"abort\", onCallerAbort);\n            }\n        }\n        const signal = controller.signal;\n        const abort = (reason) => controller.abort(reason);\n        await this.#hooks.onStart?.({ endpoint, body, meta, abort });\n        let result;\n        if (signal.aborted) {\n            result = { ok: false, status: null, body: null };\n        }\n        else {\n            try {\n                const root = window.Shopify?.routes?.root ?? \"/\";\n                const url = `${root}${ENDPOINTS[endpoint].path}`;\n                const init = buildRequestInit(endpoint, body, signal);\n                const response = await fetch(url, init);\n                let responseBody = null;\n                try {\n                    responseBody = await response.json();\n                }\n                catch {\n                    // Some responses may not have JSON body\n                }\n                result = {\n                    ok: response.ok,\n                    status: response.status,\n                    body: responseBody,\n                };\n            }\n            catch {\n                // Network error or abort\n                // TODO: handle abort differently, add error, abort info\n                result = { ok: false, status: null, body: null };\n            }\n        }\n        removeSignalListener?.();\n        await this.#hooks.onEnd?.({ endpoint, body, meta, result });\n        return result;\n    }\n}\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/api.ts?");

/***/ }),

/***/ "./src/core/core.ts":
/*!**************************!*\
  !*** ./src/core/core.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EVENTS\": () => (/* binding */ EVENTS),\n/* harmony export */   \"add\": () => (/* binding */ add),\n/* harmony export */   \"change\": () => (/* binding */ change),\n/* harmony export */   \"clear\": () => (/* binding */ clear),\n/* harmony export */   \"get\": () => (/* binding */ get),\n/* harmony export */   \"isProcessing\": () => (/* binding */ isProcessing),\n/* harmony export */   \"on\": () => (/* binding */ on),\n/* harmony export */   \"task\": () => (/* binding */ task),\n/* harmony export */   \"update\": () => (/* binding */ update)\n/* harmony export */ });\n/* harmony import */ var _queue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./queue */ \"./src/core/queue.ts\");\n/* harmony import */ var _emitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./emitter */ \"./src/core/emitter.ts\");\n/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ \"./src/core/api.ts\");\n\n\n\nconst EVENTS = {\n    REQUEST_START: \"liquid-ajax-cart:request-start\",\n    REQUEST_END: \"liquid-ajax-cart:request-end\",\n    QUEUE_START: \"liquid-ajax-cart:queue-start\",\n    QUEUE_END: \"liquid-ajax-cart:queue-end\",\n    QUEUE_IDLE: \"liquid-ajax-cart:queue-idle\",\n};\nconst emitter = new _emitter__WEBPACK_IMPORTED_MODULE_1__.EventEmitter();\nconst api = new _api__WEBPACK_IMPORTED_MODULE_2__.CartApi({\n    onStart: (ctx) => emitter.emit(EVENTS.REQUEST_START, ctx, api),\n    onEnd: (ctx) => emitter.emit(EVENTS.REQUEST_END, ctx, api),\n});\n// A single queue step still running this long has most likely deadlocked.\nconst QUEUE_STUCK_SECONDS = 10;\n// TODO: add a link to docs about deadlocks\nconst QUEUE_STUCK_WARNING = `Liquid Ajax Cart: the cart queue has been stuck for over ${QUEUE_STUCK_SECONDS}s — ` +\n    `possible deadlock. Calling a queued method (liquidAjaxCart.add/change/update/clear/` +\n    `get) from inside task() or a queue-start/queue-end listener deadlocks the queue; ` +\n    `use the api passed to your callback instead.`;\nconst queue = new _queue__WEBPACK_IMPORTED_MODULE_0__.Queue({\n    onStart: () => emitter.emit(EVENTS.QUEUE_START, {}, api),\n    onEnd: () => emitter.emit(EVENTS.QUEUE_END, {}, api),\n    onIdle: () => document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} })),\n    slowAfterMs: QUEUE_STUCK_SECONDS * 1000,\n    onSlow: () => console.warn(QUEUE_STUCK_WARNING),\n});\nfunction task(fn) {\n    return queue.enqueue(() => fn(api));\n}\nfunction add(body, options) {\n    return task(async (api) => api.add(body, options));\n}\nfunction change(body, options) {\n    return task(async (api) => api.change(body, options));\n}\nfunction update(body, options) {\n    return task(async (api) => api.update(body, options));\n}\nfunction clear(options) {\n    return task(async (api) => api.clear(options));\n}\nfunction get(options) {\n    return task(async (api) => api.get(options));\n}\nfunction isProcessing() {\n    return queue.isProcessing;\n}\nfunction on(event, fn) {\n    emitter.on(event, fn);\n}\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/core.ts?");

/***/ }),

/***/ "./src/core/emitter.ts":
/*!*****************************!*\
  !*** ./src/core/emitter.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EventEmitter\": () => (/* binding */ EventEmitter),\n/* harmony export */   \"WaitUntilEvent\": () => (/* binding */ WaitUntilEvent)\n/* harmony export */ });\nclass WaitUntilEvent extends CustomEvent {\n    #state;\n    constructor(type, init, state) {\n        super(type, init);\n        this.#state = state;\n    }\n    waitUntil(fn) {\n        if (!this.#state.open) {\n            throw new DOMException(\"waitUntil() must be called synchronously during event dispatch\", \"InvalidStateError\");\n        }\n        this.#state.callbacks.push(() => fn(this.#state.waitUntilContext));\n    }\n}\nclass EventEmitter {\n    #listeners = new Map();\n    on(event, fn) {\n        if (!this.#listeners.has(event)) {\n            this.#listeners.set(event, []);\n        }\n        this.#listeners.get(event).push(fn);\n    }\n    async emit(event, detail, waitUntilContext) {\n        // 1. Internal async subscribers\n        const listeners = [...(this.#listeners.get(event) || [])];\n        for (const fn of listeners) {\n            try {\n                await fn(detail);\n            }\n            catch (err) {\n                console.error(`${event} internal listener threw`, err);\n            }\n        }\n        // 2. Public DOM event — sync listeners run, waitUntil() callbacks collected on the event itself\n        const state = {\n            open: true,\n            callbacks: [],\n            waitUntilContext,\n        };\n        document.dispatchEvent(new WaitUntilEvent(event, { detail }, state));\n        // Seal the event so late waitUntil() calls fail loudly\n        state.open = false;\n        // 3. Run collected callbacks sequentially.\n        for (const fn of state.callbacks) {\n            try {\n                await fn();\n            }\n            catch (err) {\n                console.error(`${event} waitUntil callback threw`, err);\n            }\n        }\n        // Drop heavy references so a user that retains the event doesn't drag the\n        // waitUntilContext and the user-supplied callbacks into long-term memory.\n        state.callbacks = [];\n        state.waitUntilContext = null;\n    }\n}\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/emitter.ts?");

/***/ }),

/***/ "./src/core/index.ts":
/*!***************************!*\
  !*** ./src/core/index.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EVENTS\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.EVENTS),\n/* harmony export */   \"add\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.add),\n/* harmony export */   \"change\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.change),\n/* harmony export */   \"clear\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.clear),\n/* harmony export */   \"get\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.get),\n/* harmony export */   \"isProcessing\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.isProcessing),\n/* harmony export */   \"on\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.on),\n/* harmony export */   \"task\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.task),\n/* harmony export */   \"update\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.update)\n/* harmony export */ });\n/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core */ \"./src/core/core.ts\");\n\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/index.ts?");

/***/ }),

/***/ "./src/core/queue.ts":
/*!***************************!*\
  !*** ./src/core/queue.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Queue\": () => (/* binding */ Queue)\n/* harmony export */ });\nclass Queue {\n    #items = [];\n    #running = false;\n    #options;\n    constructor(options) {\n        this.#options = options;\n    }\n    enqueue(fn) {\n        return new Promise((resolve, reject) => {\n            this.#items.push({\n                fn,\n                resolve: resolve,\n                reject,\n            });\n            this.#process();\n        });\n    }\n    get isProcessing() {\n        return this.#running;\n    }\n    async #process() {\n        if (this.#running)\n            return;\n        this.#running = true;\n        // the outer while loop is needed because tasks might be added to the items list during onEnd execution\n        // so the new queue loop will start again without calling onIdle\n        while (this.#items.length > 0) {\n            if (this.#options?.onStart) {\n                const timer = this.#startSlowTimer();\n                try {\n                    await this.#options.onStart();\n                }\n                catch (error) {\n                    console.error(\"Liquid Ajax Cart: queue onStart hook threw\", error);\n                }\n                finally {\n                    if (timer !== undefined)\n                        clearTimeout(timer);\n                }\n            }\n            while (this.#items.length > 0) {\n                const item = this.#items.shift();\n                const timer = this.#startSlowTimer();\n                try {\n                    const result = await item.fn();\n                    item.resolve(result);\n                }\n                catch (error) {\n                    item.reject(error);\n                }\n                finally {\n                    if (timer !== undefined)\n                        clearTimeout(timer);\n                }\n            }\n            if (this.#options?.onEnd) {\n                const timer = this.#startSlowTimer();\n                try {\n                    await this.#options.onEnd();\n                }\n                catch (error) {\n                    console.error(\"Liquid Ajax Cart: queue onEnd hook threw\", error);\n                }\n                finally {\n                    if (timer !== undefined)\n                        clearTimeout(timer);\n                }\n            }\n        }\n        this.#running = false;\n        if (this.#options?.onIdle) {\n            try {\n                this.#options.onIdle();\n            }\n            catch (error) {\n                console.error(\"Liquid Ajax Cart: queue onIdle hook threw\", error);\n            }\n        }\n    }\n    #startSlowTimer() {\n        const { slowAfterMs, onSlow } = this.#options ?? {};\n        if (slowAfterMs === undefined || !onSlow)\n            return undefined;\n        return setTimeout(() => {\n            try {\n                onSlow();\n            }\n            catch (error) {\n                console.error(\"Liquid Ajax Cart: queue onSlow hook threw\", error);\n            }\n        }, slowAfterMs);\n    }\n}\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/queue.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EVENTS\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.EVENTS),\n/* harmony export */   \"add\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.add),\n/* harmony export */   \"change\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.change),\n/* harmony export */   \"clear\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.clear),\n/* harmony export */   \"get\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.get),\n/* harmony export */   \"isProcessing\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.isProcessing),\n/* harmony export */   \"on\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.on),\n/* harmony export */   \"task\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.task),\n/* harmony export */   \"update\": () => (/* reexport safe */ _core__WEBPACK_IMPORTED_MODULE_0__.update)\n/* harmony export */ });\n/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core */ \"./src/core/index.ts\");\n/* harmony import */ var _product_form__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./product-form */ \"./src/product-form/index.ts\");\n\n// Modules auto-initialize on import (side-effect pattern).\n\n// TODO:\n// add extra fetch on error -- probably in the section rendering module\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/index.ts?");

/***/ }),

/***/ "./src/product-form/index.ts":
/*!***********************************!*\
  !*** ./src/product-form/index.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ProductFormElement\": () => (/* reexport safe */ _product_form__WEBPACK_IMPORTED_MODULE_0__.ProductFormElement),\n/* harmony export */   \"initProductForm\": () => (/* reexport safe */ _product_form__WEBPACK_IMPORTED_MODULE_0__.initProductForm)\n/* harmony export */ });\n/* harmony import */ var _product_form__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./product-form */ \"./src/product-form/product-form.ts\");\n// Public surface of the `product-form` module. Importing it auto-registers the\n// custom element via the side-effect init in product-form.ts.\n\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/product-form/index.ts?");

/***/ }),

/***/ "./src/product-form/product-form.ts":
/*!******************************************!*\
  !*** ./src/product-form/product-form.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ProductFormElement\": () => (/* binding */ ProductFormElement),\n/* harmony export */   \"initProductForm\": () => (/* binding */ initProductForm)\n/* harmony export */ });\n/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core */ \"./src/core/index.ts\");\n\nconst ELEMENT_TAG = \"ajax-cart-product-form\";\nconst ATTR_PROCESSING = \"processing\";\nclass ProductFormElement extends HTMLElement {\n    #form = null;\n    connectedCallback() {\n        if (document.readyState !== \"loading\" || this.querySelector(\"form\")) {\n            this.refresh();\n            return;\n        }\n        document.addEventListener(\"DOMContentLoaded\", () => this.refresh(), { once: true });\n    }\n    disconnectedCallback() {\n        this.refresh();\n    }\n    refresh() {\n        this.#form?.removeEventListener(\"submit\", this.#onSubmit);\n        this.#form = null;\n        if (!this.isConnected)\n            return;\n        const forms = this.querySelectorAll(\"form\");\n        if (forms.length !== 1) {\n            console.error(`Liquid Ajax Cart: <${ELEMENT_TAG}> must contain exactly one <form>, found ${forms.length}.`, this);\n            return;\n        }\n        const form = forms[0];\n        const root = window.Shopify?.routes?.root ?? \"/\";\n        let pathname = \"\";\n        try {\n            pathname = new URL(form.action).pathname;\n        }\n        catch {\n            // form.action is empty or malformed — pathname stays \"\"\n        }\n        if (pathname !== `${root}cart/add`) {\n            console.error(`Liquid Ajax Cart: <${ELEMENT_TAG}>'s <form> \"action\" is not the \"${root}cart/add\" product-form URL.`, form, this);\n            return;\n        }\n        this.#form = form;\n        form.addEventListener(\"submit\", this.#onSubmit);\n    }\n    #onSubmit = (event) => {\n        event.preventDefault();\n        if (!this.#form || this.hasAttribute(ATTR_PROCESSING))\n            return;\n        const formData = new FormData(this.#form, event.submitter);\n        this.setAttribute(ATTR_PROCESSING, \"\");\n        (0,_core__WEBPACK_IMPORTED_MODULE_0__.add)(formData, { meta: { initiator: this, source: ELEMENT_TAG } }).finally(() => {\n            this.removeAttribute(ATTR_PROCESSING);\n        });\n    };\n}\nfunction initProductForm() {\n    if (customElements.get(ELEMENT_TAG))\n        return;\n    customElements.define(ELEMENT_TAG, ProductFormElement);\n}\ninitProductForm();\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/product-form/product-form.ts?");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module can't be inlined because the eval devtool is used.
/******/ var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ var __webpack_exports__EVENTS = __webpack_exports__.EVENTS;
/******/ var __webpack_exports__add = __webpack_exports__.add;
/******/ var __webpack_exports__change = __webpack_exports__.change;
/******/ var __webpack_exports__clear = __webpack_exports__.clear;
/******/ var __webpack_exports__get = __webpack_exports__.get;
/******/ var __webpack_exports__isProcessing = __webpack_exports__.isProcessing;
/******/ var __webpack_exports__on = __webpack_exports__.on;
/******/ var __webpack_exports__task = __webpack_exports__.task;
/******/ var __webpack_exports__update = __webpack_exports__.update;
/******/ export { __webpack_exports__EVENTS as EVENTS, __webpack_exports__add as add, __webpack_exports__change as change, __webpack_exports__clear as clear, __webpack_exports__get as get, __webpack_exports__isProcessing as isProcessing, __webpack_exports__on as on, __webpack_exports__task as task, __webpack_exports__update as update };
/******/ 
