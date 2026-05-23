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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"CartApi\": () => (/* binding */ CartApi)\n/* harmony export */ });\nconst ENDPOINTS = {\r\n    add: { path: \"cart/add.js\", httpMethod: \"POST\" },\r\n    change: { path: \"cart/change.js\", httpMethod: \"POST\" },\r\n    update: { path: \"cart/update.js\", httpMethod: \"POST\" },\r\n    clear: { path: \"cart/clear.js\", httpMethod: \"POST\" },\r\n    get: { path: \"cart.js\", httpMethod: \"GET\" },\r\n};\r\nfunction buildRequestInit(endpoint, body, signal) {\r\n    const init = {\r\n        method: ENDPOINTS[endpoint].httpMethod,\r\n        signal,\r\n    };\r\n    if (endpoint === \"get\")\r\n        return init;\r\n    if (body instanceof FormData || body instanceof URLSearchParams) {\r\n        init.headers = { \"X-Requested-With\": \"XMLHttpRequest\" };\r\n        init.body = body;\r\n    }\r\n    else {\r\n        init.headers = { \"Content-Type\": \"application/json\" };\r\n        init.body = JSON.stringify(body ?? {});\r\n    }\r\n    return init;\r\n}\r\nclass CartApi {\r\n    #hooks;\r\n    constructor(hooks = {}) {\r\n        this.#hooks = hooks;\r\n    }\r\n    add(body, options) {\r\n        return this.#request(\"add\", body, options);\r\n    }\r\n    change(body, options) {\r\n        return this.#request(\"change\", body, options);\r\n    }\r\n    update(body, options) {\r\n        return this.#request(\"update\", body, options);\r\n    }\r\n    clear(options) {\r\n        return this.#request(\"clear\", null, options);\r\n    }\r\n    get(options) {\r\n        return this.#request(\"get\", null, options);\r\n    }\r\n    async #request(endpoint, body, options) {\r\n        const meta = options?.meta ?? {};\r\n        const controller = new AbortController();\r\n        const callerSignal = options?.signal;\r\n        let removeSignalListener;\r\n        if (callerSignal) {\r\n            if (callerSignal.aborted) {\r\n                controller.abort(callerSignal.reason);\r\n            }\r\n            else {\r\n                const onCallerAbort = () => controller.abort(callerSignal.reason);\r\n                callerSignal.addEventListener(\"abort\", onCallerAbort);\r\n                removeSignalListener = () => callerSignal.removeEventListener(\"abort\", onCallerAbort);\r\n            }\r\n        }\r\n        const signal = controller.signal;\r\n        const abort = (reason) => controller.abort(reason);\r\n        await this.#hooks.onStart?.({ endpoint, body, meta, abort });\r\n        let result;\r\n        if (signal.aborted) {\r\n            result = { ok: false, status: null, body: null };\r\n        }\r\n        else {\r\n            try {\r\n                const root = window.Shopify?.routes?.root ?? \"/\";\r\n                const url = `${root}${ENDPOINTS[endpoint].path}`;\r\n                const init = buildRequestInit(endpoint, body, signal);\r\n                const response = await fetch(url, init);\r\n                let responseBody = null;\r\n                try {\r\n                    responseBody = await response.json();\r\n                }\r\n                catch {\r\n                    // Some responses may not have JSON body\r\n                }\r\n                result = {\r\n                    ok: response.ok,\r\n                    status: response.status,\r\n                    body: responseBody,\r\n                };\r\n            }\r\n            catch {\r\n                // Network error or abort\r\n                // TODO: handle abort differently, add error, abort info\r\n                result = { ok: false, status: null, body: null };\r\n            }\r\n        }\r\n        removeSignalListener?.();\r\n        await this.#hooks.onEnd?.({ endpoint, body, meta, result });\r\n        return result;\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/api.ts?");

/***/ }),

/***/ "./src/core/emitter.ts":
/*!*****************************!*\
  !*** ./src/core/emitter.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EventEmitter\": () => (/* binding */ EventEmitter),\n/* harmony export */   \"WaitUntilEvent\": () => (/* binding */ WaitUntilEvent)\n/* harmony export */ });\nclass WaitUntilEvent extends CustomEvent {\r\n    #state;\r\n    constructor(type, init, state) {\r\n        super(type, init);\r\n        this.#state = state;\r\n    }\r\n    waitUntil(fn) {\r\n        if (!this.#state.open) {\r\n            throw new DOMException(\"waitUntil() must be called synchronously during event dispatch\", \"InvalidStateError\");\r\n        }\r\n        this.#state.callbacks.push(() => fn(this.#state.waitUntilContext));\r\n    }\r\n}\r\nclass EventEmitter {\r\n    #listeners = new Map();\r\n    on(event, fn) {\r\n        if (!this.#listeners.has(event)) {\r\n            this.#listeners.set(event, []);\r\n        }\r\n        this.#listeners.get(event).push(fn);\r\n    }\r\n    async emit(event, detail, waitUntilContext) {\r\n        // 1. Internal async subscribers\r\n        const listeners = [...(this.#listeners.get(event) || [])];\r\n        for (const fn of listeners) {\r\n            try {\r\n                await fn(detail);\r\n            }\r\n            catch (err) {\r\n                console.error(`${event} internal listener threw`, err);\r\n            }\r\n        }\r\n        // 2. Public DOM event — sync listeners run, waitUntil() callbacks collected on the event itself\r\n        const state = {\r\n            open: true,\r\n            callbacks: [],\r\n            waitUntilContext,\r\n        };\r\n        document.dispatchEvent(new WaitUntilEvent(event, { detail }, state));\r\n        // Seal the event so late waitUntil() calls fail loudly\r\n        state.open = false;\r\n        // 3. Run collected callbacks sequentially.\r\n        for (const fn of state.callbacks) {\r\n            try {\r\n                await fn();\r\n            }\r\n            catch (err) {\r\n                console.error(`${event} waitUntil callback threw`, err);\r\n            }\r\n        }\r\n        // Drop heavy references so a user that retains the event doesn't drag the\r\n        // waitUntilContext and the user-supplied callbacks into long-term memory.\r\n        state.callbacks = [];\r\n        state.waitUntilContext = null;\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/emitter.ts?");

/***/ }),

/***/ "./src/core/index.ts":
/*!***************************!*\
  !*** ./src/core/index.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EVENTS\": () => (/* binding */ EVENTS),\n/* harmony export */   \"add\": () => (/* binding */ add),\n/* harmony export */   \"change\": () => (/* binding */ change),\n/* harmony export */   \"clear\": () => (/* binding */ clear),\n/* harmony export */   \"get\": () => (/* binding */ get),\n/* harmony export */   \"isProcessing\": () => (/* binding */ isProcessing),\n/* harmony export */   \"on\": () => (/* binding */ on),\n/* harmony export */   \"task\": () => (/* binding */ task),\n/* harmony export */   \"update\": () => (/* binding */ update)\n/* harmony export */ });\n/* harmony import */ var _queue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./queue */ \"./src/core/queue.ts\");\n/* harmony import */ var _emitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./emitter */ \"./src/core/emitter.ts\");\n/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ \"./src/core/api.ts\");\n\r\n\r\n\r\nconst EVENTS = {\r\n    REQUEST_START: \"liquid-ajax-cart:request-start\",\r\n    REQUEST_END: \"liquid-ajax-cart:request-end\",\r\n    QUEUE_START: \"liquid-ajax-cart:queue-start\",\r\n    QUEUE_END: \"liquid-ajax-cart:queue-end\",\r\n    QUEUE_IDLE: \"liquid-ajax-cart:queue-idle\",\r\n};\r\nconst emitter = new _emitter__WEBPACK_IMPORTED_MODULE_1__.EventEmitter();\r\nconst api = new _api__WEBPACK_IMPORTED_MODULE_2__.CartApi({\r\n    onStart: (ctx) => emitter.emit(EVENTS.REQUEST_START, ctx, api),\r\n    onEnd: (ctx) => emitter.emit(EVENTS.REQUEST_END, ctx, api),\r\n});\r\n// A single queue step still running this long has most likely deadlocked.\r\nconst QUEUE_STUCK_SECONDS = 10;\r\n// TODO: add a link to docs about deadlocks\r\nconst QUEUE_STUCK_WARNING = `Liquid Ajax Cart: the cart queue has been stuck for over ${QUEUE_STUCK_SECONDS}s — ` +\r\n    `possible deadlock. Calling a queued method (liquidAjaxCart.add/change/update/clear/` +\r\n    `get) from inside task() or a queue-start/queue-end listener deadlocks the queue; ` +\r\n    `use the api passed to your callback instead.`;\r\nconst queue = new _queue__WEBPACK_IMPORTED_MODULE_0__.Queue({\r\n    onStart: () => emitter.emit(EVENTS.QUEUE_START, {}, api),\r\n    onEnd: () => emitter.emit(EVENTS.QUEUE_END, {}, api),\r\n    onIdle: () => document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} })),\r\n    slowAfterMs: QUEUE_STUCK_SECONDS * 1000,\r\n    onSlow: () => console.warn(QUEUE_STUCK_WARNING),\r\n});\r\nfunction task(fn) {\r\n    return queue.enqueue(() => fn(api));\r\n}\r\nfunction add(body, options) {\r\n    return task(async (api) => api.add(body, options));\r\n}\r\nfunction change(body, options) {\r\n    return task(async (api) => api.change(body, options));\r\n}\r\nfunction update(body, options) {\r\n    return task(async (api) => api.update(body, options));\r\n}\r\nfunction clear(options) {\r\n    return task(async (api) => api.clear(options));\r\n}\r\nfunction get(options) {\r\n    return task(async (api) => api.get(options));\r\n}\r\nfunction isProcessing() {\r\n    return queue.isProcessing;\r\n}\r\nfunction on(event, fn) {\r\n    emitter.on(event, fn);\r\n}\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/index.ts?");

/***/ }),

/***/ "./src/core/queue.ts":
/*!***************************!*\
  !*** ./src/core/queue.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Queue\": () => (/* binding */ Queue)\n/* harmony export */ });\nclass Queue {\r\n    #items = [];\r\n    #running = false;\r\n    #options;\r\n    constructor(options) {\r\n        this.#options = options;\r\n    }\r\n    enqueue(fn) {\r\n        return new Promise((resolve, reject) => {\r\n            this.#items.push({\r\n                fn,\r\n                resolve: resolve,\r\n                reject,\r\n            });\r\n            this.#process();\r\n        });\r\n    }\r\n    get isProcessing() {\r\n        return this.#running;\r\n    }\r\n    async #process() {\r\n        if (this.#running)\r\n            return;\r\n        this.#running = true;\r\n        // the outer while loop is needed because tasks might be added to the items list during onEnd execution\r\n        // so the new queue loop will start again without calling onIdle\r\n        while (this.#items.length > 0) {\r\n            if (this.#options?.onStart) {\r\n                const timer = this.#startSlowTimer();\r\n                try {\r\n                    await this.#options.onStart();\r\n                }\r\n                catch (error) {\r\n                    console.error(\"Liquid Ajax Cart: queue onStart hook threw\", error);\r\n                }\r\n                finally {\r\n                    if (timer !== undefined)\r\n                        clearTimeout(timer);\r\n                }\r\n            }\r\n            while (this.#items.length > 0) {\r\n                const item = this.#items.shift();\r\n                const timer = this.#startSlowTimer();\r\n                try {\r\n                    const result = await item.fn();\r\n                    item.resolve(result);\r\n                }\r\n                catch (error) {\r\n                    item.reject(error);\r\n                }\r\n                finally {\r\n                    if (timer !== undefined)\r\n                        clearTimeout(timer);\r\n                }\r\n            }\r\n            if (this.#options?.onEnd) {\r\n                const timer = this.#startSlowTimer();\r\n                try {\r\n                    await this.#options.onEnd();\r\n                }\r\n                catch (error) {\r\n                    console.error(\"Liquid Ajax Cart: queue onEnd hook threw\", error);\r\n                }\r\n                finally {\r\n                    if (timer !== undefined)\r\n                        clearTimeout(timer);\r\n                }\r\n            }\r\n        }\r\n        this.#running = false;\r\n        if (this.#options?.onIdle) {\r\n            try {\r\n                this.#options.onIdle();\r\n            }\r\n            catch (error) {\r\n                console.error(\"Liquid Ajax Cart: queue onIdle hook threw\", error);\r\n            }\r\n        }\r\n    }\r\n    #startSlowTimer() {\r\n        const { slowAfterMs, onSlow } = this.#options ?? {};\r\n        if (slowAfterMs === undefined || !onSlow)\r\n            return undefined;\r\n        return setTimeout(() => {\r\n            try {\r\n                onSlow();\r\n            }\r\n            catch (error) {\r\n                console.error(\"Liquid Ajax Cart: queue onSlow hook threw\", error);\r\n            }\r\n        }, slowAfterMs);\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/core/queue.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"EVENTS\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.EVENTS),\n/* harmony export */   \"add\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.add),\n/* harmony export */   \"change\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.change),\n/* harmony export */   \"clear\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.clear),\n/* harmony export */   \"get\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.get),\n/* harmony export */   \"isProcessing\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.isProcessing),\n/* harmony export */   \"on\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.on),\n/* harmony export */   \"task\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.task),\n/* harmony export */   \"update\": () => (/* reexport safe */ _core_index__WEBPACK_IMPORTED_MODULE_0__.update)\n/* harmony export */ });\n/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/index */ \"./src/core/index.ts\");\n/* harmony import */ var _product_form_product_form__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./product-form/product-form */ \"./src/product-form/product-form.ts\");\n\r\n// Modules auto-initialize on import (side-effect pattern).\r\n\r\n// TODO:\r\n// add extra fetch on error -- probably in the section rendering module\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/index.ts?");

/***/ }),

/***/ "./src/product-form/product-form.ts":
/*!******************************************!*\
  !*** ./src/product-form/product-form.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ProductFormElement\": () => (/* binding */ ProductFormElement),\n/* harmony export */   \"initProductForm\": () => (/* binding */ initProductForm)\n/* harmony export */ });\n/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core */ \"./src/core/index.ts\");\n\r\nconst ELEMENT_TAG = \"ajax-cart-product-form\";\r\nconst ATTR_PROCESSING = \"processing\";\r\n/**\r\n * `<ajax-cart-product-form>` wraps a single Shopify product `<form>` and turns\r\n * its submission into an Ajax `cart/add` request routed through the core queue.\r\n *\r\n * The element exposes a `processing` attribute while its request is in flight\r\n * so merchants can style the loading state (`ajax-cart-product-form[processing]`).\r\n */\r\nclass ProductFormElement extends HTMLElement {\r\n    #form = null;\r\n    connectedCallback() {\r\n        if (this.#form)\r\n            return; // already wired\r\n        // While the HTML parser is still running, connectedCallback can fire before\r\n        // the child <form> has been parsed. Wait for the document in that case.\r\n        if (document.readyState === \"loading\") {\r\n            document.addEventListener(\"DOMContentLoaded\", () => this.#setup(), { once: true });\r\n        }\r\n        else {\r\n            this.#setup();\r\n        }\r\n    }\r\n    disconnectedCallback() {\r\n        this.#form?.removeEventListener(\"submit\", this.#onSubmit);\r\n        this.#form = null;\r\n    }\r\n    #setup() {\r\n        if (this.#form || !this.isConnected)\r\n            return;\r\n        const forms = this.querySelectorAll(\"form\");\r\n        if (forms.length !== 1) {\r\n            console.error(`Liquid Ajax Cart: <${ELEMENT_TAG}> must contain exactly one <form>, found ${forms.length}.`, this);\r\n            return;\r\n        }\r\n        const form = forms[0];\r\n        const root = window.Shopify?.routes?.root ?? \"/\";\r\n        let pathname = \"\";\r\n        try {\r\n            pathname = new URL(form.action).pathname;\r\n        }\r\n        catch {\r\n            // form.action is empty or malformed — pathname stays \"\"\r\n        }\r\n        if (pathname !== `${root}cart/add`) {\r\n            console.error(`Liquid Ajax Cart: <${ELEMENT_TAG}>'s <form> \"action\" is not the \"${root}cart/add\" product-form URL.`, form, this);\r\n            return;\r\n        }\r\n        this.#form = form;\r\n        form.addEventListener(\"submit\", this.#onSubmit);\r\n    }\r\n    #onSubmit = (event) => {\r\n        event.preventDefault();\r\n        if (!this.#form || this.hasAttribute(ATTR_PROCESSING))\r\n            return;\r\n        const formData = new FormData(this.#form);\r\n        // FormData() omits the activated submit button — re-add it when it carries data.\r\n        const submitter = event.submitter;\r\n        if (submitter?.name) {\r\n            formData.append(submitter.name, submitter.value);\r\n        }\r\n        this.setAttribute(ATTR_PROCESSING, \"\");\r\n        (0,_core__WEBPACK_IMPORTED_MODULE_0__.add)(formData, { meta: { initiator: this, source: ELEMENT_TAG } }).finally(() => {\r\n            this.removeAttribute(ATTR_PROCESSING);\r\n        });\r\n    };\r\n}\r\n/** Registers the custom element. Idempotent and safe to call repeatedly. */\r\nfunction initProductForm() {\r\n    if (customElements.get(ELEMENT_TAG))\r\n        return;\r\n    customElements.define(ELEMENT_TAG, ProductFormElement);\r\n}\r\n// Side-effect auto-init — matches the v3 independent-module pattern.\r\ninitProductForm();\r\n\n\n//# sourceURL=webpack://liquid-ajax-cart/./src/product-form/product-form.ts?");

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
