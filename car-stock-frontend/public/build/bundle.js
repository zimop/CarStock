
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop$1() {}

	const identity = (x) => x;

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	/** @returns {{}} */
	function exclude_internal_props(props) {
		const result = {};
		for (const k in props) if (k[0] !== '$') result[k] = props[k];
		return result;
	}

	/** @returns {{}} */
	function compute_rest_props(props, keys) {
		const rest = {};
		keys = new Set(keys);
		for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
		return rest;
	}

	const is_client = typeof window !== 'undefined';

	/** @type {() => number} */
	let now = is_client ? () => window.performance.now() : () => Date.now();

	let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop$1;

	const tasks = new Set();

	/**
	 * @param {number} now
	 * @returns {void}
	 */
	function run_tasks(now) {
		tasks.forEach((task) => {
			if (!task.c(now)) {
				tasks.delete(task);
				task.f();
			}
		});
		if (tasks.size !== 0) raf(run_tasks);
	}

	/**
	 * Creates a new task that runs on each raf frame
	 * until it returns a falsy value or is aborted
	 * @param {import('./private.js').TaskCallback} callback
	 * @returns {import('./private.js').Task}
	 */
	function loop(callback) {
		/** @type {import('./private.js').TaskEntry} */
		let task;
		if (tasks.size === 0) raf(run_tasks);
		return {
			promise: new Promise((fulfill) => {
				tasks.add((task = { c: callback, f: fulfill }));
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {Node} node
	 * @returns {CSSStyleSheet}
	 */
	function append_empty_stylesheet(node) {
		const style_element = element('style');
		// For transitions to work without 'style-src: unsafe-inline' Content Security Policy,
		// these empty tags need to be allowed with a hash as a workaround until we move to the Web Animations API.
		// Using the hash for the empty string (for an empty tag) works in all browsers except Safari.
		// So as a workaround for the workaround, when we append empty style tags we set their content to /* empty */.
		// The hash 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=' will then work even in Safari.
		style_element.textContent = '/* empty */';
		append_stylesheet(get_root_for_style(node), style_element);
		return style_element.sheet;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}
	/**
	 * List of attributes that should always be set through the attr method,
	 * because updating them through the property setter doesn't work reliably.
	 * In the example of `width`/`height`, the problem is that the setter only
	 * accepts numeric values, but the attribute can also be set to a string like `50%`.
	 * If this list becomes too big, rethink this approach.
	 */
	const always_set_through_set_attribute = ['width', 'height'];

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {{ [x: string]: string }} attributes
	 * @returns {void}
	 */
	function set_attributes(node, attributes) {
		// @ts-ignore
		const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
		for (const key in attributes) {
			if (attributes[key] == null) {
				node.removeAttribute(key);
			} else if (key === 'style') {
				node.style.cssText = attributes[key];
			} else if (key === '__value') {
				/** @type {any} */ (node).value = node[key] = attributes[key];
			} else if (
				descriptors[key] &&
				descriptors[key].set &&
				always_set_through_set_attribute.indexOf(key) === -1
			) {
				node[key] = attributes[key];
			} else {
				attr(node, key, attributes[key]);
			}
		}
	}

	/**
	 * @param {HTMLInputElement[]} group
	 * @returns {{ p(...inputs: HTMLInputElement[]): void; r(): void; }}
	 */
	function init_binding_group(group) {
		/**
		 * @type {HTMLInputElement[]} */
		let _inputs;
		return {
			/* push */ p(...inputs) {
				_inputs = inputs;
				_inputs.forEach((input) => group.push(input));
			},
			/* remove */ r() {
				_inputs.forEach((input) => group.splice(group.indexOf(input), 1));
			}
		};
	}

	/** @returns {number} */
	function to_number(value) {
		return value === '' ? null : +value;
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
	}

	/**
	 * @returns {void} */
	function select_option(select, value, mounting) {
		for (let i = 0; i < select.options.length; i += 1) {
			const option = select.options[i];
			if (option.__value === value) {
				option.selected = true;
				return;
			}
		}
		if (!mounting || value !== undefined) {
			select.selectedIndex = -1; // no option should be selected
		}
	}

	/**
	 * @returns {void} */
	function select_options(select, value) {
		for (let i = 0; i < select.options.length; i += 1) {
			const option = select.options[i];
			option.selected = ~value.indexOf(option.__value);
		}
	}

	function select_value(select) {
		const selected_option = select.querySelector(':checked');
		return selected_option && selected_option.__value;
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	// we need to store the information for multiple documents because a Svelte application could also contain iframes
	// https://github.com/sveltejs/svelte/issues/3624
	/** @type {Map<Document | ShadowRoot, import('./private.d.ts').StyleInformation>} */
	const managed_styles = new Map();

	let active = 0;

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	/**
	 * @param {string} str
	 * @returns {number}
	 */
	function hash(str) {
		let hash = 5381;
		let i = str.length;
		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	/**
	 * @param {Document | ShadowRoot} doc
	 * @param {Element & ElementCSSInlineStyle} node
	 * @returns {{ stylesheet: any; rules: {}; }}
	 */
	function create_style_information(doc, node) {
		const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
		managed_styles.set(doc, info);
		return info;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {number} a
	 * @param {number} b
	 * @param {number} duration
	 * @param {number} delay
	 * @param {(t: number) => number} ease
	 * @param {(t: number, u: number) => string} fn
	 * @param {number} uid
	 * @returns {string}
	 */
	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';
		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}
		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;
		const doc = get_root_for_style(node);
		const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
		if (!rules[name]) {
			rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}
		const animation = node.style.animation || '';
		node.style.animation = `${
		animation ? `${animation}, ` : ''
	}${name} ${duration}ms linear ${delay}ms 1 both`;
		active += 1;
		return name;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {string} [name]
	 * @returns {void}
	 */
	function delete_rule(node, name) {
		const previous = (node.style.animation || '').split(', ');
		const next = previous.filter(
			name
				? (anim) => anim.indexOf(name) < 0 // remove specific animation
				: (anim) => anim.indexOf('__svelte') === -1 // remove all Svelte animations
		);
		const deleted = previous.length - next.length;
		if (deleted) {
			node.style.animation = next.join(', ');
			active -= deleted;
			if (!active) clear_rules();
		}
	}

	/** @returns {void} */
	function clear_rules() {
		raf(() => {
			if (active) return;
			managed_styles.forEach((info) => {
				const { ownerNode } = info.stylesheet;
				// there is no ownerNode if it runs on jsdom.
				if (ownerNode) detach(ownerNode);
			});
			managed_styles.clear();
		});
	}

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately after the component has been updated.
	 *
	 * The first time the callback runs will be after the initial `onMount`
	 *
	 * https://svelte.dev/docs/svelte#afterupdate
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function afterUpdate(fn) {
		get_current_component().$$.after_update.push(fn);
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	/**
	 * Associates an arbitrary `context` object with the current component and the specified `key`
	 * and returns that object. The context is then available to children of the component
	 * (including slotted content) with `getContext`.
	 *
	 * Like lifecycle functions, this must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#setcontext
	 * @template T
	 * @param {any} key
	 * @param {T} context
	 * @returns {T}
	 */
	function setContext(key, context) {
		get_current_component().$$.context.set(key, context);
		return context;
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	/**
	 * @param component
	 * @param event
	 * @returns {void}
	 */
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];
		if (callbacks) {
			// @ts-ignore
			callbacks.slice().forEach((fn) => fn.call(this, event));
		}
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	/** @returns {void} */
	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	/**
	 * @type {Promise<void> | null}
	 */
	let promise;

	/**
	 * @returns {Promise<void>}
	 */
	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}
		return promise;
	}

	/**
	 * @param {Element} node
	 * @param {INTRO | OUTRO | boolean} direction
	 * @param {'start' | 'end'} kind
	 * @returns {void}
	 */
	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/**
	 * @type {import('../transition/public.js').TransitionConfig}
	 */
	const null_transition = { duration: 0 };

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @returns {{ start(): void; invalidate(): void; end(): void; }}
	 */
	function create_in_transition(node, fn, params) {
		/**
		 * @type {TransitionOptions} */
		const options = { direction: 'in' };
		let config = fn(node, params, options);
		let running = false;
		let animation_name;
		let task;
		let uid = 0;

		/**
		 * @returns {void} */
		function cleanup() {
			if (animation_name) delete_rule(node, animation_name);
		}

		/**
		 * @returns {void} */
		function go() {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop$1,
				css
			} = config || null_transition;
			if (css) animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
			tick(0, 1);
			const start_time = now() + delay;
			const end_time = start_time + duration;
			if (task) task.abort();
			running = true;
			add_render_callback(() => dispatch(node, true, 'start'));
			task = loop((now) => {
				if (running) {
					if (now >= end_time) {
						tick(1, 0);
						dispatch(node, true, 'end');
						cleanup();
						return (running = false);
					}
					if (now >= start_time) {
						const t = easing((now - start_time) / duration);
						tick(t, 1 - t);
					}
				}
				return running;
			});
		}
		let started = false;
		return {
			start() {
				if (started) return;
				started = true;
				delete_rule(node);
				if (is_function(config)) {
					config = config(options);
					wait().then(go);
				} else {
					go();
				}
			},
			invalidate() {
				started = false;
			},
			end() {
				if (running) {
					cleanup();
					running = false;
				}
			}
		};
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @returns {{ end(reset: any): void; }}
	 */
	function create_out_transition(node, fn, params) {
		/** @type {TransitionOptions} */
		const options = { direction: 'out' };
		let config = fn(node, params, options);
		let running = true;
		let animation_name;
		const group = outros;
		group.r += 1;
		/** @type {boolean} */
		let original_inert_value;

		/**
		 * @returns {void} */
		function go() {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop$1,
				css
			} = config || null_transition;

			if (css) animation_name = create_rule(node, 1, 0, duration, delay, easing, css);

			const start_time = now() + delay;
			const end_time = start_time + duration;
			add_render_callback(() => dispatch(node, false, 'start'));

			if ('inert' in node) {
				original_inert_value = /** @type {HTMLElement} */ (node).inert;
				node.inert = true;
			}

			loop((now) => {
				if (running) {
					if (now >= end_time) {
						tick(0, 1);
						dispatch(node, false, 'end');
						if (!--group.r) {
							// this will result in `end()` being called,
							// so we don't need to clean up here
							run_all(group.c);
						}
						return false;
					}
					if (now >= start_time) {
						const t = easing((now - start_time) / duration);
						tick(1 - t, t);
					}
				}
				return running;
			});
		}

		if (is_function(config)) {
			wait().then(() => {
				// @ts-ignore
				config = config(options);
				go();
			});
		} else {
			go();
		}

		return {
			end(reset) {
				if (reset && 'inert' in node) {
					node.inert = original_inert_value;
				}
				if (reset && config.tick) {
					config.tick(1, 0);
				}
				if (running) {
					if (animation_name) delete_rule(node, animation_name);
					running = false;
				}
			}
		};
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function bind$1(component, name, callback) {
		const index = component.$$.props[name];
		if (index !== undefined) {
			component.$$.bound[index] = callback;
			callback(component.$$.ctx[index]);
		}
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop$1,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop$1;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop$1;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION$1 = '4.2.19';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION$1, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	function construct_svelte_component_dev(component, props) {
		const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
		try {
			const instance = new component(props);
			if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
				throw new Error(error_message);
			}
			return instance;
		} catch (err) {
			const { message } = err;
			if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
				throw new Error(error_message);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	function bind(fn, thisArg) {
	  return function wrap() {
	    return fn.apply(thisArg, arguments);
	  };
	}

	// utils is a library of generic helper functions non-specific to axios

	const {toString} = Object.prototype;
	const {getPrototypeOf} = Object;

	const kindOf = (cache => thing => {
	    const str = toString.call(thing);
	    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
	})(Object.create(null));

	const kindOfTest = (type) => {
	  type = type.toLowerCase();
	  return (thing) => kindOf(thing) === type
	};

	const typeOfTest = type => thing => typeof thing === type;

	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 *
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	const {isArray} = Array;

	/**
	 * Determine if a value is undefined
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	const isUndefined = typeOfTest('undefined');

	/**
	 * Determine if a value is a Buffer
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a Buffer, otherwise false
	 */
	function isBuffer(val) {
	  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
	    && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
	}

	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	const isArrayBuffer = kindOfTest('ArrayBuffer');


	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  let result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
	  }
	  return result;
	}

	/**
	 * Determine if a value is a String
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	const isString = typeOfTest('string');

	/**
	 * Determine if a value is a Function
	 *
	 * @param {*} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	const isFunction = typeOfTest('function');

	/**
	 * Determine if a value is a Number
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	const isNumber = typeOfTest('number');

	/**
	 * Determine if a value is an Object
	 *
	 * @param {*} thing The value to test
	 *
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	const isObject = (thing) => thing !== null && typeof thing === 'object';

	/**
	 * Determine if a value is a Boolean
	 *
	 * @param {*} thing The value to test
	 * @returns {boolean} True if value is a Boolean, otherwise false
	 */
	const isBoolean = thing => thing === true || thing === false;

	/**
	 * Determine if a value is a plain Object
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a plain Object, otherwise false
	 */
	const isPlainObject = (val) => {
	  if (kindOf(val) !== 'object') {
	    return false;
	  }

	  const prototype = getPrototypeOf(val);
	  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
	};

	/**
	 * Determine if a value is a Date
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	const isDate = kindOfTest('Date');

	/**
	 * Determine if a value is a File
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	const isFile = kindOfTest('File');

	/**
	 * Determine if a value is a Blob
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	const isBlob = kindOfTest('Blob');

	/**
	 * Determine if a value is a FileList
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	const isFileList = kindOfTest('FileList');

	/**
	 * Determine if a value is a Stream
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	const isStream = (val) => isObject(val) && isFunction(val.pipe);

	/**
	 * Determine if a value is a FormData
	 *
	 * @param {*} thing The value to test
	 *
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	const isFormData = (thing) => {
	  let kind;
	  return thing && (
	    (typeof FormData === 'function' && thing instanceof FormData) || (
	      isFunction(thing.append) && (
	        (kind = kindOf(thing)) === 'formdata' ||
	        // detect form-data instance
	        (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
	      )
	    )
	  )
	};

	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	const isURLSearchParams = kindOfTest('URLSearchParams');

	const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 *
	 * @returns {String} The String freed of excess whitespace
	 */
	const trim = (str) => str.trim ?
	  str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 *
	 * @param {Boolean} [allOwnKeys = false]
	 * @returns {any}
	 */
	function forEach(obj, fn, {allOwnKeys = false} = {}) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }

	  let i;
	  let l;

	  // Force an array if not already something iterable
	  if (typeof obj !== 'object') {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }

	  if (isArray(obj)) {
	    // Iterate over array values
	    for (i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
	    const len = keys.length;
	    let key;

	    for (i = 0; i < len; i++) {
	      key = keys[i];
	      fn.call(null, obj[key], key, obj);
	    }
	  }
	}

	function findKey(obj, key) {
	  key = key.toLowerCase();
	  const keys = Object.keys(obj);
	  let i = keys.length;
	  let _key;
	  while (i-- > 0) {
	    _key = keys[i];
	    if (key === _key.toLowerCase()) {
	      return _key;
	    }
	  }
	  return null;
	}

	const _global = (() => {
	  /*eslint no-undef:0*/
	  if (typeof globalThis !== "undefined") return globalThis;
	  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
	})();

	const isContextDefined = (context) => !isUndefined(context) && context !== _global;

	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 *
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  const {caseless} = isContextDefined(this) && this || {};
	  const result = {};
	  const assignValue = (val, key) => {
	    const targetKey = caseless && findKey(result, key) || key;
	    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
	      result[targetKey] = merge(result[targetKey], val);
	    } else if (isPlainObject(val)) {
	      result[targetKey] = merge({}, val);
	    } else if (isArray(val)) {
	      result[targetKey] = val.slice();
	    } else {
	      result[targetKey] = val;
	    }
	  };

	  for (let i = 0, l = arguments.length; i < l; i++) {
	    arguments[i] && forEach(arguments[i], assignValue);
	  }
	  return result;
	}

	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 *
	 * @param {Boolean} [allOwnKeys]
	 * @returns {Object} The resulting value of object a
	 */
	const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
	  forEach(b, (val, key) => {
	    if (thisArg && isFunction(val)) {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  }, {allOwnKeys});
	  return a;
	};

	/**
	 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
	 *
	 * @param {string} content with BOM
	 *
	 * @returns {string} content value without BOM
	 */
	const stripBOM = (content) => {
	  if (content.charCodeAt(0) === 0xFEFF) {
	    content = content.slice(1);
	  }
	  return content;
	};

	/**
	 * Inherit the prototype methods from one constructor into another
	 * @param {function} constructor
	 * @param {function} superConstructor
	 * @param {object} [props]
	 * @param {object} [descriptors]
	 *
	 * @returns {void}
	 */
	const inherits = (constructor, superConstructor, props, descriptors) => {
	  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
	  constructor.prototype.constructor = constructor;
	  Object.defineProperty(constructor, 'super', {
	    value: superConstructor.prototype
	  });
	  props && Object.assign(constructor.prototype, props);
	};

	/**
	 * Resolve object with deep prototype chain to a flat object
	 * @param {Object} sourceObj source object
	 * @param {Object} [destObj]
	 * @param {Function|Boolean} [filter]
	 * @param {Function} [propFilter]
	 *
	 * @returns {Object}
	 */
	const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
	  let props;
	  let i;
	  let prop;
	  const merged = {};

	  destObj = destObj || {};
	  // eslint-disable-next-line no-eq-null,eqeqeq
	  if (sourceObj == null) return destObj;

	  do {
	    props = Object.getOwnPropertyNames(sourceObj);
	    i = props.length;
	    while (i-- > 0) {
	      prop = props[i];
	      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
	        destObj[prop] = sourceObj[prop];
	        merged[prop] = true;
	      }
	    }
	    sourceObj = filter !== false && getPrototypeOf(sourceObj);
	  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

	  return destObj;
	};

	/**
	 * Determines whether a string ends with the characters of a specified string
	 *
	 * @param {String} str
	 * @param {String} searchString
	 * @param {Number} [position= 0]
	 *
	 * @returns {boolean}
	 */
	const endsWith = (str, searchString, position) => {
	  str = String(str);
	  if (position === undefined || position > str.length) {
	    position = str.length;
	  }
	  position -= searchString.length;
	  const lastIndex = str.indexOf(searchString, position);
	  return lastIndex !== -1 && lastIndex === position;
	};


	/**
	 * Returns new array from array like object or null if failed
	 *
	 * @param {*} [thing]
	 *
	 * @returns {?Array}
	 */
	const toArray = (thing) => {
	  if (!thing) return null;
	  if (isArray(thing)) return thing;
	  let i = thing.length;
	  if (!isNumber(i)) return null;
	  const arr = new Array(i);
	  while (i-- > 0) {
	    arr[i] = thing[i];
	  }
	  return arr;
	};

	/**
	 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
	 * thing passed in is an instance of Uint8Array
	 *
	 * @param {TypedArray}
	 *
	 * @returns {Array}
	 */
	// eslint-disable-next-line func-names
	const isTypedArray = (TypedArray => {
	  // eslint-disable-next-line func-names
	  return thing => {
	    return TypedArray && thing instanceof TypedArray;
	  };
	})(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

	/**
	 * For each entry in the object, call the function with the key and value.
	 *
	 * @param {Object<any, any>} obj - The object to iterate over.
	 * @param {Function} fn - The function to call for each entry.
	 *
	 * @returns {void}
	 */
	const forEachEntry = (obj, fn) => {
	  const generator = obj && obj[Symbol.iterator];

	  const iterator = generator.call(obj);

	  let result;

	  while ((result = iterator.next()) && !result.done) {
	    const pair = result.value;
	    fn.call(obj, pair[0], pair[1]);
	  }
	};

	/**
	 * It takes a regular expression and a string, and returns an array of all the matches
	 *
	 * @param {string} regExp - The regular expression to match against.
	 * @param {string} str - The string to search.
	 *
	 * @returns {Array<boolean>}
	 */
	const matchAll = (regExp, str) => {
	  let matches;
	  const arr = [];

	  while ((matches = regExp.exec(str)) !== null) {
	    arr.push(matches);
	  }

	  return arr;
	};

	/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
	const isHTMLForm = kindOfTest('HTMLFormElement');

	const toCamelCase = str => {
	  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
	    function replacer(m, p1, p2) {
	      return p1.toUpperCase() + p2;
	    }
	  );
	};

	/* Creating a function that will check if an object has a property. */
	const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

	/**
	 * Determine if a value is a RegExp object
	 *
	 * @param {*} val The value to test
	 *
	 * @returns {boolean} True if value is a RegExp object, otherwise false
	 */
	const isRegExp = kindOfTest('RegExp');

	const reduceDescriptors = (obj, reducer) => {
	  const descriptors = Object.getOwnPropertyDescriptors(obj);
	  const reducedDescriptors = {};

	  forEach(descriptors, (descriptor, name) => {
	    let ret;
	    if ((ret = reducer(descriptor, name, obj)) !== false) {
	      reducedDescriptors[name] = ret || descriptor;
	    }
	  });

	  Object.defineProperties(obj, reducedDescriptors);
	};

	/**
	 * Makes all methods read-only
	 * @param {Object} obj
	 */

	const freezeMethods = (obj) => {
	  reduceDescriptors(obj, (descriptor, name) => {
	    // skip restricted props in strict mode
	    if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
	      return false;
	    }

	    const value = obj[name];

	    if (!isFunction(value)) return;

	    descriptor.enumerable = false;

	    if ('writable' in descriptor) {
	      descriptor.writable = false;
	      return;
	    }

	    if (!descriptor.set) {
	      descriptor.set = () => {
	        throw Error('Can not rewrite read-only method \'' + name + '\'');
	      };
	    }
	  });
	};

	const toObjectSet = (arrayOrString, delimiter) => {
	  const obj = {};

	  const define = (arr) => {
	    arr.forEach(value => {
	      obj[value] = true;
	    });
	  };

	  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

	  return obj;
	};

	const noop = () => {};

	const toFiniteNumber = (value, defaultValue) => {
	  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
	};

	const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

	const DIGIT = '0123456789';

	const ALPHABET = {
	  DIGIT,
	  ALPHA,
	  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
	};

	const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
	  let str = '';
	  const {length} = alphabet;
	  while (size--) {
	    str += alphabet[Math.random() * length|0];
	  }

	  return str;
	};

	/**
	 * If the thing is a FormData object, return true, otherwise return false.
	 *
	 * @param {unknown} thing - The thing to check.
	 *
	 * @returns {boolean}
	 */
	function isSpecCompliantForm(thing) {
	  return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
	}

	const toJSONObject = (obj) => {
	  const stack = new Array(10);

	  const visit = (source, i) => {

	    if (isObject(source)) {
	      if (stack.indexOf(source) >= 0) {
	        return;
	      }

	      if(!('toJSON' in source)) {
	        stack[i] = source;
	        const target = isArray(source) ? [] : {};

	        forEach(source, (value, key) => {
	          const reducedValue = visit(value, i + 1);
	          !isUndefined(reducedValue) && (target[key] = reducedValue);
	        });

	        stack[i] = undefined;

	        return target;
	      }
	    }

	    return source;
	  };

	  return visit(obj, 0);
	};

	const isAsyncFn = kindOfTest('AsyncFunction');

	const isThenable = (thing) =>
	  thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

	// original code
	// https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

	const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
	  if (setImmediateSupported) {
	    return setImmediate;
	  }

	  return postMessageSupported ? ((token, callbacks) => {
	    _global.addEventListener("message", ({source, data}) => {
	      if (source === _global && data === token) {
	        callbacks.length && callbacks.shift()();
	      }
	    }, false);

	    return (cb) => {
	      callbacks.push(cb);
	      _global.postMessage(token, "*");
	    }
	  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
	})(
	  typeof setImmediate === 'function',
	  isFunction(_global.postMessage)
	);

	const asap = typeof queueMicrotask !== 'undefined' ?
	  queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

	// *********************

	var utils$1 = {
	  isArray,
	  isArrayBuffer,
	  isBuffer,
	  isFormData,
	  isArrayBufferView,
	  isString,
	  isNumber,
	  isBoolean,
	  isObject,
	  isPlainObject,
	  isReadableStream,
	  isRequest,
	  isResponse,
	  isHeaders,
	  isUndefined,
	  isDate,
	  isFile,
	  isBlob,
	  isRegExp,
	  isFunction,
	  isStream,
	  isURLSearchParams,
	  isTypedArray,
	  isFileList,
	  forEach,
	  merge,
	  extend,
	  trim,
	  stripBOM,
	  inherits,
	  toFlatObject,
	  kindOf,
	  kindOfTest,
	  endsWith,
	  toArray,
	  forEachEntry,
	  matchAll,
	  isHTMLForm,
	  hasOwnProperty,
	  hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
	  reduceDescriptors,
	  freezeMethods,
	  toObjectSet,
	  toCamelCase,
	  noop,
	  toFiniteNumber,
	  findKey,
	  global: _global,
	  isContextDefined,
	  ALPHABET,
	  generateString,
	  isSpecCompliantForm,
	  toJSONObject,
	  isAsyncFn,
	  isThenable,
	  setImmediate: _setImmediate,
	  asap
	};

	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [config] The config.
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 *
	 * @returns {Error} The created error.
	 */
	function AxiosError(message, code, config, request, response) {
	  Error.call(this);

	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, this.constructor);
	  } else {
	    this.stack = (new Error()).stack;
	  }

	  this.message = message;
	  this.name = 'AxiosError';
	  code && (this.code = code);
	  config && (this.config = config);
	  request && (this.request = request);
	  if (response) {
	    this.response = response;
	    this.status = response.status ? response.status : null;
	  }
	}

	utils$1.inherits(AxiosError, Error, {
	  toJSON: function toJSON() {
	    return {
	      // Standard
	      message: this.message,
	      name: this.name,
	      // Microsoft
	      description: this.description,
	      number: this.number,
	      // Mozilla
	      fileName: this.fileName,
	      lineNumber: this.lineNumber,
	      columnNumber: this.columnNumber,
	      stack: this.stack,
	      // Axios
	      config: utils$1.toJSONObject(this.config),
	      code: this.code,
	      status: this.status
	    };
	  }
	});

	const prototype$1 = AxiosError.prototype;
	const descriptors = {};

	[
	  'ERR_BAD_OPTION_VALUE',
	  'ERR_BAD_OPTION',
	  'ECONNABORTED',
	  'ETIMEDOUT',
	  'ERR_NETWORK',
	  'ERR_FR_TOO_MANY_REDIRECTS',
	  'ERR_DEPRECATED',
	  'ERR_BAD_RESPONSE',
	  'ERR_BAD_REQUEST',
	  'ERR_CANCELED',
	  'ERR_NOT_SUPPORT',
	  'ERR_INVALID_URL'
	// eslint-disable-next-line func-names
	].forEach(code => {
	  descriptors[code] = {value: code};
	});

	Object.defineProperties(AxiosError, descriptors);
	Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

	// eslint-disable-next-line func-names
	AxiosError.from = (error, code, config, request, response, customProps) => {
	  const axiosError = Object.create(prototype$1);

	  utils$1.toFlatObject(error, axiosError, function filter(obj) {
	    return obj !== Error.prototype;
	  }, prop => {
	    return prop !== 'isAxiosError';
	  });

	  AxiosError.call(axiosError, error.message, code, config, request, response);

	  axiosError.cause = error;

	  axiosError.name = error.name;

	  customProps && Object.assign(axiosError, customProps);

	  return axiosError;
	};

	// eslint-disable-next-line strict
	var httpAdapter = null;

	/**
	 * Determines if the given thing is a array or js object.
	 *
	 * @param {string} thing - The object or array to be visited.
	 *
	 * @returns {boolean}
	 */
	function isVisitable(thing) {
	  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
	}

	/**
	 * It removes the brackets from the end of a string
	 *
	 * @param {string} key - The key of the parameter.
	 *
	 * @returns {string} the key without the brackets.
	 */
	function removeBrackets(key) {
	  return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
	}

	/**
	 * It takes a path, a key, and a boolean, and returns a string
	 *
	 * @param {string} path - The path to the current key.
	 * @param {string} key - The key of the current object being iterated over.
	 * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
	 *
	 * @returns {string} The path to the current key.
	 */
	function renderKey(path, key, dots) {
	  if (!path) return key;
	  return path.concat(key).map(function each(token, i) {
	    // eslint-disable-next-line no-param-reassign
	    token = removeBrackets(token);
	    return !dots && i ? '[' + token + ']' : token;
	  }).join(dots ? '.' : '');
	}

	/**
	 * If the array is an array and none of its elements are visitable, then it's a flat array.
	 *
	 * @param {Array<any>} arr - The array to check
	 *
	 * @returns {boolean}
	 */
	function isFlatArray(arr) {
	  return utils$1.isArray(arr) && !arr.some(isVisitable);
	}

	const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
	  return /^is[A-Z]/.test(prop);
	});

	/**
	 * Convert a data object to FormData
	 *
	 * @param {Object} obj
	 * @param {?Object} [formData]
	 * @param {?Object} [options]
	 * @param {Function} [options.visitor]
	 * @param {Boolean} [options.metaTokens = true]
	 * @param {Boolean} [options.dots = false]
	 * @param {?Boolean} [options.indexes = false]
	 *
	 * @returns {Object}
	 **/

	/**
	 * It converts an object into a FormData object
	 *
	 * @param {Object<any, any>} obj - The object to convert to form data.
	 * @param {string} formData - The FormData object to append to.
	 * @param {Object<string, any>} options
	 *
	 * @returns
	 */
	function toFormData(obj, formData, options) {
	  if (!utils$1.isObject(obj)) {
	    throw new TypeError('target must be an object');
	  }

	  // eslint-disable-next-line no-param-reassign
	  formData = formData || new (FormData)();

	  // eslint-disable-next-line no-param-reassign
	  options = utils$1.toFlatObject(options, {
	    metaTokens: true,
	    dots: false,
	    indexes: false
	  }, false, function defined(option, source) {
	    // eslint-disable-next-line no-eq-null,eqeqeq
	    return !utils$1.isUndefined(source[option]);
	  });

	  const metaTokens = options.metaTokens;
	  // eslint-disable-next-line no-use-before-define
	  const visitor = options.visitor || defaultVisitor;
	  const dots = options.dots;
	  const indexes = options.indexes;
	  const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
	  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

	  if (!utils$1.isFunction(visitor)) {
	    throw new TypeError('visitor must be a function');
	  }

	  function convertValue(value) {
	    if (value === null) return '';

	    if (utils$1.isDate(value)) {
	      return value.toISOString();
	    }

	    if (!useBlob && utils$1.isBlob(value)) {
	      throw new AxiosError('Blob is not supported. Use a Buffer instead.');
	    }

	    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
	      return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
	    }

	    return value;
	  }

	  /**
	   * Default visitor.
	   *
	   * @param {*} value
	   * @param {String|Number} key
	   * @param {Array<String|Number>} path
	   * @this {FormData}
	   *
	   * @returns {boolean} return true to visit the each prop of the value recursively
	   */
	  function defaultVisitor(value, key, path) {
	    let arr = value;

	    if (value && !path && typeof value === 'object') {
	      if (utils$1.endsWith(key, '{}')) {
	        // eslint-disable-next-line no-param-reassign
	        key = metaTokens ? key : key.slice(0, -2);
	        // eslint-disable-next-line no-param-reassign
	        value = JSON.stringify(value);
	      } else if (
	        (utils$1.isArray(value) && isFlatArray(value)) ||
	        ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
	        )) {
	        // eslint-disable-next-line no-param-reassign
	        key = removeBrackets(key);

	        arr.forEach(function each(el, index) {
	          !(utils$1.isUndefined(el) || el === null) && formData.append(
	            // eslint-disable-next-line no-nested-ternary
	            indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
	            convertValue(el)
	          );
	        });
	        return false;
	      }
	    }

	    if (isVisitable(value)) {
	      return true;
	    }

	    formData.append(renderKey(path, key, dots), convertValue(value));

	    return false;
	  }

	  const stack = [];

	  const exposedHelpers = Object.assign(predicates, {
	    defaultVisitor,
	    convertValue,
	    isVisitable
	  });

	  function build(value, path) {
	    if (utils$1.isUndefined(value)) return;

	    if (stack.indexOf(value) !== -1) {
	      throw Error('Circular reference detected in ' + path.join('.'));
	    }

	    stack.push(value);

	    utils$1.forEach(value, function each(el, key) {
	      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
	        formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
	      );

	      if (result === true) {
	        build(el, path ? path.concat(key) : [key]);
	      }
	    });

	    stack.pop();
	  }

	  if (!utils$1.isObject(obj)) {
	    throw new TypeError('data must be an object');
	  }

	  build(obj);

	  return formData;
	}

	/**
	 * It encodes a string by replacing all characters that are not in the unreserved set with
	 * their percent-encoded equivalents
	 *
	 * @param {string} str - The string to encode.
	 *
	 * @returns {string} The encoded string.
	 */
	function encode$1(str) {
	  const charMap = {
	    '!': '%21',
	    "'": '%27',
	    '(': '%28',
	    ')': '%29',
	    '~': '%7E',
	    '%20': '+',
	    '%00': '\x00'
	  };
	  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
	    return charMap[match];
	  });
	}

	/**
	 * It takes a params object and converts it to a FormData object
	 *
	 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
	 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
	 *
	 * @returns {void}
	 */
	function AxiosURLSearchParams(params, options) {
	  this._pairs = [];

	  params && toFormData(params, this, options);
	}

	const prototype = AxiosURLSearchParams.prototype;

	prototype.append = function append(name, value) {
	  this._pairs.push([name, value]);
	};

	prototype.toString = function toString(encoder) {
	  const _encode = encoder ? function(value) {
	    return encoder.call(this, value, encode$1);
	  } : encode$1;

	  return this._pairs.map(function each(pair) {
	    return _encode(pair[0]) + '=' + _encode(pair[1]);
	  }, '').join('&');
	};

	/**
	 * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
	 * URI encoded counterparts
	 *
	 * @param {string} val The value to be encoded.
	 *
	 * @returns {string} The encoded value.
	 */
	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}

	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @param {?object} options
	 *
	 * @returns {string} The formatted url
	 */
	function buildURL(url, params, options) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }
	  
	  const _encode = options && options.encode || encode;

	  const serializeFn = options && options.serialize;

	  let serializedParams;

	  if (serializeFn) {
	    serializedParams = serializeFn(params, options);
	  } else {
	    serializedParams = utils$1.isURLSearchParams(params) ?
	      params.toString() :
	      new AxiosURLSearchParams(params, options).toString(_encode);
	  }

	  if (serializedParams) {
	    const hashmarkIndex = url.indexOf("#");

	    if (hashmarkIndex !== -1) {
	      url = url.slice(0, hashmarkIndex);
	    }
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }

	  return url;
	}

	class InterceptorManager {
	  constructor() {
	    this.handlers = [];
	  }

	  /**
	   * Add a new interceptor to the stack
	   *
	   * @param {Function} fulfilled The function to handle `then` for a `Promise`
	   * @param {Function} rejected The function to handle `reject` for a `Promise`
	   *
	   * @return {Number} An ID used to remove interceptor later
	   */
	  use(fulfilled, rejected, options) {
	    this.handlers.push({
	      fulfilled,
	      rejected,
	      synchronous: options ? options.synchronous : false,
	      runWhen: options ? options.runWhen : null
	    });
	    return this.handlers.length - 1;
	  }

	  /**
	   * Remove an interceptor from the stack
	   *
	   * @param {Number} id The ID that was returned by `use`
	   *
	   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
	   */
	  eject(id) {
	    if (this.handlers[id]) {
	      this.handlers[id] = null;
	    }
	  }

	  /**
	   * Clear all interceptors from the stack
	   *
	   * @returns {void}
	   */
	  clear() {
	    if (this.handlers) {
	      this.handlers = [];
	    }
	  }

	  /**
	   * Iterate over all the registered interceptors
	   *
	   * This method is particularly useful for skipping over any
	   * interceptors that may have become `null` calling `eject`.
	   *
	   * @param {Function} fn The function to call for each interceptor
	   *
	   * @returns {void}
	   */
	  forEach(fn) {
	    utils$1.forEach(this.handlers, function forEachHandler(h) {
	      if (h !== null) {
	        fn(h);
	      }
	    });
	  }
	}

	var InterceptorManager$1 = InterceptorManager;

	var transitionalDefaults = {
	  silentJSONParsing: true,
	  forcedJSONParsing: true,
	  clarifyTimeoutError: false
	};

	var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

	var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

	var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

	var platform$1 = {
	  isBrowser: true,
	  classes: {
	    URLSearchParams: URLSearchParams$1,
	    FormData: FormData$1,
	    Blob: Blob$1
	  },
	  protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
	};

	const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

	const _navigator = typeof navigator === 'object' && navigator || undefined;

	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 * nativescript
	 *  navigator.product -> 'NativeScript' or 'NS'
	 *
	 * @returns {boolean}
	 */
	const hasStandardBrowserEnv = hasBrowserEnv &&
	  (!_navigator || ['ReactNative', 'NativeScript', 'NS'].indexOf(_navigator.product) < 0);

	/**
	 * Determine if we're running in a standard browser webWorker environment
	 *
	 * Although the `isStandardBrowserEnv` method indicates that
	 * `allows axios to run in a web worker`, the WebWorker will still be
	 * filtered out due to its judgment standard
	 * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
	 * This leads to a problem when axios post `FormData` in webWorker
	 */
	const hasStandardBrowserWebWorkerEnv = (() => {
	  return (
	    typeof WorkerGlobalScope !== 'undefined' &&
	    // eslint-disable-next-line no-undef
	    self instanceof WorkerGlobalScope &&
	    typeof self.importScripts === 'function'
	  );
	})();

	const origin = hasBrowserEnv && window.location.href || 'http://localhost';

	var utils = /*#__PURE__*/Object.freeze({
		__proto__: null,
		hasBrowserEnv: hasBrowserEnv,
		hasStandardBrowserEnv: hasStandardBrowserEnv,
		hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
		navigator: _navigator,
		origin: origin
	});

	var platform = {
	  ...utils,
	  ...platform$1
	};

	function toURLEncodedForm(data, options) {
	  return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
	    visitor: function(value, key, path, helpers) {
	      if (platform.isNode && utils$1.isBuffer(value)) {
	        this.append(key, value.toString('base64'));
	        return false;
	      }

	      return helpers.defaultVisitor.apply(this, arguments);
	    }
	  }, options));
	}

	/**
	 * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
	 *
	 * @param {string} name - The name of the property to get.
	 *
	 * @returns An array of strings.
	 */
	function parsePropPath(name) {
	  // foo[x][y][z]
	  // foo.x.y.z
	  // foo-x-y-z
	  // foo x y z
	  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
	    return match[0] === '[]' ? '' : match[1] || match[0];
	  });
	}

	/**
	 * Convert an array to an object.
	 *
	 * @param {Array<any>} arr - The array to convert to an object.
	 *
	 * @returns An object with the same keys and values as the array.
	 */
	function arrayToObject(arr) {
	  const obj = {};
	  const keys = Object.keys(arr);
	  let i;
	  const len = keys.length;
	  let key;
	  for (i = 0; i < len; i++) {
	    key = keys[i];
	    obj[key] = arr[key];
	  }
	  return obj;
	}

	/**
	 * It takes a FormData object and returns a JavaScript object
	 *
	 * @param {string} formData The FormData object to convert to JSON.
	 *
	 * @returns {Object<string, any> | null} The converted object.
	 */
	function formDataToJSON(formData) {
	  function buildPath(path, value, target, index) {
	    let name = path[index++];

	    if (name === '__proto__') return true;

	    const isNumericKey = Number.isFinite(+name);
	    const isLast = index >= path.length;
	    name = !name && utils$1.isArray(target) ? target.length : name;

	    if (isLast) {
	      if (utils$1.hasOwnProp(target, name)) {
	        target[name] = [target[name], value];
	      } else {
	        target[name] = value;
	      }

	      return !isNumericKey;
	    }

	    if (!target[name] || !utils$1.isObject(target[name])) {
	      target[name] = [];
	    }

	    const result = buildPath(path, value, target[name], index);

	    if (result && utils$1.isArray(target[name])) {
	      target[name] = arrayToObject(target[name]);
	    }

	    return !isNumericKey;
	  }

	  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
	    const obj = {};

	    utils$1.forEachEntry(formData, (name, value) => {
	      buildPath(parsePropPath(name), value, obj, 0);
	    });

	    return obj;
	  }

	  return null;
	}

	/**
	 * It takes a string, tries to parse it, and if it fails, it returns the stringified version
	 * of the input
	 *
	 * @param {any} rawValue - The value to be stringified.
	 * @param {Function} parser - A function that parses a string into a JavaScript object.
	 * @param {Function} encoder - A function that takes a value and returns a string.
	 *
	 * @returns {string} A stringified version of the rawValue.
	 */
	function stringifySafely(rawValue, parser, encoder) {
	  if (utils$1.isString(rawValue)) {
	    try {
	      (parser || JSON.parse)(rawValue);
	      return utils$1.trim(rawValue);
	    } catch (e) {
	      if (e.name !== 'SyntaxError') {
	        throw e;
	      }
	    }
	  }

	  return (encoder || JSON.stringify)(rawValue);
	}

	const defaults = {

	  transitional: transitionalDefaults,

	  adapter: ['xhr', 'http', 'fetch'],

	  transformRequest: [function transformRequest(data, headers) {
	    const contentType = headers.getContentType() || '';
	    const hasJSONContentType = contentType.indexOf('application/json') > -1;
	    const isObjectPayload = utils$1.isObject(data);

	    if (isObjectPayload && utils$1.isHTMLForm(data)) {
	      data = new FormData(data);
	    }

	    const isFormData = utils$1.isFormData(data);

	    if (isFormData) {
	      return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
	    }

	    if (utils$1.isArrayBuffer(data) ||
	      utils$1.isBuffer(data) ||
	      utils$1.isStream(data) ||
	      utils$1.isFile(data) ||
	      utils$1.isBlob(data) ||
	      utils$1.isReadableStream(data)
	    ) {
	      return data;
	    }
	    if (utils$1.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils$1.isURLSearchParams(data)) {
	      headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
	      return data.toString();
	    }

	    let isFileList;

	    if (isObjectPayload) {
	      if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
	        return toURLEncodedForm(data, this.formSerializer).toString();
	      }

	      if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
	        const _FormData = this.env && this.env.FormData;

	        return toFormData(
	          isFileList ? {'files[]': data} : data,
	          _FormData && new _FormData(),
	          this.formSerializer
	        );
	      }
	    }

	    if (isObjectPayload || hasJSONContentType ) {
	      headers.setContentType('application/json', false);
	      return stringifySafely(data);
	    }

	    return data;
	  }],

	  transformResponse: [function transformResponse(data) {
	    const transitional = this.transitional || defaults.transitional;
	    const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
	    const JSONRequested = this.responseType === 'json';

	    if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
	      return data;
	    }

	    if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
	      const silentJSONParsing = transitional && transitional.silentJSONParsing;
	      const strictJSONParsing = !silentJSONParsing && JSONRequested;

	      try {
	        return JSON.parse(data);
	      } catch (e) {
	        if (strictJSONParsing) {
	          if (e.name === 'SyntaxError') {
	            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
	          }
	          throw e;
	        }
	      }
	    }

	    return data;
	  }],

	  /**
	   * A timeout in milliseconds to abort a request. If set to 0 (default) a
	   * timeout is not created.
	   */
	  timeout: 0,

	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',

	  maxContentLength: -1,
	  maxBodyLength: -1,

	  env: {
	    FormData: platform.classes.FormData,
	    Blob: platform.classes.Blob
	  },

	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  },

	  headers: {
	    common: {
	      'Accept': 'application/json, text/plain, */*',
	      'Content-Type': undefined
	    }
	  }
	};

	utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
	  defaults.headers[method] = {};
	});

	var defaults$1 = defaults;

	// RawAxiosHeaders whose duplicates are ignored by node
	// c.f. https://nodejs.org/api/http.html#http_message_headers
	const ignoreDuplicateOf = utils$1.toObjectSet([
	  'age', 'authorization', 'content-length', 'content-type', 'etag',
	  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
	  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
	  'referer', 'retry-after', 'user-agent'
	]);

	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} rawHeaders Headers needing to be parsed
	 *
	 * @returns {Object} Headers parsed into an object
	 */
	var parseHeaders = rawHeaders => {
	  const parsed = {};
	  let key;
	  let val;
	  let i;

	  rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
	    i = line.indexOf(':');
	    key = line.substring(0, i).trim().toLowerCase();
	    val = line.substring(i + 1).trim();

	    if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
	      return;
	    }

	    if (key === 'set-cookie') {
	      if (parsed[key]) {
	        parsed[key].push(val);
	      } else {
	        parsed[key] = [val];
	      }
	    } else {
	      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	    }
	  });

	  return parsed;
	};

	const $internals = Symbol('internals');

	function normalizeHeader(header) {
	  return header && String(header).trim().toLowerCase();
	}

	function normalizeValue(value) {
	  if (value === false || value == null) {
	    return value;
	  }

	  return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
	}

	function parseTokens(str) {
	  const tokens = Object.create(null);
	  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
	  let match;

	  while ((match = tokensRE.exec(str))) {
	    tokens[match[1]] = match[2];
	  }

	  return tokens;
	}

	const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

	function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
	  if (utils$1.isFunction(filter)) {
	    return filter.call(this, value, header);
	  }

	  if (isHeaderNameFilter) {
	    value = header;
	  }

	  if (!utils$1.isString(value)) return;

	  if (utils$1.isString(filter)) {
	    return value.indexOf(filter) !== -1;
	  }

	  if (utils$1.isRegExp(filter)) {
	    return filter.test(value);
	  }
	}

	function formatHeader(header) {
	  return header.trim()
	    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
	      return char.toUpperCase() + str;
	    });
	}

	function buildAccessors(obj, header) {
	  const accessorName = utils$1.toCamelCase(' ' + header);

	  ['get', 'set', 'has'].forEach(methodName => {
	    Object.defineProperty(obj, methodName + accessorName, {
	      value: function(arg1, arg2, arg3) {
	        return this[methodName].call(this, header, arg1, arg2, arg3);
	      },
	      configurable: true
	    });
	  });
	}

	class AxiosHeaders {
	  constructor(headers) {
	    headers && this.set(headers);
	  }

	  set(header, valueOrRewrite, rewrite) {
	    const self = this;

	    function setHeader(_value, _header, _rewrite) {
	      const lHeader = normalizeHeader(_header);

	      if (!lHeader) {
	        throw new Error('header name must be a non-empty string');
	      }

	      const key = utils$1.findKey(self, lHeader);

	      if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
	        self[key || _header] = normalizeValue(_value);
	      }
	    }

	    const setHeaders = (headers, _rewrite) =>
	      utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

	    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
	      setHeaders(header, valueOrRewrite);
	    } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
	      setHeaders(parseHeaders(header), valueOrRewrite);
	    } else if (utils$1.isHeaders(header)) {
	      for (const [key, value] of header.entries()) {
	        setHeader(value, key, rewrite);
	      }
	    } else {
	      header != null && setHeader(valueOrRewrite, header, rewrite);
	    }

	    return this;
	  }

	  get(header, parser) {
	    header = normalizeHeader(header);

	    if (header) {
	      const key = utils$1.findKey(this, header);

	      if (key) {
	        const value = this[key];

	        if (!parser) {
	          return value;
	        }

	        if (parser === true) {
	          return parseTokens(value);
	        }

	        if (utils$1.isFunction(parser)) {
	          return parser.call(this, value, key);
	        }

	        if (utils$1.isRegExp(parser)) {
	          return parser.exec(value);
	        }

	        throw new TypeError('parser must be boolean|regexp|function');
	      }
	    }
	  }

	  has(header, matcher) {
	    header = normalizeHeader(header);

	    if (header) {
	      const key = utils$1.findKey(this, header);

	      return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
	    }

	    return false;
	  }

	  delete(header, matcher) {
	    const self = this;
	    let deleted = false;

	    function deleteHeader(_header) {
	      _header = normalizeHeader(_header);

	      if (_header) {
	        const key = utils$1.findKey(self, _header);

	        if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
	          delete self[key];

	          deleted = true;
	        }
	      }
	    }

	    if (utils$1.isArray(header)) {
	      header.forEach(deleteHeader);
	    } else {
	      deleteHeader(header);
	    }

	    return deleted;
	  }

	  clear(matcher) {
	    const keys = Object.keys(this);
	    let i = keys.length;
	    let deleted = false;

	    while (i--) {
	      const key = keys[i];
	      if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
	        delete this[key];
	        deleted = true;
	      }
	    }

	    return deleted;
	  }

	  normalize(format) {
	    const self = this;
	    const headers = {};

	    utils$1.forEach(this, (value, header) => {
	      const key = utils$1.findKey(headers, header);

	      if (key) {
	        self[key] = normalizeValue(value);
	        delete self[header];
	        return;
	      }

	      const normalized = format ? formatHeader(header) : String(header).trim();

	      if (normalized !== header) {
	        delete self[header];
	      }

	      self[normalized] = normalizeValue(value);

	      headers[normalized] = true;
	    });

	    return this;
	  }

	  concat(...targets) {
	    return this.constructor.concat(this, ...targets);
	  }

	  toJSON(asStrings) {
	    const obj = Object.create(null);

	    utils$1.forEach(this, (value, header) => {
	      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
	    });

	    return obj;
	  }

	  [Symbol.iterator]() {
	    return Object.entries(this.toJSON())[Symbol.iterator]();
	  }

	  toString() {
	    return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
	  }

	  get [Symbol.toStringTag]() {
	    return 'AxiosHeaders';
	  }

	  static from(thing) {
	    return thing instanceof this ? thing : new this(thing);
	  }

	  static concat(first, ...targets) {
	    const computed = new this(first);

	    targets.forEach((target) => computed.set(target));

	    return computed;
	  }

	  static accessor(header) {
	    const internals = this[$internals] = (this[$internals] = {
	      accessors: {}
	    });

	    const accessors = internals.accessors;
	    const prototype = this.prototype;

	    function defineAccessor(_header) {
	      const lHeader = normalizeHeader(_header);

	      if (!accessors[lHeader]) {
	        buildAccessors(prototype, _header);
	        accessors[lHeader] = true;
	      }
	    }

	    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

	    return this;
	  }
	}

	AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

	// reserved names hotfix
	utils$1.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
	  let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
	  return {
	    get: () => value,
	    set(headerValue) {
	      this[mapped] = headerValue;
	    }
	  }
	});

	utils$1.freezeMethods(AxiosHeaders);

	var AxiosHeaders$1 = AxiosHeaders;

	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Array|Function} fns A single function or Array of functions
	 * @param {?Object} response The response object
	 *
	 * @returns {*} The resulting transformed data
	 */
	function transformData(fns, response) {
	  const config = this || defaults$1;
	  const context = response || config;
	  const headers = AxiosHeaders$1.from(context.headers);
	  let data = context.data;

	  utils$1.forEach(fns, function transform(fn) {
	    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
	  });

	  headers.normalize();

	  return data;
	}

	function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	}

	/**
	 * A `CanceledError` is an object that is thrown when an operation is canceled.
	 *
	 * @param {string=} message The message.
	 * @param {Object=} config The config.
	 * @param {Object=} request The request.
	 *
	 * @returns {CanceledError} The created error.
	 */
	function CanceledError(message, config, request) {
	  // eslint-disable-next-line no-eq-null,eqeqeq
	  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
	  this.name = 'CanceledError';
	}

	utils$1.inherits(CanceledError, AxiosError, {
	  __CANCEL__: true
	});

	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 *
	 * @returns {object} The response.
	 */
	function settle(resolve, reject, response) {
	  const validateStatus = response.config.validateStatus;
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(new AxiosError(
	      'Request failed with status code ' + response.status,
	      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
	      response.config,
	      response.request,
	      response
	    ));
	  }
	}

	function parseProtocol(url) {
	  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
	  return match && match[1] || '';
	}

	/**
	 * Calculate data maxRate
	 * @param {Number} [samplesCount= 10]
	 * @param {Number} [min= 1000]
	 * @returns {Function}
	 */
	function speedometer(samplesCount, min) {
	  samplesCount = samplesCount || 10;
	  const bytes = new Array(samplesCount);
	  const timestamps = new Array(samplesCount);
	  let head = 0;
	  let tail = 0;
	  let firstSampleTS;

	  min = min !== undefined ? min : 1000;

	  return function push(chunkLength) {
	    const now = Date.now();

	    const startedAt = timestamps[tail];

	    if (!firstSampleTS) {
	      firstSampleTS = now;
	    }

	    bytes[head] = chunkLength;
	    timestamps[head] = now;

	    let i = tail;
	    let bytesCount = 0;

	    while (i !== head) {
	      bytesCount += bytes[i++];
	      i = i % samplesCount;
	    }

	    head = (head + 1) % samplesCount;

	    if (head === tail) {
	      tail = (tail + 1) % samplesCount;
	    }

	    if (now - firstSampleTS < min) {
	      return;
	    }

	    const passed = startedAt && now - startedAt;

	    return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
	  };
	}

	/**
	 * Throttle decorator
	 * @param {Function} fn
	 * @param {Number} freq
	 * @return {Function}
	 */
	function throttle(fn, freq) {
	  let timestamp = 0;
	  let threshold = 1000 / freq;
	  let lastArgs;
	  let timer;

	  const invoke = (args, now = Date.now()) => {
	    timestamp = now;
	    lastArgs = null;
	    if (timer) {
	      clearTimeout(timer);
	      timer = null;
	    }
	    fn.apply(null, args);
	  };

	  const throttled = (...args) => {
	    const now = Date.now();
	    const passed = now - timestamp;
	    if ( passed >= threshold) {
	      invoke(args, now);
	    } else {
	      lastArgs = args;
	      if (!timer) {
	        timer = setTimeout(() => {
	          timer = null;
	          invoke(lastArgs);
	        }, threshold - passed);
	      }
	    }
	  };

	  const flush = () => lastArgs && invoke(lastArgs);

	  return [throttled, flush];
	}

	const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
	  let bytesNotified = 0;
	  const _speedometer = speedometer(50, 250);

	  return throttle(e => {
	    const loaded = e.loaded;
	    const total = e.lengthComputable ? e.total : undefined;
	    const progressBytes = loaded - bytesNotified;
	    const rate = _speedometer(progressBytes);
	    const inRange = loaded <= total;

	    bytesNotified = loaded;

	    const data = {
	      loaded,
	      total,
	      progress: total ? (loaded / total) : undefined,
	      bytes: progressBytes,
	      rate: rate ? rate : undefined,
	      estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
	      event: e,
	      lengthComputable: total != null,
	      [isDownloadStream ? 'download' : 'upload']: true
	    };

	    listener(data);
	  }, freq);
	};

	const progressEventDecorator = (total, throttled) => {
	  const lengthComputable = total != null;

	  return [(loaded) => throttled[0]({
	    lengthComputable,
	    total,
	    loaded
	  }), throttled[1]];
	};

	const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

	var isURLSameOrigin = platform.hasStandardBrowserEnv ?

	// Standard browser envs have full support of the APIs needed to test
	// whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    const msie = platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent);
	    const urlParsingNode = document.createElement('a');
	    let originURL;

	    /**
	    * Parse a URL to discover its components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      let href = url;

	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }

	      urlParsingNode.setAttribute('href', href);

	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	          urlParsingNode.pathname :
	          '/' + urlParsingNode.pathname
	      };
	    }

	    originURL = resolveURL(window.location.href);

	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      const parsed = (utils$1.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	          parsed.host === originURL.host);
	    };
	  })() :

	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })();

	var cookies = platform.hasStandardBrowserEnv ?

	  // Standard browser envs support document.cookie
	  {
	    write(name, value, expires, path, domain, secure) {
	      const cookie = [name + '=' + encodeURIComponent(value)];

	      utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

	      utils$1.isString(path) && cookie.push('path=' + path);

	      utils$1.isString(domain) && cookie.push('domain=' + domain);

	      secure === true && cookie.push('secure');

	      document.cookie = cookie.join('; ');
	    },

	    read(name) {
	      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	      return (match ? decodeURIComponent(match[3]) : null);
	    },

	    remove(name) {
	      this.write(name, '', Date.now() - 86400000);
	    }
	  }

	  :

	  // Non-standard browser env (web workers, react-native) lack needed support.
	  {
	    write() {},
	    read() {
	      return null;
	    },
	    remove() {}
	  };

	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 *
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
	}

	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 *
	 * @returns {string} The combined URL
	 */
	function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	}

	/**
	 * Creates a new URL by combining the baseURL with the requestedURL,
	 * only when the requestedURL is not already an absolute URL.
	 * If the requestURL is absolute, this function returns the requestedURL untouched.
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} requestedURL Absolute or relative URL to combine
	 *
	 * @returns {string} The combined full path
	 */
	function buildFullPath(baseURL, requestedURL) {
	  if (baseURL && !isAbsoluteURL(requestedURL)) {
	    return combineURLs(baseURL, requestedURL);
	  }
	  return requestedURL;
	}

	const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

	/**
	 * Config-specific merge-function which creates a new config-object
	 * by merging two configuration objects together.
	 *
	 * @param {Object} config1
	 * @param {Object} config2
	 *
	 * @returns {Object} New object resulting from merging config2 to config1
	 */
	function mergeConfig(config1, config2) {
	  // eslint-disable-next-line no-param-reassign
	  config2 = config2 || {};
	  const config = {};

	  function getMergedValue(target, source, caseless) {
	    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
	      return utils$1.merge.call({caseless}, target, source);
	    } else if (utils$1.isPlainObject(source)) {
	      return utils$1.merge({}, source);
	    } else if (utils$1.isArray(source)) {
	      return source.slice();
	    }
	    return source;
	  }

	  // eslint-disable-next-line consistent-return
	  function mergeDeepProperties(a, b, caseless) {
	    if (!utils$1.isUndefined(b)) {
	      return getMergedValue(a, b, caseless);
	    } else if (!utils$1.isUndefined(a)) {
	      return getMergedValue(undefined, a, caseless);
	    }
	  }

	  // eslint-disable-next-line consistent-return
	  function valueFromConfig2(a, b) {
	    if (!utils$1.isUndefined(b)) {
	      return getMergedValue(undefined, b);
	    }
	  }

	  // eslint-disable-next-line consistent-return
	  function defaultToConfig2(a, b) {
	    if (!utils$1.isUndefined(b)) {
	      return getMergedValue(undefined, b);
	    } else if (!utils$1.isUndefined(a)) {
	      return getMergedValue(undefined, a);
	    }
	  }

	  // eslint-disable-next-line consistent-return
	  function mergeDirectKeys(a, b, prop) {
	    if (prop in config2) {
	      return getMergedValue(a, b);
	    } else if (prop in config1) {
	      return getMergedValue(undefined, a);
	    }
	  }

	  const mergeMap = {
	    url: valueFromConfig2,
	    method: valueFromConfig2,
	    data: valueFromConfig2,
	    baseURL: defaultToConfig2,
	    transformRequest: defaultToConfig2,
	    transformResponse: defaultToConfig2,
	    paramsSerializer: defaultToConfig2,
	    timeout: defaultToConfig2,
	    timeoutMessage: defaultToConfig2,
	    withCredentials: defaultToConfig2,
	    withXSRFToken: defaultToConfig2,
	    adapter: defaultToConfig2,
	    responseType: defaultToConfig2,
	    xsrfCookieName: defaultToConfig2,
	    xsrfHeaderName: defaultToConfig2,
	    onUploadProgress: defaultToConfig2,
	    onDownloadProgress: defaultToConfig2,
	    decompress: defaultToConfig2,
	    maxContentLength: defaultToConfig2,
	    maxBodyLength: defaultToConfig2,
	    beforeRedirect: defaultToConfig2,
	    transport: defaultToConfig2,
	    httpAgent: defaultToConfig2,
	    httpsAgent: defaultToConfig2,
	    cancelToken: defaultToConfig2,
	    socketPath: defaultToConfig2,
	    responseEncoding: defaultToConfig2,
	    validateStatus: mergeDirectKeys,
	    headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
	  };

	  utils$1.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
	    const merge = mergeMap[prop] || mergeDeepProperties;
	    const configValue = merge(config1[prop], config2[prop], prop);
	    (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
	  });

	  return config;
	}

	var resolveConfig = (config) => {
	  const newConfig = mergeConfig({}, config);

	  let {data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth} = newConfig;

	  newConfig.headers = headers = AxiosHeaders$1.from(headers);

	  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url), config.params, config.paramsSerializer);

	  // HTTP basic authentication
	  if (auth) {
	    headers.set('Authorization', 'Basic ' +
	      btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
	    );
	  }

	  let contentType;

	  if (utils$1.isFormData(data)) {
	    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
	      headers.setContentType(undefined); // Let the browser set it
	    } else if ((contentType = headers.getContentType()) !== false) {
	      // fix semicolon duplication issue for ReactNative FormData implementation
	      const [type, ...tokens] = contentType ? contentType.split(';').map(token => token.trim()).filter(Boolean) : [];
	      headers.setContentType([type || 'multipart/form-data', ...tokens].join('; '));
	    }
	  }

	  // Add xsrf header
	  // This is only done if running in a standard browser environment.
	  // Specifically not if we're in a web worker, or react-native.

	  if (platform.hasStandardBrowserEnv) {
	    withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

	    if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
	      // Add xsrf header
	      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

	      if (xsrfValue) {
	        headers.set(xsrfHeaderName, xsrfValue);
	      }
	    }
	  }

	  return newConfig;
	};

	const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

	var xhrAdapter = isXHRAdapterSupported && function (config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    const _config = resolveConfig(config);
	    let requestData = _config.data;
	    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
	    let {responseType, onUploadProgress, onDownloadProgress} = _config;
	    let onCanceled;
	    let uploadThrottled, downloadThrottled;
	    let flushUpload, flushDownload;

	    function done() {
	      flushUpload && flushUpload(); // flush events
	      flushDownload && flushDownload(); // flush events

	      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

	      _config.signal && _config.signal.removeEventListener('abort', onCanceled);
	    }

	    let request = new XMLHttpRequest();

	    request.open(_config.method.toUpperCase(), _config.url, true);

	    // Set the request timeout in MS
	    request.timeout = _config.timeout;

	    function onloadend() {
	      if (!request) {
	        return;
	      }
	      // Prepare the response
	      const responseHeaders = AxiosHeaders$1.from(
	        'getAllResponseHeaders' in request && request.getAllResponseHeaders()
	      );
	      const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
	        request.responseText : request.response;
	      const response = {
	        data: responseData,
	        status: request.status,
	        statusText: request.statusText,
	        headers: responseHeaders,
	        config,
	        request
	      };

	      settle(function _resolve(value) {
	        resolve(value);
	        done();
	      }, function _reject(err) {
	        reject(err);
	        done();
	      }, response);

	      // Clean up request
	      request = null;
	    }

	    if ('onloadend' in request) {
	      // Use onloadend if available
	      request.onloadend = onloadend;
	    } else {
	      // Listen for ready state to emulate onloadend
	      request.onreadystatechange = function handleLoad() {
	        if (!request || request.readyState !== 4) {
	          return;
	        }

	        // The request errored out and we didn't get a response, this will be
	        // handled by onerror instead
	        // With one exception: request that using file: protocol, most browsers
	        // will return status as 0 even though it's a successful request
	        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	          return;
	        }
	        // readystate handler is calling before onerror or ontimeout handlers,
	        // so we should call onloadend on the next 'tick'
	        setTimeout(onloadend);
	      };
	    }

	    // Handle browser request cancellation (as opposed to a manual cancellation)
	    request.onabort = function handleAbort() {
	      if (!request) {
	        return;
	      }

	      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

	      // Clean up request
	      request = null;
	    };

	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

	      // Clean up request
	      request = null;
	    };

	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
	      const transitional = _config.transitional || transitionalDefaults;
	      if (_config.timeoutErrorMessage) {
	        timeoutErrorMessage = _config.timeoutErrorMessage;
	      }
	      reject(new AxiosError(
	        timeoutErrorMessage,
	        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
	        config,
	        request));

	      // Clean up request
	      request = null;
	    };

	    // Remove Content-Type if data is undefined
	    requestData === undefined && requestHeaders.setContentType(null);

	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
	        request.setRequestHeader(key, val);
	      });
	    }

	    // Add withCredentials to request if needed
	    if (!utils$1.isUndefined(_config.withCredentials)) {
	      request.withCredentials = !!_config.withCredentials;
	    }

	    // Add responseType to request if needed
	    if (responseType && responseType !== 'json') {
	      request.responseType = _config.responseType;
	    }

	    // Handle progress if needed
	    if (onDownloadProgress) {
	      ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
	      request.addEventListener('progress', downloadThrottled);
	    }

	    // Not all browsers support upload events
	    if (onUploadProgress && request.upload) {
	      ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

	      request.upload.addEventListener('progress', uploadThrottled);

	      request.upload.addEventListener('loadend', flushUpload);
	    }

	    if (_config.cancelToken || _config.signal) {
	      // Handle cancellation
	      // eslint-disable-next-line func-names
	      onCanceled = cancel => {
	        if (!request) {
	          return;
	        }
	        reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
	        request.abort();
	        request = null;
	      };

	      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
	      if (_config.signal) {
	        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
	      }
	    }

	    const protocol = parseProtocol(_config.url);

	    if (protocol && platform.protocols.indexOf(protocol) === -1) {
	      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
	      return;
	    }


	    // Send the request
	    request.send(requestData || null);
	  });
	};

	const composeSignals = (signals, timeout) => {
	  const {length} = (signals = signals ? signals.filter(Boolean) : []);

	  if (timeout || length) {
	    let controller = new AbortController();

	    let aborted;

	    const onabort = function (reason) {
	      if (!aborted) {
	        aborted = true;
	        unsubscribe();
	        const err = reason instanceof Error ? reason : this.reason;
	        controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
	      }
	    };

	    let timer = timeout && setTimeout(() => {
	      timer = null;
	      onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
	    }, timeout);

	    const unsubscribe = () => {
	      if (signals) {
	        timer && clearTimeout(timer);
	        timer = null;
	        signals.forEach(signal => {
	          signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
	        });
	        signals = null;
	      }
	    };

	    signals.forEach((signal) => signal.addEventListener('abort', onabort));

	    const {signal} = controller;

	    signal.unsubscribe = () => utils$1.asap(unsubscribe);

	    return signal;
	  }
	};

	var composeSignals$1 = composeSignals;

	const streamChunk = function* (chunk, chunkSize) {
	  let len = chunk.byteLength;

	  if (!chunkSize || len < chunkSize) {
	    yield chunk;
	    return;
	  }

	  let pos = 0;
	  let end;

	  while (pos < len) {
	    end = pos + chunkSize;
	    yield chunk.slice(pos, end);
	    pos = end;
	  }
	};

	const readBytes = async function* (iterable, chunkSize) {
	  for await (const chunk of readStream(iterable)) {
	    yield* streamChunk(chunk, chunkSize);
	  }
	};

	const readStream = async function* (stream) {
	  if (stream[Symbol.asyncIterator]) {
	    yield* stream;
	    return;
	  }

	  const reader = stream.getReader();
	  try {
	    for (;;) {
	      const {done, value} = await reader.read();
	      if (done) {
	        break;
	      }
	      yield value;
	    }
	  } finally {
	    await reader.cancel();
	  }
	};

	const trackStream = (stream, chunkSize, onProgress, onFinish) => {
	  const iterator = readBytes(stream, chunkSize);

	  let bytes = 0;
	  let done;
	  let _onFinish = (e) => {
	    if (!done) {
	      done = true;
	      onFinish && onFinish(e);
	    }
	  };

	  return new ReadableStream({
	    async pull(controller) {
	      try {
	        const {done, value} = await iterator.next();

	        if (done) {
	         _onFinish();
	          controller.close();
	          return;
	        }

	        let len = value.byteLength;
	        if (onProgress) {
	          let loadedBytes = bytes += len;
	          onProgress(loadedBytes);
	        }
	        controller.enqueue(new Uint8Array(value));
	      } catch (err) {
	        _onFinish(err);
	        throw err;
	      }
	    },
	    cancel(reason) {
	      _onFinish(reason);
	      return iterator.return();
	    }
	  }, {
	    highWaterMark: 2
	  })
	};

	const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
	const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === 'function';

	// used only inside the fetch adapter
	const encodeText = isFetchSupported && (typeof TextEncoder === 'function' ?
	    ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) :
	    async (str) => new Uint8Array(await new Response(str).arrayBuffer())
	);

	const test = (fn, ...args) => {
	  try {
	    return !!fn(...args);
	  } catch (e) {
	    return false
	  }
	};

	const supportsRequestStream = isReadableStreamSupported && test(() => {
	  let duplexAccessed = false;

	  const hasContentType = new Request(platform.origin, {
	    body: new ReadableStream(),
	    method: 'POST',
	    get duplex() {
	      duplexAccessed = true;
	      return 'half';
	    },
	  }).headers.has('Content-Type');

	  return duplexAccessed && !hasContentType;
	});

	const DEFAULT_CHUNK_SIZE = 64 * 1024;

	const supportsResponseStream = isReadableStreamSupported &&
	  test(() => utils$1.isReadableStream(new Response('').body));


	const resolvers = {
	  stream: supportsResponseStream && ((res) => res.body)
	};

	isFetchSupported && (((res) => {
	  ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
	    !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res) => res[type]() :
	      (_, config) => {
	        throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
	      });
	  });
	})(new Response));

	const getBodyLength = async (body) => {
	  if (body == null) {
	    return 0;
	  }

	  if(utils$1.isBlob(body)) {
	    return body.size;
	  }

	  if(utils$1.isSpecCompliantForm(body)) {
	    const _request = new Request(platform.origin, {
	      method: 'POST',
	      body,
	    });
	    return (await _request.arrayBuffer()).byteLength;
	  }

	  if(utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
	    return body.byteLength;
	  }

	  if(utils$1.isURLSearchParams(body)) {
	    body = body + '';
	  }

	  if(utils$1.isString(body)) {
	    return (await encodeText(body)).byteLength;
	  }
	};

	const resolveBodyLength = async (headers, body) => {
	  const length = utils$1.toFiniteNumber(headers.getContentLength());

	  return length == null ? getBodyLength(body) : length;
	};

	var fetchAdapter = isFetchSupported && (async (config) => {
	  let {
	    url,
	    method,
	    data,
	    signal,
	    cancelToken,
	    timeout,
	    onDownloadProgress,
	    onUploadProgress,
	    responseType,
	    headers,
	    withCredentials = 'same-origin',
	    fetchOptions
	  } = resolveConfig(config);

	  responseType = responseType ? (responseType + '').toLowerCase() : 'text';

	  let composedSignal = composeSignals$1([signal, cancelToken && cancelToken.toAbortSignal()], timeout);

	  let request;

	  const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
	      composedSignal.unsubscribe();
	  });

	  let requestContentLength;

	  try {
	    if (
	      onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
	      (requestContentLength = await resolveBodyLength(headers, data)) !== 0
	    ) {
	      let _request = new Request(url, {
	        method: 'POST',
	        body: data,
	        duplex: "half"
	      });

	      let contentTypeHeader;

	      if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
	        headers.setContentType(contentTypeHeader);
	      }

	      if (_request.body) {
	        const [onProgress, flush] = progressEventDecorator(
	          requestContentLength,
	          progressEventReducer(asyncDecorator(onUploadProgress))
	        );

	        data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
	      }
	    }

	    if (!utils$1.isString(withCredentials)) {
	      withCredentials = withCredentials ? 'include' : 'omit';
	    }

	    // Cloudflare Workers throws when credentials are defined
	    // see https://github.com/cloudflare/workerd/issues/902
	    const isCredentialsSupported = "credentials" in Request.prototype;
	    request = new Request(url, {
	      ...fetchOptions,
	      signal: composedSignal,
	      method: method.toUpperCase(),
	      headers: headers.normalize().toJSON(),
	      body: data,
	      duplex: "half",
	      credentials: isCredentialsSupported ? withCredentials : undefined
	    });

	    let response = await fetch(request);

	    const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

	    if (supportsResponseStream && (onDownloadProgress || (isStreamResponse && unsubscribe))) {
	      const options = {};

	      ['status', 'statusText', 'headers'].forEach(prop => {
	        options[prop] = response[prop];
	      });

	      const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

	      const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
	        responseContentLength,
	        progressEventReducer(asyncDecorator(onDownloadProgress), true)
	      ) || [];

	      response = new Response(
	        trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
	          flush && flush();
	          unsubscribe && unsubscribe();
	        }),
	        options
	      );
	    }

	    responseType = responseType || 'text';

	    let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

	    !isStreamResponse && unsubscribe && unsubscribe();

	    return await new Promise((resolve, reject) => {
	      settle(resolve, reject, {
	        data: responseData,
	        headers: AxiosHeaders$1.from(response.headers),
	        status: response.status,
	        statusText: response.statusText,
	        config,
	        request
	      });
	    })
	  } catch (err) {
	    unsubscribe && unsubscribe();

	    if (err && err.name === 'TypeError' && /fetch/i.test(err.message)) {
	      throw Object.assign(
	        new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
	        {
	          cause: err.cause || err
	        }
	      )
	    }

	    throw AxiosError.from(err, err && err.code, config, request);
	  }
	});

	const knownAdapters = {
	  http: httpAdapter,
	  xhr: xhrAdapter,
	  fetch: fetchAdapter
	};

	utils$1.forEach(knownAdapters, (fn, value) => {
	  if (fn) {
	    try {
	      Object.defineProperty(fn, 'name', {value});
	    } catch (e) {
	      // eslint-disable-next-line no-empty
	    }
	    Object.defineProperty(fn, 'adapterName', {value});
	  }
	});

	const renderReason = (reason) => `- ${reason}`;

	const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

	var adapters = {
	  getAdapter: (adapters) => {
	    adapters = utils$1.isArray(adapters) ? adapters : [adapters];

	    const {length} = adapters;
	    let nameOrAdapter;
	    let adapter;

	    const rejectedReasons = {};

	    for (let i = 0; i < length; i++) {
	      nameOrAdapter = adapters[i];
	      let id;

	      adapter = nameOrAdapter;

	      if (!isResolvedHandle(nameOrAdapter)) {
	        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

	        if (adapter === undefined) {
	          throw new AxiosError(`Unknown adapter '${id}'`);
	        }
	      }

	      if (adapter) {
	        break;
	      }

	      rejectedReasons[id || '#' + i] = adapter;
	    }

	    if (!adapter) {

	      const reasons = Object.entries(rejectedReasons)
	        .map(([id, state]) => `adapter ${id} ` +
	          (state === false ? 'is not supported by the environment' : 'is not available in the build')
	        );

	      let s = length ?
	        (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
	        'as no adapter specified';

	      throw new AxiosError(
	        `There is no suitable adapter to dispatch the request ` + s,
	        'ERR_NOT_SUPPORT'
	      );
	    }

	    return adapter;
	  },
	  adapters: knownAdapters
	};

	/**
	 * Throws a `CanceledError` if cancellation has been requested.
	 *
	 * @param {Object} config The config that is to be used for the request
	 *
	 * @returns {void}
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }

	  if (config.signal && config.signal.aborted) {
	    throw new CanceledError(null, config);
	  }
	}

	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 *
	 * @returns {Promise} The Promise to be fulfilled
	 */
	function dispatchRequest(config) {
	  throwIfCancellationRequested(config);

	  config.headers = AxiosHeaders$1.from(config.headers);

	  // Transform request data
	  config.data = transformData.call(
	    config,
	    config.transformRequest
	  );

	  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
	    config.headers.setContentType('application/x-www-form-urlencoded', false);
	  }

	  const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);

	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);

	    // Transform response data
	    response.data = transformData.call(
	      config,
	      config.transformResponse,
	      response
	    );

	    response.headers = AxiosHeaders$1.from(response.headers);

	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);

	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData.call(
	          config,
	          config.transformResponse,
	          reason.response
	        );
	        reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
	      }
	    }

	    return Promise.reject(reason);
	  });
	}

	const VERSION = "1.7.7";

	const validators$1 = {};

	// eslint-disable-next-line func-names
	['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
	  validators$1[type] = function validator(thing) {
	    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
	  };
	});

	const deprecatedWarnings = {};

	/**
	 * Transitional option validator
	 *
	 * @param {function|boolean?} validator - set to false if the transitional option has been removed
	 * @param {string?} version - deprecated version / removed since version
	 * @param {string?} message - some message with additional info
	 *
	 * @returns {function}
	 */
	validators$1.transitional = function transitional(validator, version, message) {
	  function formatMessage(opt, desc) {
	    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
	  }

	  // eslint-disable-next-line func-names
	  return (value, opt, opts) => {
	    if (validator === false) {
	      throw new AxiosError(
	        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
	        AxiosError.ERR_DEPRECATED
	      );
	    }

	    if (version && !deprecatedWarnings[opt]) {
	      deprecatedWarnings[opt] = true;
	      // eslint-disable-next-line no-console
	      console.warn(
	        formatMessage(
	          opt,
	          ' has been deprecated since v' + version + ' and will be removed in the near future'
	        )
	      );
	    }

	    return validator ? validator(value, opt, opts) : true;
	  };
	};

	/**
	 * Assert object's properties type
	 *
	 * @param {object} options
	 * @param {object} schema
	 * @param {boolean?} allowUnknown
	 *
	 * @returns {object}
	 */

	function assertOptions(options, schema, allowUnknown) {
	  if (typeof options !== 'object') {
	    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
	  }
	  const keys = Object.keys(options);
	  let i = keys.length;
	  while (i-- > 0) {
	    const opt = keys[i];
	    const validator = schema[opt];
	    if (validator) {
	      const value = options[opt];
	      const result = value === undefined || validator(value, opt, options);
	      if (result !== true) {
	        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
	      }
	      continue;
	    }
	    if (allowUnknown !== true) {
	      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
	    }
	  }
	}

	var validator = {
	  assertOptions,
	  validators: validators$1
	};

	const validators = validator.validators;

	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 *
	 * @return {Axios} A new instance of Axios
	 */
	class Axios {
	  constructor(instanceConfig) {
	    this.defaults = instanceConfig;
	    this.interceptors = {
	      request: new InterceptorManager$1(),
	      response: new InterceptorManager$1()
	    };
	  }

	  /**
	   * Dispatch a request
	   *
	   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
	   * @param {?Object} config
	   *
	   * @returns {Promise} The Promise to be fulfilled
	   */
	  async request(configOrUrl, config) {
	    try {
	      return await this._request(configOrUrl, config);
	    } catch (err) {
	      if (err instanceof Error) {
	        let dummy;

	        Error.captureStackTrace ? Error.captureStackTrace(dummy = {}) : (dummy = new Error());

	        // slice off the Error: ... line
	        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
	        try {
	          if (!err.stack) {
	            err.stack = stack;
	            // match without the 2 top stack lines
	          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
	            err.stack += '\n' + stack;
	          }
	        } catch (e) {
	          // ignore the case where "stack" is an un-writable property
	        }
	      }

	      throw err;
	    }
	  }

	  _request(configOrUrl, config) {
	    /*eslint no-param-reassign:0*/
	    // Allow for axios('example/url'[, config]) a la fetch API
	    if (typeof configOrUrl === 'string') {
	      config = config || {};
	      config.url = configOrUrl;
	    } else {
	      config = configOrUrl || {};
	    }

	    config = mergeConfig(this.defaults, config);

	    const {transitional, paramsSerializer, headers} = config;

	    if (transitional !== undefined) {
	      validator.assertOptions(transitional, {
	        silentJSONParsing: validators.transitional(validators.boolean),
	        forcedJSONParsing: validators.transitional(validators.boolean),
	        clarifyTimeoutError: validators.transitional(validators.boolean)
	      }, false);
	    }

	    if (paramsSerializer != null) {
	      if (utils$1.isFunction(paramsSerializer)) {
	        config.paramsSerializer = {
	          serialize: paramsSerializer
	        };
	      } else {
	        validator.assertOptions(paramsSerializer, {
	          encode: validators.function,
	          serialize: validators.function
	        }, true);
	      }
	    }

	    // Set config.method
	    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

	    // Flatten headers
	    let contextHeaders = headers && utils$1.merge(
	      headers.common,
	      headers[config.method]
	    );

	    headers && utils$1.forEach(
	      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	      (method) => {
	        delete headers[method];
	      }
	    );

	    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

	    // filter out skipped interceptors
	    const requestInterceptorChain = [];
	    let synchronousRequestInterceptors = true;
	    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
	        return;
	      }

	      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

	      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
	    });

	    const responseInterceptorChain = [];
	    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
	    });

	    let promise;
	    let i = 0;
	    let len;

	    if (!synchronousRequestInterceptors) {
	      const chain = [dispatchRequest.bind(this), undefined];
	      chain.unshift.apply(chain, requestInterceptorChain);
	      chain.push.apply(chain, responseInterceptorChain);
	      len = chain.length;

	      promise = Promise.resolve(config);

	      while (i < len) {
	        promise = promise.then(chain[i++], chain[i++]);
	      }

	      return promise;
	    }

	    len = requestInterceptorChain.length;

	    let newConfig = config;

	    i = 0;

	    while (i < len) {
	      const onFulfilled = requestInterceptorChain[i++];
	      const onRejected = requestInterceptorChain[i++];
	      try {
	        newConfig = onFulfilled(newConfig);
	      } catch (error) {
	        onRejected.call(this, error);
	        break;
	      }
	    }

	    try {
	      promise = dispatchRequest.call(this, newConfig);
	    } catch (error) {
	      return Promise.reject(error);
	    }

	    i = 0;
	    len = responseInterceptorChain.length;

	    while (i < len) {
	      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
	    }

	    return promise;
	  }

	  getUri(config) {
	    config = mergeConfig(this.defaults, config);
	    const fullPath = buildFullPath(config.baseURL, config.url);
	    return buildURL(fullPath, config.params, config.paramsSerializer);
	  }
	}

	// Provide aliases for supported request methods
	utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(mergeConfig(config || {}, {
	      method,
	      url,
	      data: (config || {}).data
	    }));
	  };
	});

	utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/

	  function generateHTTPMethod(isForm) {
	    return function httpMethod(url, data, config) {
	      return this.request(mergeConfig(config || {}, {
	        method,
	        headers: isForm ? {
	          'Content-Type': 'multipart/form-data'
	        } : {},
	        url,
	        data
	      }));
	    };
	  }

	  Axios.prototype[method] = generateHTTPMethod();

	  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
	});

	var Axios$1 = Axios;

	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @param {Function} executor The executor function.
	 *
	 * @returns {CancelToken}
	 */
	class CancelToken {
	  constructor(executor) {
	    if (typeof executor !== 'function') {
	      throw new TypeError('executor must be a function.');
	    }

	    let resolvePromise;

	    this.promise = new Promise(function promiseExecutor(resolve) {
	      resolvePromise = resolve;
	    });

	    const token = this;

	    // eslint-disable-next-line func-names
	    this.promise.then(cancel => {
	      if (!token._listeners) return;

	      let i = token._listeners.length;

	      while (i-- > 0) {
	        token._listeners[i](cancel);
	      }
	      token._listeners = null;
	    });

	    // eslint-disable-next-line func-names
	    this.promise.then = onfulfilled => {
	      let _resolve;
	      // eslint-disable-next-line func-names
	      const promise = new Promise(resolve => {
	        token.subscribe(resolve);
	        _resolve = resolve;
	      }).then(onfulfilled);

	      promise.cancel = function reject() {
	        token.unsubscribe(_resolve);
	      };

	      return promise;
	    };

	    executor(function cancel(message, config, request) {
	      if (token.reason) {
	        // Cancellation has already been requested
	        return;
	      }

	      token.reason = new CanceledError(message, config, request);
	      resolvePromise(token.reason);
	    });
	  }

	  /**
	   * Throws a `CanceledError` if cancellation has been requested.
	   */
	  throwIfRequested() {
	    if (this.reason) {
	      throw this.reason;
	    }
	  }

	  /**
	   * Subscribe to the cancel signal
	   */

	  subscribe(listener) {
	    if (this.reason) {
	      listener(this.reason);
	      return;
	    }

	    if (this._listeners) {
	      this._listeners.push(listener);
	    } else {
	      this._listeners = [listener];
	    }
	  }

	  /**
	   * Unsubscribe from the cancel signal
	   */

	  unsubscribe(listener) {
	    if (!this._listeners) {
	      return;
	    }
	    const index = this._listeners.indexOf(listener);
	    if (index !== -1) {
	      this._listeners.splice(index, 1);
	    }
	  }

	  toAbortSignal() {
	    const controller = new AbortController();

	    const abort = (err) => {
	      controller.abort(err);
	    };

	    this.subscribe(abort);

	    controller.signal.unsubscribe = () => this.unsubscribe(abort);

	    return controller.signal;
	  }

	  /**
	   * Returns an object that contains a new `CancelToken` and a function that, when called,
	   * cancels the `CancelToken`.
	   */
	  static source() {
	    let cancel;
	    const token = new CancelToken(function executor(c) {
	      cancel = c;
	    });
	    return {
	      token,
	      cancel
	    };
	  }
	}

	var CancelToken$1 = CancelToken;

	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 *
	 * @returns {Function}
	 */
	function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	}

	/**
	 * Determines whether the payload is an error thrown by Axios
	 *
	 * @param {*} payload The value to test
	 *
	 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
	 */
	function isAxiosError(payload) {
	  return utils$1.isObject(payload) && (payload.isAxiosError === true);
	}

	const HttpStatusCode = {
	  Continue: 100,
	  SwitchingProtocols: 101,
	  Processing: 102,
	  EarlyHints: 103,
	  Ok: 200,
	  Created: 201,
	  Accepted: 202,
	  NonAuthoritativeInformation: 203,
	  NoContent: 204,
	  ResetContent: 205,
	  PartialContent: 206,
	  MultiStatus: 207,
	  AlreadyReported: 208,
	  ImUsed: 226,
	  MultipleChoices: 300,
	  MovedPermanently: 301,
	  Found: 302,
	  SeeOther: 303,
	  NotModified: 304,
	  UseProxy: 305,
	  Unused: 306,
	  TemporaryRedirect: 307,
	  PermanentRedirect: 308,
	  BadRequest: 400,
	  Unauthorized: 401,
	  PaymentRequired: 402,
	  Forbidden: 403,
	  NotFound: 404,
	  MethodNotAllowed: 405,
	  NotAcceptable: 406,
	  ProxyAuthenticationRequired: 407,
	  RequestTimeout: 408,
	  Conflict: 409,
	  Gone: 410,
	  LengthRequired: 411,
	  PreconditionFailed: 412,
	  PayloadTooLarge: 413,
	  UriTooLong: 414,
	  UnsupportedMediaType: 415,
	  RangeNotSatisfiable: 416,
	  ExpectationFailed: 417,
	  ImATeapot: 418,
	  MisdirectedRequest: 421,
	  UnprocessableEntity: 422,
	  Locked: 423,
	  FailedDependency: 424,
	  TooEarly: 425,
	  UpgradeRequired: 426,
	  PreconditionRequired: 428,
	  TooManyRequests: 429,
	  RequestHeaderFieldsTooLarge: 431,
	  UnavailableForLegalReasons: 451,
	  InternalServerError: 500,
	  NotImplemented: 501,
	  BadGateway: 502,
	  ServiceUnavailable: 503,
	  GatewayTimeout: 504,
	  HttpVersionNotSupported: 505,
	  VariantAlsoNegotiates: 506,
	  InsufficientStorage: 507,
	  LoopDetected: 508,
	  NotExtended: 510,
	  NetworkAuthenticationRequired: 511,
	};

	Object.entries(HttpStatusCode).forEach(([key, value]) => {
	  HttpStatusCode[value] = key;
	});

	var HttpStatusCode$1 = HttpStatusCode;

	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 *
	 * @returns {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  const context = new Axios$1(defaultConfig);
	  const instance = bind(Axios$1.prototype.request, context);

	  // Copy axios.prototype to instance
	  utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

	  // Copy context to instance
	  utils$1.extend(instance, context, null, {allOwnKeys: true});

	  // Factory for creating new instances
	  instance.create = function create(instanceConfig) {
	    return createInstance(mergeConfig(defaultConfig, instanceConfig));
	  };

	  return instance;
	}

	// Create the default instance to be exported
	const axios = createInstance(defaults$1);

	// Expose Axios class to allow class inheritance
	axios.Axios = Axios$1;

	// Expose Cancel & CancelToken
	axios.CanceledError = CanceledError;
	axios.CancelToken = CancelToken$1;
	axios.isCancel = isCancel;
	axios.VERSION = VERSION;
	axios.toFormData = toFormData;

	// Expose AxiosError class
	axios.AxiosError = AxiosError;

	// alias for CanceledError for backward compatibility
	axios.Cancel = axios.CanceledError;

	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};

	axios.spread = spread;

	// Expose isAxiosError
	axios.isAxiosError = isAxiosError;

	// Expose mergeConfig
	axios.mergeConfig = mergeConfig;

	axios.AxiosHeaders = AxiosHeaders$1;

	axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

	axios.getAdapter = adapters.getAdapter;

	axios.HttpStatusCode = HttpStatusCode$1;

	axios.default = axios;

	// this module should only have a default export
	var axios$1 = axios;

	const API_URL = "http://localhost:5269/api/Cars";

	const fetchCars = async () => {
	    const response = await axios$1.get(API_URL);
	    console.log(response);
	    return response.data;
	};

	const addCar = async (car) => {
	    const response = await axios$1.post(API_URL, car);
	    return response.data;
	};

	const fetchCarId = async (make, model, year) => {
	    const response = await axios$1.get(`${API_URL}/search`, {
	        params:{
	            make,
	            model,
	            year
	        }
	    });
	    console.log(response.data);
	    return response.data;
	};

	const deleteCar = async (id) => {
	    const response = await axios$1.delete(`${API_URL}/${id}`);
	    return response.data;
	};

	const subscriber_queue = [];

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop$1) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop$1) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop$1;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	function getOriginalBodyPadding() {
	  const style = window ? window.getComputedStyle(document.body, null) : {};

	  return parseInt((style && style.getPropertyValue('padding-right')) || 0, 10);
	}

	function getScrollbarWidth() {
	  let scrollDiv = document.createElement('div');
	  // .modal-scrollbar-measure styles // https://github.com/twbs/bootstrap/blob/v4.0.0-alpha.4/scss/_modal.scss#L106-L113
	  scrollDiv.style.position = 'absolute';
	  scrollDiv.style.top = '-9999px';
	  scrollDiv.style.width = '50px';
	  scrollDiv.style.height = '50px';
	  scrollDiv.style.overflow = 'scroll';
	  document.body.appendChild(scrollDiv);
	  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
	  document.body.removeChild(scrollDiv);
	  return scrollbarWidth;
	}

	function setScrollbarWidth(padding) {
	  document.body.style.paddingRight = padding > 0 ? `${padding}px` : null;
	}

	function isBodyOverflowing() {
	  return window ? document.body.clientWidth < window.innerWidth : false;
	}

	function conditionallyUpdateScrollbar() {
	  const scrollbarWidth = getScrollbarWidth();
	  // https://github.com/twbs/bootstrap/blob/v4.0.0-alpha.6/js/src/modal.js#L433
	  const fixedContent = document.querySelectorAll('.fixed-top, .fixed-bottom, .is-fixed, .sticky-top')[0];
	  const bodyPadding = fixedContent ? parseInt(fixedContent.style.paddingRight || 0, 10) : 0;

	  if (isBodyOverflowing()) {
	    setScrollbarWidth(bodyPadding + scrollbarWidth);
	  }
	}

	function browserEvent(target, ...args) {
	  target.addEventListener(...args);

	  return () => target.removeEventListener(...args);
	}

	function toClassName(value) {
	  let result = '';

	  if (typeof value === 'string' || typeof value === 'number') {
	    result += value;
	  } else if (typeof value === 'object') {
	    if (Array.isArray(value)) {
	      result = value.map(toClassName).filter(Boolean).join(' ');
	    } else {
	      for (let key in value) {
	        if (value[key]) {
	          result && (result += ' ');
	          result += key;
	        }
	      }
	    }
	  }

	  return result;
	}

	const classnames = (...args) => args.map(toClassName).filter(Boolean).join(' ');

	function getTransitionDuration(element) {
	  if (!element) return 0;

	  // Get transition-duration of the element
	  let { transitionDuration, transitionDelay } = window.getComputedStyle(element);

	  const floatTransitionDuration = Number.parseFloat(transitionDuration);
	  const floatTransitionDelay = Number.parseFloat(transitionDelay);

	  // Return 0 if element or transition duration is not found
	  if (!floatTransitionDuration && !floatTransitionDelay) {
	    return 0;
	  }

	  // If multiple durations are defined, take the first
	  transitionDuration = transitionDuration.split(',')[0];
	  transitionDelay = transitionDelay.split(',')[0];

	  return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * 1000;
	}

	function uuid() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
	    const r = (Math.random() * 16) | 0;
	    const v = c === 'x' ? r : (r & 0x3) | 0x8;
	    return v.toString(16);
	  });
	}

	function backdropIn(node) {
	  node.style.display = 'block';

	  const duration = getTransitionDuration(node);

	  return {
	    duration,
	    tick: (t) => {
	      if (t === 0) {
	        node.classList.add('show');
	      }
	    }
	  };
	}

	function backdropOut(node) {
	  node.classList.remove('show');
	  const duration = getTransitionDuration(node);

	  return {
	    duration,
	    tick: (t) => {
	      if (t === 0) {
	        node.style.display = 'none';
	      }
	    }
	  };
	}

	function modalIn(node) {
	  node.style.display = 'block';
	  const duration = getTransitionDuration(node);

	  return {
	    duration,
	    tick: (t) => {
	      if (t > 0) {
	        node.classList.add('show');
	      }
	    }
	  };
	}

	function modalOut(node) {
	  node.classList.remove('show');
	  const duration = getTransitionDuration(node);

	  return {
	    duration,
	    tick: (t) => {
	      if (t === 1) {
	        node.style.display = 'none';
	      }
	    }
	  };
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Button/Button.svelte generated by Svelte v4.2.19 */
	const file$j = "node_modules/@sveltestrap/sveltestrap/dist/Button/Button.svelte";

	// (122:0) {:else}
	function create_else_block_1$1(ctx) {
		let button;
		let button_aria_label_value;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[17].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);
		const default_slot_or_fallback = default_slot || fallback_block$2(ctx);

		let button_levels = [
			/*$$restProps*/ ctx[8],
			{ class: /*classes*/ ctx[6] },
			{ disabled: /*disabled*/ ctx[2] },
			{ value: /*value*/ ctx[4] },
			{
				"aria-label": button_aria_label_value = /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[5]
			}
		];

		let button_data = {};

		for (let i = 0; i < button_levels.length; i += 1) {
			button_data = assign(button_data, button_levels[i]);
		}

		const block_1 = {
			c: function create() {
				button = element("button");
				if (default_slot_or_fallback) default_slot_or_fallback.c();
				set_attributes(button, button_data);
				add_location(button, file$j, 122, 2, 2298);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (default_slot_or_fallback) {
					default_slot_or_fallback.m(button, null);
				}

				if (button.autofocus) button.focus();
				/*button_binding*/ ctx[21](button);
				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[19], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[16],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null),
							null
						);
					}
				} else {
					if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*children, $$scope*/ 65538)) {
						default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
					}
				}

				set_attributes(button, button_data = get_spread_update(button_levels, [
					dirty & /*$$restProps*/ 256 && /*$$restProps*/ ctx[8],
					(!current || dirty & /*classes*/ 64) && { class: /*classes*/ ctx[6] },
					(!current || dirty & /*disabled*/ 4) && { disabled: /*disabled*/ ctx[2] },
					(!current || dirty & /*value*/ 16) && { value: /*value*/ ctx[4] },
					(!current || dirty & /*ariaLabel, defaultAriaLabel*/ 160 && button_aria_label_value !== (button_aria_label_value = /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[5])) && { "aria-label": button_aria_label_value }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot_or_fallback, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot_or_fallback, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
				/*button_binding*/ ctx[21](null);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_else_block_1$1.name,
			type: "else",
			source: "(122:0) {:else}",
			ctx
		});

		return block_1;
	}

	// (106:0) {#if href}
	function create_if_block$7(ctx) {
		let a;
		let current_block_type_index;
		let if_block;
		let a_aria_label_value;
		let current;
		let mounted;
		let dispose;
		const if_block_creators = [create_if_block_1$4, create_else_block$6];
		const if_blocks = [];

		function select_block_type_1(ctx, dirty) {
			if (/*children*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type_1(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		let a_levels = [
			/*$$restProps*/ ctx[8],
			{ class: /*classes*/ ctx[6] },
			{ href: /*href*/ ctx[3] },
			{
				"aria-label": a_aria_label_value = /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[5]
			}
		];

		let a_data = {};

		for (let i = 0; i < a_levels.length; i += 1) {
			a_data = assign(a_data, a_levels[i]);
		}

		const block_1 = {
			c: function create() {
				a = element("a");
				if_block.c();
				set_attributes(a, a_data);
				toggle_class(a, "disabled", /*disabled*/ ctx[2]);
				add_location(a, file$j, 106, 2, 2048);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				if_blocks[current_block_type_index].m(a, null);
				/*a_binding*/ ctx[20](a);
				current = true;

				if (!mounted) {
					dispose = listen_dev(a, "click", /*click_handler*/ ctx[18], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_1(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(a, null);
				}

				set_attributes(a, a_data = get_spread_update(a_levels, [
					dirty & /*$$restProps*/ 256 && /*$$restProps*/ ctx[8],
					(!current || dirty & /*classes*/ 64) && { class: /*classes*/ ctx[6] },
					(!current || dirty & /*href*/ 8) && { href: /*href*/ ctx[3] },
					(!current || dirty & /*ariaLabel, defaultAriaLabel*/ 160 && a_aria_label_value !== (a_aria_label_value = /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[5])) && { "aria-label": a_aria_label_value }
				]));

				toggle_class(a, "disabled", /*disabled*/ ctx[2]);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(a);
				}

				if_blocks[current_block_type_index].d();
				/*a_binding*/ ctx[20](null);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_if_block$7.name,
			type: "if",
			source: "(106:0) {#if href}",
			ctx
		});

		return block_1;
	}

	// (135:6) {:else}
	function create_else_block_2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[17].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

		const block_1 = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[16],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_else_block_2.name,
			type: "else",
			source: "(135:6) {:else}",
			ctx
		});

		return block_1;
	}

	// (133:6) {#if children}
	function create_if_block_2$3(ctx) {
		let t;

		const block_1 = {
			c: function create() {
				t = text(/*children*/ ctx[1]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*children*/ 2) set_data_dev(t, /*children*/ ctx[1]);
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_if_block_2$3.name,
			type: "if",
			source: "(133:6) {#if children}",
			ctx
		});

		return block_1;
	}

	// (132:10)        
	function fallback_block$2(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block_2$3, create_else_block_2];
		const if_blocks = [];

		function select_block_type_2(ctx, dirty) {
			if (/*children*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type_2(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block_1 = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_2(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: fallback_block$2.name,
			type: "fallback",
			source: "(132:10)        ",
			ctx
		});

		return block_1;
	}

	// (118:4) {:else}
	function create_else_block$6(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[17].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

		const block_1 = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 65536)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[16],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_else_block$6.name,
			type: "else",
			source: "(118:4) {:else}",
			ctx
		});

		return block_1;
	}

	// (116:4) {#if children}
	function create_if_block_1$4(ctx) {
		let t;

		const block_1 = {
			c: function create() {
				t = text(/*children*/ ctx[1]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*children*/ 2) set_data_dev(t, /*children*/ ctx[1]);
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_if_block_1$4.name,
			type: "if",
			source: "(116:4) {#if children}",
			ctx
		});

		return block_1;
	}

	function create_fragment$k(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$7, create_else_block_1$1];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*href*/ ctx[3]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block_1 = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block: block_1,
			id: create_fragment$k.name,
			type: "component",
			source: "",
			ctx
		});

		return block_1;
	}

	function instance$k($$self, $$props, $$invalidate) {
		let ariaLabel;
		let classes;
		let defaultAriaLabel;

		const omit_props_names = [
			"class","active","block","children","close","color","disabled","href","inner","outline","size","value"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Button', slots, ['default']);
		let { class: className = '' } = $$props;
		let { active = false } = $$props;
		let { block = false } = $$props;
		let { children = '' } = $$props;
		let { close = false } = $$props;
		let { color = 'secondary' } = $$props;
		let { disabled = false } = $$props;
		let { href = '' } = $$props;
		let { inner = undefined } = $$props;
		let { outline = false } = $$props;
		let { size = '' } = $$props;
		let { value = '' } = $$props;

		function click_handler(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function a_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(0, inner);
			});
		}

		function button_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(0, inner);
			});
		}

		$$self.$$set = $$new_props => {
			$$invalidate(22, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
			$$invalidate(8, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(9, className = $$new_props.class);
			if ('active' in $$new_props) $$invalidate(10, active = $$new_props.active);
			if ('block' in $$new_props) $$invalidate(11, block = $$new_props.block);
			if ('children' in $$new_props) $$invalidate(1, children = $$new_props.children);
			if ('close' in $$new_props) $$invalidate(12, close = $$new_props.close);
			if ('color' in $$new_props) $$invalidate(13, color = $$new_props.color);
			if ('disabled' in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
			if ('href' in $$new_props) $$invalidate(3, href = $$new_props.href);
			if ('inner' in $$new_props) $$invalidate(0, inner = $$new_props.inner);
			if ('outline' in $$new_props) $$invalidate(14, outline = $$new_props.outline);
			if ('size' in $$new_props) $$invalidate(15, size = $$new_props.size);
			if ('value' in $$new_props) $$invalidate(4, value = $$new_props.value);
			if ('$$scope' in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			className,
			active,
			block,
			children,
			close,
			color,
			disabled,
			href,
			inner,
			outline,
			size,
			value,
			defaultAriaLabel,
			classes,
			ariaLabel
		});

		$$self.$inject_state = $$new_props => {
			$$invalidate(22, $$props = assign(assign({}, $$props), $$new_props));
			if ('className' in $$props) $$invalidate(9, className = $$new_props.className);
			if ('active' in $$props) $$invalidate(10, active = $$new_props.active);
			if ('block' in $$props) $$invalidate(11, block = $$new_props.block);
			if ('children' in $$props) $$invalidate(1, children = $$new_props.children);
			if ('close' in $$props) $$invalidate(12, close = $$new_props.close);
			if ('color' in $$props) $$invalidate(13, color = $$new_props.color);
			if ('disabled' in $$props) $$invalidate(2, disabled = $$new_props.disabled);
			if ('href' in $$props) $$invalidate(3, href = $$new_props.href);
			if ('inner' in $$props) $$invalidate(0, inner = $$new_props.inner);
			if ('outline' in $$props) $$invalidate(14, outline = $$new_props.outline);
			if ('size' in $$props) $$invalidate(15, size = $$new_props.size);
			if ('value' in $$props) $$invalidate(4, value = $$new_props.value);
			if ('defaultAriaLabel' in $$props) $$invalidate(5, defaultAriaLabel = $$new_props.defaultAriaLabel);
			if ('classes' in $$props) $$invalidate(6, classes = $$new_props.classes);
			if ('ariaLabel' in $$props) $$invalidate(7, ariaLabel = $$new_props.ariaLabel);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			$$invalidate(7, ariaLabel = $$props['aria-label']);

			if ($$self.$$.dirty & /*className, close, outline, color, size, block, active*/ 65024) {
				$$invalidate(6, classes = classnames(className, close ? 'btn-close' : 'btn', close || `btn${outline ? '-outline' : ''}-${color}`, size ? `btn-${size}` : false, block ? 'd-block w-100' : false, { active }));
			}

			if ($$self.$$.dirty & /*close*/ 4096) {
				$$invalidate(5, defaultAriaLabel = close ? 'Close' : null);
			}
		};

		$$props = exclude_internal_props($$props);

		return [
			inner,
			children,
			disabled,
			href,
			value,
			defaultAriaLabel,
			classes,
			ariaLabel,
			$$restProps,
			className,
			active,
			block,
			close,
			color,
			outline,
			size,
			$$scope,
			slots,
			click_handler,
			click_handler_1,
			a_binding,
			button_binding
		];
	}

	class Button extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$k, create_fragment$k, safe_not_equal, {
				class: 9,
				active: 10,
				block: 11,
				children: 1,
				close: 12,
				color: 13,
				disabled: 2,
				href: 3,
				inner: 0,
				outline: 14,
				size: 15,
				value: 4
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Button",
				options,
				id: create_fragment$k.name
			});
		}

		get class() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get active() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set active(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get block() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set block(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get children() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set children(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get close() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set close(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get color() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set color(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get disabled() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set disabled(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get href() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set href(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get inner() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set inner(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get outline() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set outline(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get value() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/FormCheck/FormCheck.svelte generated by Svelte v4.2.19 */
	const file$i = "node_modules/@sveltestrap/sveltestrap/dist/FormCheck/FormCheck.svelte";
	const get_label_slot_changes = dirty => ({});
	const get_label_slot_context = ctx => ({});

	// (68:2) {:else}
	function create_else_block$5(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[11],
			{ class: /*inputClasses*/ ctx[9] },
			{ id: /*idFor*/ ctx[8] },
			{ type: "checkbox" },
			{ disabled: /*disabled*/ ctx[3] },
			{ name: /*name*/ ctx[5] },
			{ __value: /*value*/ ctx[7] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$i, 68, 4, 1456);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				input.checked = /*checked*/ ctx[0];
				/*input_binding_2*/ ctx[39](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "change", /*input_change_handler_2*/ ctx[38]),
						listen_dev(input, "blur", /*blur_handler_2*/ ctx[29], false, false, false, false),
						listen_dev(input, "change", /*change_handler_2*/ ctx[30], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_2*/ ctx[31], false, false, false, false),
						listen_dev(input, "input", /*input_handler_2*/ ctx[32], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 2048 && /*$$restProps*/ ctx[11],
					dirty[0] & /*inputClasses*/ 512 && { class: /*inputClasses*/ ctx[9] },
					dirty[0] & /*idFor*/ 256 && { id: /*idFor*/ ctx[8] },
					{ type: "checkbox" },
					dirty[0] & /*disabled*/ 8 && { disabled: /*disabled*/ ctx[3] },
					dirty[0] & /*name*/ 32 && { name: /*name*/ ctx[5] },
					dirty[0] & /*value*/ 128 && { __value: /*value*/ ctx[7] }
				]));

				if (dirty[0] & /*checked*/ 1) {
					input.checked = /*checked*/ ctx[0];
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_2*/ ctx[39](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$5.name,
			type: "else",
			source: "(68:2) {:else}",
			ctx
		});

		return block;
	}

	// (52:30) 
	function create_if_block_2$2(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[11],
			{ class: /*inputClasses*/ ctx[9] },
			{ id: /*idFor*/ ctx[8] },
			{ type: "checkbox" },
			{ disabled: /*disabled*/ ctx[3] },
			{ name: /*name*/ ctx[5] },
			{ __value: /*value*/ ctx[7] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$i, 52, 4, 1192);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				input.checked = /*checked*/ ctx[0];
				/*input_binding_1*/ ctx[37](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "change", /*input_change_handler_1*/ ctx[36]),
						listen_dev(input, "blur", /*blur_handler_1*/ ctx[25], false, false, false, false),
						listen_dev(input, "change", /*change_handler_1*/ ctx[26], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_1*/ ctx[27], false, false, false, false),
						listen_dev(input, "input", /*input_handler_1*/ ctx[28], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 2048 && /*$$restProps*/ ctx[11],
					dirty[0] & /*inputClasses*/ 512 && { class: /*inputClasses*/ ctx[9] },
					dirty[0] & /*idFor*/ 256 && { id: /*idFor*/ ctx[8] },
					{ type: "checkbox" },
					dirty[0] & /*disabled*/ 8 && { disabled: /*disabled*/ ctx[3] },
					dirty[0] & /*name*/ 32 && { name: /*name*/ ctx[5] },
					dirty[0] & /*value*/ 128 && { __value: /*value*/ ctx[7] }
				]));

				if (dirty[0] & /*checked*/ 1) {
					input.checked = /*checked*/ ctx[0];
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_1*/ ctx[37](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$2.name,
			type: "if",
			source: "(52:30) ",
			ctx
		});

		return block;
	}

	// (36:2) {#if type === 'radio'}
	function create_if_block_1$3(ctx) {
		let input;
		let binding_group;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[11],
			{ class: /*inputClasses*/ ctx[9] },
			{ id: /*idFor*/ ctx[8] },
			{ type: "radio" },
			{ disabled: /*disabled*/ ctx[3] },
			{ name: /*name*/ ctx[5] },
			{ __value: /*value*/ ctx[7] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		binding_group = init_binding_group(/*$$binding_groups*/ ctx[34][0]);

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$i, 36, 4, 912);
				binding_group.p(input);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				input.checked = input.__value === /*group*/ ctx[1];
				/*input_binding*/ ctx[35](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "change", /*input_change_handler*/ ctx[33]),
						listen_dev(input, "blur", /*blur_handler*/ ctx[21], false, false, false, false),
						listen_dev(input, "change", /*change_handler*/ ctx[22], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler*/ ctx[23], false, false, false, false),
						listen_dev(input, "input", /*input_handler*/ ctx[24], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 2048 && /*$$restProps*/ ctx[11],
					dirty[0] & /*inputClasses*/ 512 && { class: /*inputClasses*/ ctx[9] },
					dirty[0] & /*idFor*/ 256 && { id: /*idFor*/ ctx[8] },
					{ type: "radio" },
					dirty[0] & /*disabled*/ 8 && { disabled: /*disabled*/ ctx[3] },
					dirty[0] & /*name*/ 32 && { name: /*name*/ ctx[5] },
					dirty[0] & /*value*/ 128 && { __value: /*value*/ ctx[7] }
				]));

				if (dirty[0] & /*group*/ 2) {
					input.checked = input.__value === /*group*/ ctx[1];
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding*/ ctx[35](null);
				binding_group.r();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$3.name,
			type: "if",
			source: "(36:2) {#if type === 'radio'}",
			ctx
		});

		return block;
	}

	// (85:2) {#if label}
	function create_if_block$6(ctx) {
		let label_1;
		let current;
		const label_slot_template = /*#slots*/ ctx[20].label;
		const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[19], get_label_slot_context);
		const label_slot_or_fallback = label_slot || fallback_block$1(ctx);

		const block = {
			c: function create() {
				label_1 = element("label");
				if (label_slot_or_fallback) label_slot_or_fallback.c();
				attr_dev(label_1, "class", "form-check-label");
				attr_dev(label_1, "for", /*idFor*/ ctx[8]);
				add_location(label_1, file$i, 85, 4, 1732);
			},
			m: function mount(target, anchor) {
				insert_dev(target, label_1, anchor);

				if (label_slot_or_fallback) {
					label_slot_or_fallback.m(label_1, null);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (label_slot) {
					if (label_slot.p && (!current || dirty[0] & /*$$scope*/ 524288)) {
						update_slot_base(
							label_slot,
							label_slot_template,
							ctx,
							/*$$scope*/ ctx[19],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[19])
							: get_slot_changes(label_slot_template, /*$$scope*/ ctx[19], dirty, get_label_slot_changes),
							get_label_slot_context
						);
					}
				} else {
					if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty[0] & /*label*/ 16)) {
						label_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
					}
				}

				if (!current || dirty[0] & /*idFor*/ 256) {
					attr_dev(label_1, "for", /*idFor*/ ctx[8]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(label_slot_or_fallback, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(label_slot_or_fallback, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(label_1);
				}

				if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$6.name,
			type: "if",
			source: "(85:2) {#if label}",
			ctx
		});

		return block;
	}

	// (87:25) {label}
	function fallback_block$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text(/*label*/ ctx[4]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*label*/ 16) set_data_dev(t, /*label*/ ctx[4]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: fallback_block$1.name,
			type: "fallback",
			source: "(87:25) {label}",
			ctx
		});

		return block;
	}

	function create_fragment$j(ctx) {
		let div;
		let t;
		let current;

		function select_block_type(ctx, dirty) {
			if (/*type*/ ctx[6] === 'radio') return create_if_block_1$3;
			if (/*type*/ ctx[6] === 'switch') return create_if_block_2$2;
			return create_else_block$5;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let if_block1 = /*label*/ ctx[4] && create_if_block$6(ctx);

		const block = {
			c: function create() {
				div = element("div");
				if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				attr_dev(div, "class", /*classes*/ ctx[10]);
				add_location(div, file$i, 34, 0, 861);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				if_block0.m(div, null);
				append_dev(div, t);
				if (if_block1) if_block1.m(div, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(div, t);
					}
				}

				if (/*label*/ ctx[4]) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty[0] & /*label*/ 16) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block$6(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(div, null);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}

				if (!current || dirty[0] & /*classes*/ 1024) {
					attr_dev(div, "class", /*classes*/ ctx[10]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block1);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block1);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if_block0.d();
				if (if_block1) if_block1.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$j.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$j($$self, $$props, $$invalidate) {
		let classes;
		let inputClasses;
		let idFor;

		const omit_props_names = [
			"class","checked","disabled","group","id","inline","inner","invalid","label","name","reverse","size","type","valid","value"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('FormCheck', slots, ['label']);
		let { class: className = '' } = $$props;
		let { checked = false } = $$props;
		let { disabled = false } = $$props;
		let { group = undefined } = $$props;
		let { id = undefined } = $$props;
		let { inline = false } = $$props;
		let { inner = undefined } = $$props;
		let { invalid = false } = $$props;
		let { label = '' } = $$props;
		let { name = '' } = $$props;
		let { reverse = false } = $$props;
		let { size = '' } = $$props;
		let { type = 'checkbox' } = $$props;
		let { valid = false } = $$props;
		let { value = undefined } = $$props;
		const $$binding_groups = [[]];

		function blur_handler(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function input_change_handler() {
			group = this.__value;
			$$invalidate(1, group);
		}

		function input_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(2, inner);
			});
		}

		function input_change_handler_1() {
			checked = this.checked;
			$$invalidate(0, checked);
		}

		function input_binding_1($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(2, inner);
			});
		}

		function input_change_handler_2() {
			checked = this.checked;
			$$invalidate(0, checked);
		}

		function input_binding_2($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(2, inner);
			});
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(12, className = $$new_props.class);
			if ('checked' in $$new_props) $$invalidate(0, checked = $$new_props.checked);
			if ('disabled' in $$new_props) $$invalidate(3, disabled = $$new_props.disabled);
			if ('group' in $$new_props) $$invalidate(1, group = $$new_props.group);
			if ('id' in $$new_props) $$invalidate(13, id = $$new_props.id);
			if ('inline' in $$new_props) $$invalidate(14, inline = $$new_props.inline);
			if ('inner' in $$new_props) $$invalidate(2, inner = $$new_props.inner);
			if ('invalid' in $$new_props) $$invalidate(15, invalid = $$new_props.invalid);
			if ('label' in $$new_props) $$invalidate(4, label = $$new_props.label);
			if ('name' in $$new_props) $$invalidate(5, name = $$new_props.name);
			if ('reverse' in $$new_props) $$invalidate(16, reverse = $$new_props.reverse);
			if ('size' in $$new_props) $$invalidate(17, size = $$new_props.size);
			if ('type' in $$new_props) $$invalidate(6, type = $$new_props.type);
			if ('valid' in $$new_props) $$invalidate(18, valid = $$new_props.valid);
			if ('value' in $$new_props) $$invalidate(7, value = $$new_props.value);
			if ('$$scope' in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			className,
			checked,
			disabled,
			group,
			id,
			inline,
			inner,
			invalid,
			label,
			name,
			reverse,
			size,
			type,
			valid,
			value,
			idFor,
			inputClasses,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(12, className = $$new_props.className);
			if ('checked' in $$props) $$invalidate(0, checked = $$new_props.checked);
			if ('disabled' in $$props) $$invalidate(3, disabled = $$new_props.disabled);
			if ('group' in $$props) $$invalidate(1, group = $$new_props.group);
			if ('id' in $$props) $$invalidate(13, id = $$new_props.id);
			if ('inline' in $$props) $$invalidate(14, inline = $$new_props.inline);
			if ('inner' in $$props) $$invalidate(2, inner = $$new_props.inner);
			if ('invalid' in $$props) $$invalidate(15, invalid = $$new_props.invalid);
			if ('label' in $$props) $$invalidate(4, label = $$new_props.label);
			if ('name' in $$props) $$invalidate(5, name = $$new_props.name);
			if ('reverse' in $$props) $$invalidate(16, reverse = $$new_props.reverse);
			if ('size' in $$props) $$invalidate(17, size = $$new_props.size);
			if ('type' in $$props) $$invalidate(6, type = $$new_props.type);
			if ('valid' in $$props) $$invalidate(18, valid = $$new_props.valid);
			if ('value' in $$props) $$invalidate(7, value = $$new_props.value);
			if ('idFor' in $$props) $$invalidate(8, idFor = $$new_props.idFor);
			if ('inputClasses' in $$props) $$invalidate(9, inputClasses = $$new_props.inputClasses);
			if ('classes' in $$props) $$invalidate(10, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty[0] & /*className, reverse, type, inline, size*/ 217152) {
				$$invalidate(10, classes = classnames(className, 'form-check', {
					'form-check-reverse': reverse,
					'form-switch': type === 'switch',
					'form-check-inline': inline,
					[`form-control-${size}`]: size
				}));
			}

			if ($$self.$$.dirty[0] & /*invalid, valid*/ 294912) {
				$$invalidate(9, inputClasses = classnames('form-check-input', { 'is-invalid': invalid, 'is-valid': valid }));
			}

			if ($$self.$$.dirty[0] & /*id, label*/ 8208) {
				$$invalidate(8, idFor = id || label);
			}
		};

		return [
			checked,
			group,
			inner,
			disabled,
			label,
			name,
			type,
			value,
			idFor,
			inputClasses,
			classes,
			$$restProps,
			className,
			id,
			inline,
			invalid,
			reverse,
			size,
			valid,
			$$scope,
			slots,
			blur_handler,
			change_handler,
			focus_handler,
			input_handler,
			blur_handler_1,
			change_handler_1,
			focus_handler_1,
			input_handler_1,
			blur_handler_2,
			change_handler_2,
			focus_handler_2,
			input_handler_2,
			input_change_handler,
			$$binding_groups,
			input_binding,
			input_change_handler_1,
			input_binding_1,
			input_change_handler_2,
			input_binding_2
		];
	}

	class FormCheck extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance$j,
				create_fragment$j,
				safe_not_equal,
				{
					class: 12,
					checked: 0,
					disabled: 3,
					group: 1,
					id: 13,
					inline: 14,
					inner: 2,
					invalid: 15,
					label: 4,
					name: 5,
					reverse: 16,
					size: 17,
					type: 6,
					valid: 18,
					value: 7
				},
				null,
				[-1, -1]
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "FormCheck",
				options,
				id: create_fragment$j.name
			});
		}

		get class() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get checked() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set checked(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get disabled() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set disabled(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get group() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set group(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get id() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set id(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get inline() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set inline(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get inner() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set inner(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get invalid() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set invalid(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get label() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set label(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get name() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set name(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get reverse() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set reverse(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get type() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set type(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get valid() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set valid(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get value() {
			throw new Error("<FormCheck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<FormCheck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/FormFeedback/FormFeedback.svelte generated by Svelte v4.2.19 */
	const file$h = "node_modules/@sveltestrap/sveltestrap/dist/FormFeedback/FormFeedback.svelte";

	function create_fragment$i(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[6].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
		let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				set_attributes(div, div_data);
				add_location(div, file$h, 16, 0, 355);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[5],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
							null
						);
					}
				}

				set_attributes(div, div_data = get_spread_update(div_levels, [
					dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
					(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$i.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$i($$self, $$props, $$invalidate) {
		const omit_props_names = ["class","valid","tooltip"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('FormFeedback', slots, ['default']);
		let { class: className = '' } = $$props;
		let { valid = undefined } = $$props;
		let { tooltip = false } = $$props;
		let classes;

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
			if ('valid' in $$new_props) $$invalidate(3, valid = $$new_props.valid);
			if ('tooltip' in $$new_props) $$invalidate(4, tooltip = $$new_props.tooltip);
			if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			className,
			valid,
			tooltip,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(2, className = $$new_props.className);
			if ('valid' in $$props) $$invalidate(3, valid = $$new_props.valid);
			if ('tooltip' in $$props) $$invalidate(4, tooltip = $$new_props.tooltip);
			if ('classes' in $$props) $$invalidate(0, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*tooltip, className, valid*/ 28) {
				{
					const validMode = tooltip ? 'tooltip' : 'feedback';
					$$invalidate(0, classes = classnames(className, valid ? `valid-${validMode}` : `invalid-${validMode}`));
				}
			}
		};

		return [classes, $$restProps, className, valid, tooltip, $$scope, slots];
	}

	class FormFeedback extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$i, create_fragment$i, safe_not_equal, { class: 2, valid: 3, tooltip: 4 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "FormFeedback",
				options,
				id: create_fragment$i.name
			});
		}

		get class() {
			throw new Error("<FormFeedback>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<FormFeedback>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get valid() {
			throw new Error("<FormFeedback>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set valid(value) {
			throw new Error("<FormFeedback>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get tooltip() {
			throw new Error("<FormFeedback>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set tooltip(value) {
			throw new Error("<FormFeedback>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/InlineContainer/InlineContainer.svelte generated by Svelte v4.2.19 */
	const file$g = "node_modules/@sveltestrap/sveltestrap/dist/InlineContainer/InlineContainer.svelte";

	function create_fragment$h(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[1].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				add_location(div, file$g, 4, 0, 68);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[0],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$h.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$h($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('InlineContainer', slots, ['default']);
		let x = 'wtf svelte?'; // eslint-disable-line
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InlineContainer> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ x });

		$$self.$inject_state = $$props => {
			if ('x' in $$props) x = $$props.x;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [$$scope, slots];
	}

	class InlineContainer extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "InlineContainer",
				options,
				id: create_fragment$h.name
			});
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Input/Input.svelte generated by Svelte v4.2.19 */
	const file$f = "node_modules/@sveltestrap/sveltestrap/dist/Input/Input.svelte";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[132] = list[i];
		return child_ctx;
	}

	// (453:40) 
	function create_if_block_10(ctx) {
		let select;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[28].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[131], null);

		let select_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ name: /*name*/ ctx[15] },
			{ disabled: /*disabled*/ ctx[8] },
			{ readonly: /*readonly*/ ctx[17] }
		];

		let select_data = {};

		for (let i = 0; i < select_levels.length; i += 1) {
			select_data = assign(select_data, select_levels[i]);
		}

		const block = {
			c: function create() {
				select = element("select");
				if (default_slot) default_slot.c();
				set_attributes(select, select_data);
				if (/*value*/ ctx[6] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[129].call(select));
				add_location(select, file$f, 453, 2, 9408);
			},
			m: function mount(target, anchor) {
				insert_dev(target, select, anchor);

				if (default_slot) {
					default_slot.m(select, null);
				}

				'value' in select_data && (select_data.multiple ? select_options : select_option)(select, select_data.value);
				if (select.autofocus) select.focus();
				select_option(select, /*value*/ ctx[6], true);
				/*select_binding*/ ctx[130](select);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(select, "change", /*select_change_handler*/ ctx[129]),
						listen_dev(select, "blur", /*blur_handler_8*/ ctx[99], false, false, false, false),
						listen_dev(select, "click", /*click_handler_7*/ ctx[100], false, false, false, false),
						listen_dev(select, "change", /*change_handler_8*/ ctx[101], false, false, false, false),
						listen_dev(select, "focus", /*focus_handler_8*/ ctx[102], false, false, false, false),
						listen_dev(select, "input", /*input_handler_8*/ ctx[103], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty[4] & /*$$scope*/ 128)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[131],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[131])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[131], dirty, null),
							null
						);
					}
				}

				set_attributes(select, select_data = get_spread_update(select_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					(!current || dirty[0] & /*theme*/ 524288) && { "data-bs-theme": /*theme*/ ctx[19] },
					(!current || dirty[0] & /*classes*/ 8388608) && { class: /*classes*/ ctx[23] },
					(!current || dirty[0] & /*name*/ 32768) && { name: /*name*/ ctx[15] },
					(!current || dirty[0] & /*disabled*/ 256) && { disabled: /*disabled*/ ctx[8] },
					(!current || dirty[0] & /*readonly*/ 131072) && { readonly: /*readonly*/ ctx[17] }
				]));

				if (dirty[0] & /*$$restProps, theme, classes, name, disabled, readonly*/ 42631424 && 'value' in select_data) (select_data.multiple ? select_options : select_option)(select, select_data.value);

				if (dirty[0] & /*value*/ 64) {
					select_option(select, /*value*/ ctx[6]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(select);
				}

				if (default_slot) default_slot.d(detaching);
				/*select_binding*/ ctx[130](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_10.name,
			type: "if",
			source: "(453:40) ",
			ctx
		});

		return block;
	}

	// (431:29) 
	function create_if_block_9(ctx) {
		let textarea;
		let mounted;
		let dispose;

		let textarea_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ disabled: /*disabled*/ ctx[8] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] }
		];

		let textarea_data = {};

		for (let i = 0; i < textarea_levels.length; i += 1) {
			textarea_data = assign(textarea_data, textarea_levels[i]);
		}

		const block = {
			c: function create() {
				textarea = element("textarea");
				set_attributes(textarea, textarea_data);
				add_location(textarea, file$f, 431, 2, 9046);
			},
			m: function mount(target, anchor) {
				insert_dev(target, textarea, anchor);
				if (textarea.autofocus) textarea.focus();
				set_input_value(textarea, /*value*/ ctx[6]);
				/*textarea_binding*/ ctx[128](textarea);

				if (!mounted) {
					dispose = [
						listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[127]),
						listen_dev(textarea, "blur", /*blur_handler_7*/ ctx[89], false, false, false, false),
						listen_dev(textarea, "change", /*change_handler_7*/ ctx[90], false, false, false, false),
						listen_dev(textarea, "click", /*click_handler_6*/ ctx[91], false, false, false, false),
						listen_dev(textarea, "focus", /*focus_handler_7*/ ctx[92], false, false, false, false),
						listen_dev(textarea, "input", /*input_handler_7*/ ctx[93], false, false, false, false),
						listen_dev(textarea, "keydown", /*keydown_handler_7*/ ctx[94], false, false, false, false),
						listen_dev(textarea, "keypress", /*keypress_handler_7*/ ctx[95], false, false, false, false),
						listen_dev(textarea, "keyup", /*keyup_handler_7*/ ctx[96], false, false, false, false),
						listen_dev(textarea, "mousedown", /*mousedown_handler_7*/ ctx[97], false, false, false, false),
						listen_dev(textarea, "mouseup", /*mouseup_handler_7*/ ctx[98], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(textarea, textarea_data = get_spread_update(textarea_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] }
				]));

				if (dirty[0] & /*value*/ 64) {
					set_input_value(textarea, /*value*/ ctx[6]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(textarea);
				}

				/*textarea_binding*/ ctx[128](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_9.name,
			type: "if",
			source: "(431:29) ",
			ctx
		});

		return block;
	}

	// (250:0) {#if tag === 'input'}
	function create_if_block_2$1(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;

		const if_block_creators = [
			create_if_block_3$1,
			create_if_block_4$1,
			create_if_block_5,
			create_if_block_6,
			create_if_block_7,
			create_if_block_8,
			create_else_block_1
		];

		const if_blocks = [];

		function select_block_type_1(ctx, dirty) {
			if (/*type*/ ctx[20] === 'text' || /*type*/ ctx[20] === 'password' || /*type*/ ctx[20] === 'search' || /*type*/ ctx[20] === 'tel' || /*type*/ ctx[20] === 'url') return 0;
			if (/*type*/ ctx[20] === 'color') return 1;
			if (/*type*/ ctx[20] === 'email') return 2;
			if (/*type*/ ctx[20] === 'file') return 3;
			if (/*type*/ ctx[20] === 'checkbox' || /*type*/ ctx[20] === 'radio' || /*type*/ ctx[20] === 'switch') return 4;
			if (/*type*/ ctx[20] === 'date' || /*type*/ ctx[20] === 'datetime' || /*type*/ ctx[20] === 'datetime-local' || /*type*/ ctx[20] === 'month' || /*type*/ ctx[20] === 'number' || /*type*/ ctx[20] === 'time' || /*type*/ ctx[20] === 'range' || /*type*/ ctx[20] === 'week') return 5;
			return 6;
		}

		current_block_type_index = select_block_type_1(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_1(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$1.name,
			type: "if",
			source: "(250:0) {#if tag === 'input'}",
			ctx
		});

		return block;
	}

	// (406:2) {:else}
	function create_else_block_1(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ type: /*type*/ ctx[20] },
			{ name: /*name*/ ctx[15] },
			{ disabled: /*disabled*/ ctx[8] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] },
			{ value: /*value*/ ctx[6] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 406, 4, 8605);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);

				if ('value' in input_data) {
					input.value = input_data.value;
				}

				if (input.autofocus) input.focus();

				if (!mounted) {
					dispose = [
						listen_dev(input, "blur", /*blur_handler_6*/ ctx[79], false, false, false, false),
						listen_dev(input, "change", /*handleInput*/ ctx[24], false, false, false, false),
						listen_dev(input, "change", /*change_handler_6*/ ctx[80], false, false, false, false),
						listen_dev(input, "click", /*click_handler_5*/ ctx[81], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_6*/ ctx[82], false, false, false, false),
						listen_dev(input, "input", /*handleInput*/ ctx[24], false, false, false, false),
						listen_dev(input, "input", /*input_handler_6*/ ctx[83], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler_6*/ ctx[84], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler_6*/ ctx[85], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler_6*/ ctx[86], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler_6*/ ctx[87], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler_6*/ ctx[88], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					dirty[0] & /*type*/ 1048576 && { type: /*type*/ ctx[20] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] },
					dirty[0] & /*value*/ 64 && input.value !== /*value*/ ctx[6] && { value: /*value*/ ctx[6] }
				]));

				if ('value' in input_data) {
					input.value = input_data.value;
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block_1.name,
			type: "else",
			source: "(406:2) {:else}",
			ctx
		});

		return block;
	}

	// (379:179) 
	function create_if_block_8(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ type: /*type*/ ctx[20] },
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ disabled: /*disabled*/ ctx[8] },
			{ max: /*max*/ ctx[12] },
			{ min: /*min*/ ctx[13] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 379, 4, 8132);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				set_input_value(input, /*value*/ ctx[6]);
				/*input_binding_4*/ ctx[126](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler_3*/ ctx[125]),
						listen_dev(input, "blur", /*blur_handler_5*/ ctx[69], false, false, false, false),
						listen_dev(input, "change", /*handleInput*/ ctx[24], false, false, false, false),
						listen_dev(input, "change", /*change_handler_5*/ ctx[70], false, false, false, false),
						listen_dev(input, "click", /*click_handler_4*/ ctx[71], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_5*/ ctx[72], false, false, false, false),
						listen_dev(input, "input", /*handleInput*/ ctx[24], false, false, false, false),
						listen_dev(input, "input", /*input_handler_5*/ ctx[73], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler_5*/ ctx[74], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler_5*/ ctx[75], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler_5*/ ctx[76], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler_5*/ ctx[77], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler_5*/ ctx[78], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*type*/ 1048576 && { type: /*type*/ ctx[20] },
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*max*/ 4096 && { max: /*max*/ ctx[12] },
					dirty[0] & /*min*/ 8192 && { min: /*min*/ ctx[13] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] }
				]));

				if (dirty[0] & /*value*/ 64 && input.value !== /*value*/ ctx[6]) {
					set_input_value(input, /*value*/ ctx[6]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_4*/ ctx[126](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_8.name,
			type: "if",
			source: "(379:179) ",
			ctx
		});

		return block;
	}

	// (350:73) 
	function create_if_block_7(ctx) {
		let formcheck;
		let updating_checked;
		let updating_inner;
		let updating_group;
		let updating_value;
		let current;

		const formcheck_spread_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*className*/ ctx[7] },
			{ size: /*bsSize*/ ctx[0] },
			{ type: /*type*/ ctx[20] },
			{ disabled: /*disabled*/ ctx[8] },
			{ invalid: /*invalid*/ ctx[10] },
			{ label: /*label*/ ctx[11] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ reverse: /*reverse*/ ctx[18] },
			{ readonly: /*readonly*/ ctx[17] },
			{ valid: /*valid*/ ctx[21] }
		];

		function formcheck_checked_binding(value) {
			/*formcheck_checked_binding*/ ctx[112](value);
		}

		function formcheck_inner_binding(value) {
			/*formcheck_inner_binding*/ ctx[113](value);
		}

		function formcheck_group_binding(value) {
			/*formcheck_group_binding*/ ctx[114](value);
		}

		function formcheck_value_binding(value) {
			/*formcheck_value_binding*/ ctx[115](value);
		}

		let formcheck_props = {};

		for (let i = 0; i < formcheck_spread_levels.length; i += 1) {
			formcheck_props = assign(formcheck_props, formcheck_spread_levels[i]);
		}

		if (/*checked*/ ctx[2] !== void 0) {
			formcheck_props.checked = /*checked*/ ctx[2];
		}

		if (/*inner*/ ctx[5] !== void 0) {
			formcheck_props.inner = /*inner*/ ctx[5];
		}

		if (/*group*/ ctx[4] !== void 0) {
			formcheck_props.group = /*group*/ ctx[4];
		}

		if (/*value*/ ctx[6] !== void 0) {
			formcheck_props.value = /*value*/ ctx[6];
		}

		formcheck = new FormCheck({ props: formcheck_props, $$inline: true });
		binding_callbacks.push(() => bind$1(formcheck, 'checked', formcheck_checked_binding));
		binding_callbacks.push(() => bind$1(formcheck, 'inner', formcheck_inner_binding));
		binding_callbacks.push(() => bind$1(formcheck, 'group', formcheck_group_binding));
		binding_callbacks.push(() => bind$1(formcheck, 'value', formcheck_value_binding));
		formcheck.$on("blur", /*blur_handler_4*/ ctx[116]);
		formcheck.$on("change", /*change_handler_4*/ ctx[117]);
		formcheck.$on("focus", /*focus_handler_4*/ ctx[118]);
		formcheck.$on("input", /*input_handler_4*/ ctx[119]);
		formcheck.$on("keydown", /*keydown_handler_4*/ ctx[120]);
		formcheck.$on("keypress", /*keypress_handler_4*/ ctx[121]);
		formcheck.$on("keyup", /*keyup_handler_4*/ ctx[122]);
		formcheck.$on("mousedown", /*mousedown_handler_4*/ ctx[123]);
		formcheck.$on("mouseup", /*mouseup_handler_4*/ ctx[124]);

		const block = {
			c: function create() {
				create_component(formcheck.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(formcheck, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const formcheck_changes = (dirty[0] & /*$$restProps, theme, className, bsSize, type, disabled, invalid, label, name, placeholder, reverse, readonly, valid*/ 37719425)
				? get_spread_update(formcheck_spread_levels, [
						dirty[0] & /*$$restProps*/ 33554432 && get_spread_object(/*$$restProps*/ ctx[25]),
						dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
						dirty[0] & /*className*/ 128 && { class: /*className*/ ctx[7] },
						dirty[0] & /*bsSize*/ 1 && { size: /*bsSize*/ ctx[0] },
						dirty[0] & /*type*/ 1048576 && { type: /*type*/ ctx[20] },
						dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
						dirty[0] & /*invalid*/ 1024 && { invalid: /*invalid*/ ctx[10] },
						dirty[0] & /*label*/ 2048 && { label: /*label*/ ctx[11] },
						dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
						dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
						dirty[0] & /*reverse*/ 262144 && { reverse: /*reverse*/ ctx[18] },
						dirty[0] & /*readonly*/ 131072 && { readonly: /*readonly*/ ctx[17] },
						dirty[0] & /*valid*/ 2097152 && { valid: /*valid*/ ctx[21] }
					])
				: {};

				if (!updating_checked && dirty[0] & /*checked*/ 4) {
					updating_checked = true;
					formcheck_changes.checked = /*checked*/ ctx[2];
					add_flush_callback(() => updating_checked = false);
				}

				if (!updating_inner && dirty[0] & /*inner*/ 32) {
					updating_inner = true;
					formcheck_changes.inner = /*inner*/ ctx[5];
					add_flush_callback(() => updating_inner = false);
				}

				if (!updating_group && dirty[0] & /*group*/ 16) {
					updating_group = true;
					formcheck_changes.group = /*group*/ ctx[4];
					add_flush_callback(() => updating_group = false);
				}

				if (!updating_value && dirty[0] & /*value*/ 64) {
					updating_value = true;
					formcheck_changes.value = /*value*/ ctx[6];
					add_flush_callback(() => updating_value = false);
				}

				formcheck.$set(formcheck_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(formcheck.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(formcheck.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(formcheck, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_7.name,
			type: "if",
			source: "(350:73) ",
			ctx
		});

		return block;
	}

	// (323:28) 
	function create_if_block_6(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ type: "file" },
			{ disabled: /*disabled*/ ctx[8] },
			{ invalid: /*invalid*/ ctx[10] },
			{ multiple: /*multiple*/ ctx[14] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] },
			{ valid: /*valid*/ ctx[21] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 323, 4, 6963);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				/*input_binding_3*/ ctx[111](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "change", /*input_change_handler*/ ctx[110]),
						listen_dev(input, "blur", /*blur_handler_3*/ ctx[59], false, false, false, false),
						listen_dev(input, "change", /*change_handler_3*/ ctx[60], false, false, false, false),
						listen_dev(input, "click", /*click_handler_3*/ ctx[61], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_3*/ ctx[62], false, false, false, false),
						listen_dev(input, "input", /*input_handler_3*/ ctx[63], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler_3*/ ctx[64], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler_3*/ ctx[65], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler_3*/ ctx[66], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler_3*/ ctx[67], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler_3*/ ctx[68], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					{ type: "file" },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*invalid*/ 1024 && { invalid: /*invalid*/ ctx[10] },
					dirty[0] & /*multiple*/ 16384 && { multiple: /*multiple*/ ctx[14] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] },
					dirty[0] & /*valid*/ 2097152 && { valid: /*valid*/ ctx[21] }
				]));
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_3*/ ctx[111](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_6.name,
			type: "if",
			source: "(323:28) ",
			ctx
		});

		return block;
	}

	// (298:29) 
	function create_if_block_5(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ type: "email" },
			{ disabled: /*disabled*/ ctx[8] },
			{ multiple: /*multiple*/ ctx[14] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] },
			{ size: /*size*/ ctx[1] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 298, 4, 6525);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				set_input_value(input, /*value*/ ctx[6]);
				/*input_binding_2*/ ctx[109](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler_2*/ ctx[108]),
						listen_dev(input, "blur", /*blur_handler_2*/ ctx[49], false, false, false, false),
						listen_dev(input, "change", /*change_handler_2*/ ctx[50], false, false, false, false),
						listen_dev(input, "click", /*click_handler_2*/ ctx[51], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_2*/ ctx[52], false, false, false, false),
						listen_dev(input, "input", /*input_handler_2*/ ctx[53], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler_2*/ ctx[54], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler_2*/ ctx[55], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler_2*/ ctx[56], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler_2*/ ctx[57], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler_2*/ ctx[58], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					{ type: "email" },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*multiple*/ 16384 && { multiple: /*multiple*/ ctx[14] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] },
					dirty[0] & /*size*/ 2 && { size: /*size*/ ctx[1] }
				]));

				if (dirty[0] & /*value*/ 64 && input.value !== /*value*/ ctx[6]) {
					set_input_value(input, /*value*/ ctx[6]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_2*/ ctx[109](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_5.name,
			type: "if",
			source: "(298:29) ",
			ctx
		});

		return block;
	}

	// (275:29) 
	function create_if_block_4$1(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ type: "color" },
			{ disabled: /*disabled*/ ctx[8] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 275, 4, 6116);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				set_input_value(input, /*value*/ ctx[6]);
				/*input_binding_1*/ ctx[107](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler_1*/ ctx[106]),
						listen_dev(input, "blur", /*blur_handler_1*/ ctx[39], false, false, false, false),
						listen_dev(input, "change", /*change_handler_1*/ ctx[40], false, false, false, false),
						listen_dev(input, "click", /*click_handler_1*/ ctx[41], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler_1*/ ctx[42], false, false, false, false),
						listen_dev(input, "input", /*input_handler_1*/ ctx[43], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler_1*/ ctx[44], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler_1*/ ctx[45], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler_1*/ ctx[46], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler_1*/ ctx[47], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler_1*/ ctx[48], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					{ type: "color" },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] }
				]));

				if (dirty[0] & /*value*/ 64) {
					set_input_value(input, /*value*/ ctx[6]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding_1*/ ctx[107](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4$1.name,
			type: "if",
			source: "(275:29) ",
			ctx
		});

		return block;
	}

	// (251:2) {#if type === 'text' || type === 'password' || type === 'search' || type === 'tel' || type === 'url'}
	function create_if_block_3$1(ctx) {
		let input;
		let mounted;
		let dispose;

		let input_levels = [
			/*$$restProps*/ ctx[25],
			{ type: /*type*/ ctx[20] },
			{ "data-bs-theme": /*theme*/ ctx[19] },
			{ class: /*classes*/ ctx[23] },
			{ disabled: /*disabled*/ ctx[8] },
			{ name: /*name*/ ctx[15] },
			{ placeholder: /*placeholder*/ ctx[16] },
			{ readOnly: /*readonly*/ ctx[17] },
			{ size: /*size*/ ctx[1] }
		];

		let input_data = {};

		for (let i = 0; i < input_levels.length; i += 1) {
			input_data = assign(input_data, input_levels[i]);
		}

		const block = {
			c: function create() {
				input = element("input");
				set_attributes(input, input_data);
				add_location(input, file$f, 251, 4, 5693);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				if (input.autofocus) input.focus();
				set_input_value(input, /*value*/ ctx[6]);
				/*input_binding*/ ctx[105](input);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler*/ ctx[104]),
						listen_dev(input, "blur", /*blur_handler*/ ctx[29], false, false, false, false),
						listen_dev(input, "change", /*change_handler*/ ctx[30], false, false, false, false),
						listen_dev(input, "click", /*click_handler*/ ctx[31], false, false, false, false),
						listen_dev(input, "focus", /*focus_handler*/ ctx[32], false, false, false, false),
						listen_dev(input, "input", /*input_handler*/ ctx[33], false, false, false, false),
						listen_dev(input, "keydown", /*keydown_handler*/ ctx[34], false, false, false, false),
						listen_dev(input, "keypress", /*keypress_handler*/ ctx[35], false, false, false, false),
						listen_dev(input, "keyup", /*keyup_handler*/ ctx[36], false, false, false, false),
						listen_dev(input, "mousedown", /*mousedown_handler*/ ctx[37], false, false, false, false),
						listen_dev(input, "mouseup", /*mouseup_handler*/ ctx[38], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(input, input_data = get_spread_update(input_levels, [
					dirty[0] & /*$$restProps*/ 33554432 && /*$$restProps*/ ctx[25],
					dirty[0] & /*type*/ 1048576 && { type: /*type*/ ctx[20] },
					dirty[0] & /*theme*/ 524288 && { "data-bs-theme": /*theme*/ ctx[19] },
					dirty[0] & /*classes*/ 8388608 && { class: /*classes*/ ctx[23] },
					dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
					dirty[0] & /*name*/ 32768 && { name: /*name*/ ctx[15] },
					dirty[0] & /*placeholder*/ 65536 && { placeholder: /*placeholder*/ ctx[16] },
					dirty[0] & /*readonly*/ 131072 && { readOnly: /*readonly*/ ctx[17] },
					dirty[0] & /*size*/ 2 && { size: /*size*/ ctx[1] }
				]));

				if (dirty[0] & /*value*/ 64 && input.value !== /*value*/ ctx[6]) {
					set_input_value(input, /*value*/ ctx[6]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
				}

				/*input_binding*/ ctx[105](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3$1.name,
			type: "if",
			source: "(251:2) {#if type === 'text' || type === 'password' || type === 'search' || type === 'tel' || type === 'url'}",
			ctx
		});

		return block;
	}

	// (473:0) {#if feedback}
	function create_if_block$5(ctx) {
		let show_if;
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block_1$2, create_else_block$4];
		const if_blocks = [];

		function select_block_type_2(ctx, dirty) {
			if (dirty[0] & /*feedback*/ 512) show_if = null;
			if (show_if == null) show_if = !!Array.isArray(/*feedback*/ ctx[9]);
			if (show_if) return 0;
			return 1;
		}

		current_block_type_index = select_block_type_2(ctx, [-1, -1, -1, -1, -1]);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_2(ctx, dirty);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$5.name,
			type: "if",
			source: "(473:0) {#if feedback}",
			ctx
		});

		return block;
	}

	// (478:2) {:else}
	function create_else_block$4(ctx) {
		let formfeedback;
		let current;

		formfeedback = new FormFeedback({
				props: {
					valid: /*valid*/ ctx[21],
					$$slots: { default: [create_default_slot_1$4] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(formfeedback.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(formfeedback, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const formfeedback_changes = {};
				if (dirty[0] & /*valid*/ 2097152) formfeedback_changes.valid = /*valid*/ ctx[21];

				if (dirty[0] & /*feedback*/ 512 | dirty[4] & /*$$scope*/ 128) {
					formfeedback_changes.$$scope = { dirty, ctx };
				}

				formfeedback.$set(formfeedback_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(formfeedback.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(formfeedback.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(formfeedback, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$4.name,
			type: "else",
			source: "(478:2) {:else}",
			ctx
		});

		return block;
	}

	// (474:2) {#if Array.isArray(feedback)}
	function create_if_block_1$2(ctx) {
		let each_1_anchor;
		let current;
		let each_value = ensure_array_like_dev(/*feedback*/ ctx[9]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m: function mount(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*valid, feedback*/ 2097664) {
					each_value = ensure_array_like_dev(/*feedback*/ ctx[9]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$2.name,
			type: "if",
			source: "(474:2) {#if Array.isArray(feedback)}",
			ctx
		});

		return block;
	}

	// (479:4) <FormFeedback {valid}>
	function create_default_slot_1$4(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text(/*feedback*/ ctx[9]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*feedback*/ 512) set_data_dev(t, /*feedback*/ ctx[9]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$4.name,
			type: "slot",
			source: "(479:4) <FormFeedback {valid}>",
			ctx
		});

		return block;
	}

	// (476:6) <FormFeedback {valid}>
	function create_default_slot$5(ctx) {
		let t_value = /*msg*/ ctx[132] + "";
		let t;

		const block = {
			c: function create() {
				t = text(t_value);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*feedback*/ 512 && t_value !== (t_value = /*msg*/ ctx[132] + "")) set_data_dev(t, t_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$5.name,
			type: "slot",
			source: "(476:6) <FormFeedback {valid}>",
			ctx
		});

		return block;
	}

	// (475:4) {#each feedback as msg}
	function create_each_block$2(ctx) {
		let formfeedback;
		let current;

		formfeedback = new FormFeedback({
				props: {
					valid: /*valid*/ ctx[21],
					$$slots: { default: [create_default_slot$5] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(formfeedback.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(formfeedback, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const formfeedback_changes = {};
				if (dirty[0] & /*valid*/ 2097152) formfeedback_changes.valid = /*valid*/ ctx[21];

				if (dirty[0] & /*feedback*/ 512 | dirty[4] & /*$$scope*/ 128) {
					formfeedback_changes.$$scope = { dirty, ctx };
				}

				formfeedback.$set(formfeedback_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(formfeedback.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(formfeedback.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(formfeedback, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$2.name,
			type: "each",
			source: "(475:4) {#each feedback as msg}",
			ctx
		});

		return block;
	}

	function create_fragment$g(ctx) {
		let current_block_type_index;
		let if_block0;
		let t;
		let if_block1_anchor;
		let current;
		const if_block_creators = [create_if_block_2$1, create_if_block_9, create_if_block_10];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*tag*/ ctx[22] === 'input') return 0;
			if (/*tag*/ ctx[22] === 'textarea') return 1;
			if (/*tag*/ ctx[22] === 'select' && !/*multiple*/ ctx[14]) return 2;
			return -1;
		}

		if (~(current_block_type_index = select_block_type(ctx))) {
			if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		}

		let if_block1 = /*feedback*/ ctx[9] && create_if_block$5(ctx);

		const block = {
			c: function create() {
				if (if_block0) if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				if_block1_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].m(target, anchor);
				}

				insert_dev(target, t, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert_dev(target, if_block1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if (~current_block_type_index) {
						if_blocks[current_block_type_index].p(ctx, dirty);
					}
				} else {
					if (if_block0) {
						group_outros();

						transition_out(if_blocks[previous_block_index], 1, 1, () => {
							if_blocks[previous_block_index] = null;
						});

						check_outros();
					}

					if (~current_block_type_index) {
						if_block0 = if_blocks[current_block_type_index];

						if (!if_block0) {
							if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
							if_block0.c();
						} else {
							if_block0.p(ctx, dirty);
						}

						transition_in(if_block0, 1);
						if_block0.m(t.parentNode, t);
					} else {
						if_block0 = null;
					}
				}

				if (/*feedback*/ ctx[9]) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty[0] & /*feedback*/ 512) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block$5(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block0);
				transition_in(if_block1);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block0);
				transition_out(if_block1);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(if_block1_anchor);
				}

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].d(detaching);
				}

				if (if_block1) if_block1.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$g.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$g($$self, $$props, $$invalidate) {
		const omit_props_names = [
			"class","bsSize","checked","color","disabled","feedback","files","group","inner","invalid","label","max","min","multiple","name","placeholder","plaintext","readonly","reverse","size","theme","type","valid","value"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Input', slots, ['default']);
		let { class: className = '' } = $$props;
		let { bsSize = undefined } = $$props;
		let { checked = false } = $$props;
		let { color = undefined } = $$props;
		let { disabled = undefined } = $$props;
		let { feedback = undefined } = $$props;
		let { files = undefined } = $$props;
		let { group = undefined } = $$props;
		let { inner = undefined } = $$props;
		let { invalid = false } = $$props;
		let { label = undefined } = $$props;
		let { max = undefined } = $$props;
		let { min = undefined } = $$props;
		let { multiple = undefined } = $$props;
		let { name = '' } = $$props;
		let { placeholder = '' } = $$props;
		let { plaintext = false } = $$props;
		let { readonly = undefined } = $$props;
		let { reverse = false } = $$props;
		let { size = undefined } = $$props;
		let { theme = undefined } = $$props;
		let { type = 'text' } = $$props;
		let { valid = false } = $$props;
		let { value = undefined } = $$props;
		let classes;
		let tag;

		const handleInput = ({ target }) => {
			if (target.type === 'number' || target.type === 'range') {
				$$invalidate(6, value = Number(target.value));
			} else {
				$$invalidate(6, value = target.value);
			}
		};

		function blur_handler(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_2(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_3(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_5(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_6(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function blur_handler_8(event) {
			bubble.call(this, $$self, event);
		}

		function click_handler_7(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_8(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_8(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_8(event) {
			bubble.call(this, $$self, event);
		}

		function input_input_handler() {
			value = this.value;
			$$invalidate(6, value);
		}

		function input_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function input_input_handler_1() {
			value = this.value;
			$$invalidate(6, value);
		}

		function input_binding_1($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function input_input_handler_2() {
			value = this.value;
			$$invalidate(6, value);
		}

		function input_binding_2($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function input_change_handler() {
			files = this.files;
			value = this.value;
			$$invalidate(3, files);
			$$invalidate(6, value);
		}

		function input_binding_3($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function formcheck_checked_binding(value) {
			checked = value;
			$$invalidate(2, checked);
		}

		function formcheck_inner_binding(value) {
			inner = value;
			$$invalidate(5, inner);
		}

		function formcheck_group_binding(value) {
			group = value;
			$$invalidate(4, group);
		}

		function formcheck_value_binding(value$1) {
			value = value$1;
			$$invalidate(6, value);
		}

		function blur_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function change_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function focus_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function keydown_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function keypress_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function keyup_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function mousedown_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function mouseup_handler_4(event) {
			bubble.call(this, $$self, event);
		}

		function input_input_handler_3() {
			value = this.value;
			$$invalidate(6, value);
		}

		function input_binding_4($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function textarea_input_handler() {
			value = this.value;
			$$invalidate(6, value);
		}

		function textarea_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		function select_change_handler() {
			value = select_value(this);
			$$invalidate(6, value);
		}

		function select_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				inner = $$value;
				$$invalidate(5, inner);
			});
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(25, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(7, className = $$new_props.class);
			if ('bsSize' in $$new_props) $$invalidate(0, bsSize = $$new_props.bsSize);
			if ('checked' in $$new_props) $$invalidate(2, checked = $$new_props.checked);
			if ('color' in $$new_props) $$invalidate(26, color = $$new_props.color);
			if ('disabled' in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
			if ('feedback' in $$new_props) $$invalidate(9, feedback = $$new_props.feedback);
			if ('files' in $$new_props) $$invalidate(3, files = $$new_props.files);
			if ('group' in $$new_props) $$invalidate(4, group = $$new_props.group);
			if ('inner' in $$new_props) $$invalidate(5, inner = $$new_props.inner);
			if ('invalid' in $$new_props) $$invalidate(10, invalid = $$new_props.invalid);
			if ('label' in $$new_props) $$invalidate(11, label = $$new_props.label);
			if ('max' in $$new_props) $$invalidate(12, max = $$new_props.max);
			if ('min' in $$new_props) $$invalidate(13, min = $$new_props.min);
			if ('multiple' in $$new_props) $$invalidate(14, multiple = $$new_props.multiple);
			if ('name' in $$new_props) $$invalidate(15, name = $$new_props.name);
			if ('placeholder' in $$new_props) $$invalidate(16, placeholder = $$new_props.placeholder);
			if ('plaintext' in $$new_props) $$invalidate(27, plaintext = $$new_props.plaintext);
			if ('readonly' in $$new_props) $$invalidate(17, readonly = $$new_props.readonly);
			if ('reverse' in $$new_props) $$invalidate(18, reverse = $$new_props.reverse);
			if ('size' in $$new_props) $$invalidate(1, size = $$new_props.size);
			if ('theme' in $$new_props) $$invalidate(19, theme = $$new_props.theme);
			if ('type' in $$new_props) $$invalidate(20, type = $$new_props.type);
			if ('valid' in $$new_props) $$invalidate(21, valid = $$new_props.valid);
			if ('value' in $$new_props) $$invalidate(6, value = $$new_props.value);
			if ('$$scope' in $$new_props) $$invalidate(131, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			FormCheck,
			FormFeedback,
			classnames,
			className,
			bsSize,
			checked,
			color,
			disabled,
			feedback,
			files,
			group,
			inner,
			invalid,
			label,
			max,
			min,
			multiple,
			name,
			placeholder,
			plaintext,
			readonly,
			reverse,
			size,
			theme,
			type,
			valid,
			value,
			classes,
			tag,
			handleInput
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(7, className = $$new_props.className);
			if ('bsSize' in $$props) $$invalidate(0, bsSize = $$new_props.bsSize);
			if ('checked' in $$props) $$invalidate(2, checked = $$new_props.checked);
			if ('color' in $$props) $$invalidate(26, color = $$new_props.color);
			if ('disabled' in $$props) $$invalidate(8, disabled = $$new_props.disabled);
			if ('feedback' in $$props) $$invalidate(9, feedback = $$new_props.feedback);
			if ('files' in $$props) $$invalidate(3, files = $$new_props.files);
			if ('group' in $$props) $$invalidate(4, group = $$new_props.group);
			if ('inner' in $$props) $$invalidate(5, inner = $$new_props.inner);
			if ('invalid' in $$props) $$invalidate(10, invalid = $$new_props.invalid);
			if ('label' in $$props) $$invalidate(11, label = $$new_props.label);
			if ('max' in $$props) $$invalidate(12, max = $$new_props.max);
			if ('min' in $$props) $$invalidate(13, min = $$new_props.min);
			if ('multiple' in $$props) $$invalidate(14, multiple = $$new_props.multiple);
			if ('name' in $$props) $$invalidate(15, name = $$new_props.name);
			if ('placeholder' in $$props) $$invalidate(16, placeholder = $$new_props.placeholder);
			if ('plaintext' in $$props) $$invalidate(27, plaintext = $$new_props.plaintext);
			if ('readonly' in $$props) $$invalidate(17, readonly = $$new_props.readonly);
			if ('reverse' in $$props) $$invalidate(18, reverse = $$new_props.reverse);
			if ('size' in $$props) $$invalidate(1, size = $$new_props.size);
			if ('theme' in $$props) $$invalidate(19, theme = $$new_props.theme);
			if ('type' in $$props) $$invalidate(20, type = $$new_props.type);
			if ('valid' in $$props) $$invalidate(21, valid = $$new_props.valid);
			if ('value' in $$props) $$invalidate(6, value = $$new_props.value);
			if ('classes' in $$props) $$invalidate(23, classes = $$new_props.classes);
			if ('tag' in $$props) $$invalidate(22, tag = $$new_props.tag);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty[0] & /*type, color, plaintext, size, className, invalid, valid, bsSize, tag*/ 208667779) {
				{
					const isNotaNumber = new RegExp('\\D', 'g');
					let isBtn = false;
					let formControlClass = 'form-control';
					$$invalidate(22, tag = 'input');

					switch (type) {
						case 'color':
							formControlClass = `form-control form-control-color`;
							break;
						case 'range':
							formControlClass = 'form-range';
							break;
						case 'select':
							formControlClass = `form-select`;
							$$invalidate(22, tag = 'select');
							break;
						case 'textarea':
							$$invalidate(22, tag = 'textarea');
							break;
						case 'button':
						case 'reset':
						case 'submit':
							formControlClass = `btn btn-${color || 'secondary'}`;
							isBtn = true;
							break;
						case 'hidden':
						case 'image':
							formControlClass = undefined;
							break;
						default:
							formControlClass = 'form-control';
							$$invalidate(22, tag = 'input');
					}

					if (plaintext) {
						formControlClass = `${formControlClass}-plaintext`;
						$$invalidate(22, tag = 'input');
					}

					if (size && isNotaNumber.test(size)) {
						console.warn('Please use the prop "bsSize" instead of the "size" to bootstrap\'s input sizing.');
						$$invalidate(0, bsSize = size);
						$$invalidate(1, size = undefined);
					}

					$$invalidate(23, classes = classnames(className, formControlClass, {
						'is-invalid': invalid,
						'is-valid': valid,
						[`form-control-${bsSize}`]: bsSize && !isBtn && tag !== 'select',
						[`form-select-${bsSize}`]: bsSize && tag === 'select',
						[`btn-${bsSize}`]: bsSize && isBtn
					}));
				}
			}
		};

		return [
			bsSize,
			size,
			checked,
			files,
			group,
			inner,
			value,
			className,
			disabled,
			feedback,
			invalid,
			label,
			max,
			min,
			multiple,
			name,
			placeholder,
			readonly,
			reverse,
			theme,
			type,
			valid,
			tag,
			classes,
			handleInput,
			$$restProps,
			color,
			plaintext,
			slots,
			blur_handler,
			change_handler,
			click_handler,
			focus_handler,
			input_handler,
			keydown_handler,
			keypress_handler,
			keyup_handler,
			mousedown_handler,
			mouseup_handler,
			blur_handler_1,
			change_handler_1,
			click_handler_1,
			focus_handler_1,
			input_handler_1,
			keydown_handler_1,
			keypress_handler_1,
			keyup_handler_1,
			mousedown_handler_1,
			mouseup_handler_1,
			blur_handler_2,
			change_handler_2,
			click_handler_2,
			focus_handler_2,
			input_handler_2,
			keydown_handler_2,
			keypress_handler_2,
			keyup_handler_2,
			mousedown_handler_2,
			mouseup_handler_2,
			blur_handler_3,
			change_handler_3,
			click_handler_3,
			focus_handler_3,
			input_handler_3,
			keydown_handler_3,
			keypress_handler_3,
			keyup_handler_3,
			mousedown_handler_3,
			mouseup_handler_3,
			blur_handler_5,
			change_handler_5,
			click_handler_4,
			focus_handler_5,
			input_handler_5,
			keydown_handler_5,
			keypress_handler_5,
			keyup_handler_5,
			mousedown_handler_5,
			mouseup_handler_5,
			blur_handler_6,
			change_handler_6,
			click_handler_5,
			focus_handler_6,
			input_handler_6,
			keydown_handler_6,
			keypress_handler_6,
			keyup_handler_6,
			mousedown_handler_6,
			mouseup_handler_6,
			blur_handler_7,
			change_handler_7,
			click_handler_6,
			focus_handler_7,
			input_handler_7,
			keydown_handler_7,
			keypress_handler_7,
			keyup_handler_7,
			mousedown_handler_7,
			mouseup_handler_7,
			blur_handler_8,
			click_handler_7,
			change_handler_8,
			focus_handler_8,
			input_handler_8,
			input_input_handler,
			input_binding,
			input_input_handler_1,
			input_binding_1,
			input_input_handler_2,
			input_binding_2,
			input_change_handler,
			input_binding_3,
			formcheck_checked_binding,
			formcheck_inner_binding,
			formcheck_group_binding,
			formcheck_value_binding,
			blur_handler_4,
			change_handler_4,
			focus_handler_4,
			input_handler_4,
			keydown_handler_4,
			keypress_handler_4,
			keyup_handler_4,
			mousedown_handler_4,
			mouseup_handler_4,
			input_input_handler_3,
			input_binding_4,
			textarea_input_handler,
			textarea_binding,
			select_change_handler,
			select_binding,
			$$scope
		];
	}

	class Input extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance$g,
				create_fragment$g,
				safe_not_equal,
				{
					class: 7,
					bsSize: 0,
					checked: 2,
					color: 26,
					disabled: 8,
					feedback: 9,
					files: 3,
					group: 4,
					inner: 5,
					invalid: 10,
					label: 11,
					max: 12,
					min: 13,
					multiple: 14,
					name: 15,
					placeholder: 16,
					plaintext: 27,
					readonly: 17,
					reverse: 18,
					size: 1,
					theme: 19,
					type: 20,
					valid: 21,
					value: 6
				},
				null,
				[-1, -1, -1, -1, -1]
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Input",
				options,
				id: create_fragment$g.name
			});
		}

		get class() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bsSize() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bsSize(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get checked() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set checked(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get color() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set color(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get disabled() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set disabled(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get feedback() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set feedback(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get files() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set files(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get group() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set group(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get inner() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set inner(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get invalid() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set invalid(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get label() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set label(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get max() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set max(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get min() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set min(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get multiple() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set multiple(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get name() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set name(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get placeholder() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set placeholder(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get plaintext() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set plaintext(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get readonly() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set readonly(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get reverse() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set reverse(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get theme() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set theme(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get type() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set type(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get valid() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set valid(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get value() {
			throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/ModalBackdrop/ModalBackdrop.svelte generated by Svelte v4.2.19 */
	const file$e = "node_modules/@sveltestrap/sveltestrap/dist/ModalBackdrop/ModalBackdrop.svelte";

	// (21:0) {#if isOpen && loaded}
	function create_if_block$4(ctx) {
		let div;
		let div_intro;
		let div_outro;
		let current;
		let mounted;
		let dispose;

		let div_levels = [
			{ role: "presentation" },
			/*$$restProps*/ ctx[4],
			{ class: /*classes*/ ctx[3] }
		];

		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				set_attributes(div, div_data);
				toggle_class(div, "fade", /*fade*/ ctx[1]);
				add_location(div, file$e, 21, 2, 421);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(div, "click", /*click_handler*/ ctx[6], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				set_attributes(div, div_data = get_spread_update(div_levels, [
					{ role: "presentation" },
					dirty & /*$$restProps*/ 16 && /*$$restProps*/ ctx[4],
					(!current || dirty & /*classes*/ 8) && { class: /*classes*/ ctx[3] }
				]));

				toggle_class(div, "fade", /*fade*/ ctx[1]);
			},
			i: function intro(local) {
				if (current) return;

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (div_outro) div_outro.end(1);
						div_intro = create_in_transition(div, backdropIn, {});
						div_intro.start();
					});
				}

				current = true;
			},
			o: function outro(local) {
				if (div_intro) div_intro.invalidate();

				if (local) {
					div_outro = create_out_transition(div, backdropOut, {});
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (detaching && div_outro) div_outro.end();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$4.name,
			type: "if",
			source: "(21:0) {#if isOpen && loaded}",
			ctx
		});

		return block;
	}

	function create_fragment$f(ctx) {
		let if_block_anchor;
		let if_block = /*isOpen*/ ctx[0] && /*loaded*/ ctx[2] && create_if_block$4(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*isOpen*/ ctx[0] && /*loaded*/ ctx[2]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*isOpen, loaded*/ 5) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$4(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				transition_in(if_block);
			},
			o: function outro(local) {
				transition_out(if_block);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$f.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$f($$self, $$props, $$invalidate) {
		let classes;
		const omit_props_names = ["class","isOpen","fade"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ModalBackdrop', slots, []);
		let { class: className = '' } = $$props;
		let { isOpen = false } = $$props;
		let { fade = true } = $$props;
		let loaded = false;

		onMount(() => {
			$$invalidate(2, loaded = true);
		});

		function click_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(4, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(5, className = $$new_props.class);
			if ('isOpen' in $$new_props) $$invalidate(0, isOpen = $$new_props.isOpen);
			if ('fade' in $$new_props) $$invalidate(1, fade = $$new_props.fade);
		};

		$$self.$capture_state = () => ({
			onMount,
			classnames,
			backdropIn,
			backdropOut,
			className,
			isOpen,
			fade,
			loaded,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(5, className = $$new_props.className);
			if ('isOpen' in $$props) $$invalidate(0, isOpen = $$new_props.isOpen);
			if ('fade' in $$props) $$invalidate(1, fade = $$new_props.fade);
			if ('loaded' in $$props) $$invalidate(2, loaded = $$new_props.loaded);
			if ('classes' in $$props) $$invalidate(3, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*className*/ 32) {
				$$invalidate(3, classes = classnames(className, 'modal-backdrop'));
			}
		};

		return [isOpen, fade, loaded, classes, $$restProps, className, click_handler];
	}

	class ModalBackdrop extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$f, create_fragment$f, safe_not_equal, { class: 5, isOpen: 0, fade: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModalBackdrop",
				options,
				id: create_fragment$f.name
			});
		}

		get class() {
			throw new Error("<ModalBackdrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<ModalBackdrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get isOpen() {
			throw new Error("<ModalBackdrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set isOpen(value) {
			throw new Error("<ModalBackdrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fade() {
			throw new Error("<ModalBackdrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fade(value) {
			throw new Error("<ModalBackdrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/ModalBody/ModalBody.svelte generated by Svelte v4.2.19 */
	const file$d = "node_modules/@sveltestrap/sveltestrap/dist/ModalBody/ModalBody.svelte";

	function create_fragment$e(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[4].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
		let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				set_attributes(div, div_data);
				add_location(div, file$d, 13, 0, 243);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[3],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
							null
						);
					}
				}

				set_attributes(div, div_data = get_spread_update(div_levels, [
					dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
					(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$e.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$e($$self, $$props, $$invalidate) {
		let classes;
		const omit_props_names = ["class"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ModalBody', slots, ['default']);
		let { class: className = '' } = $$props;

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
			if ('$$scope' in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({ classnames, className, classes });

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(2, className = $$new_props.className);
			if ('classes' in $$props) $$invalidate(0, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*className*/ 4) {
				$$invalidate(0, classes = classnames(className, 'modal-body'));
			}
		};

		return [classes, $$restProps, className, $$scope, slots];
	}

	class ModalBody extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$e, create_fragment$e, safe_not_equal, { class: 2 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModalBody",
				options,
				id: create_fragment$e.name
			});
		}

		get class() {
			throw new Error("<ModalBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<ModalBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/ModalHeader/ModalHeader.svelte generated by Svelte v4.2.19 */
	const file$c = "node_modules/@sveltestrap/sveltestrap/dist/ModalHeader/ModalHeader.svelte";
	const get_close_slot_changes = dirty => ({});
	const get_close_slot_context = ctx => ({});

	// (38:4) {:else}
	function create_else_block$3(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[8].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[7],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$3.name,
			type: "else",
			source: "(38:4) {:else}",
			ctx
		});

		return block;
	}

	// (36:4) {#if children}
	function create_if_block_1$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text(/*children*/ ctx[3]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*children*/ 8) set_data_dev(t, /*children*/ ctx[3]);
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$1.name,
			type: "if",
			source: "(36:4) {#if children}",
			ctx
		});

		return block;
	}

	// (43:4) {#if typeof toggle === 'function'}
	function create_if_block$3(ctx) {
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				attr_dev(button, "type", "button");
				attr_dev(button, "class", "btn-close");
				attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
				add_location(button, file$c, 43, 6, 861);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(
						button,
						"click",
						function () {
							if (is_function(/*toggle*/ ctx[0])) /*toggle*/ ctx[0].apply(this, arguments);
						},
						false,
						false,
						false,
						false
					);

					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;

				if (dirty & /*closeAriaLabel*/ 2) {
					attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(43:4) {#if typeof toggle === 'function'}",
			ctx
		});

		return block;
	}

	// (42:21)      
	function fallback_block(ctx) {
		let if_block_anchor;
		let if_block = typeof /*toggle*/ ctx[0] === 'function' && create_if_block$3(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, dirty) {
				if (typeof /*toggle*/ ctx[0] === 'function') {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$3(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: fallback_block.name,
			type: "fallback",
			source: "(42:21)      ",
			ctx
		});

		return block;
	}

	function create_fragment$d(ctx) {
		let div;
		let h5;
		let current_block_type_index;
		let if_block;
		let t;
		let current;
		const if_block_creators = [create_if_block_1$1, create_else_block$3];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*children*/ ctx[3]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		const close_slot_template = /*#slots*/ ctx[8].close;
		const close_slot = create_slot(close_slot_template, ctx, /*$$scope*/ ctx[7], get_close_slot_context);
		const close_slot_or_fallback = close_slot || fallback_block(ctx);
		let div_levels = [/*$$restProps*/ ctx[5], { class: /*classes*/ ctx[4] }];
		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				h5 = element("h5");
				if_block.c();
				t = space();
				if (close_slot_or_fallback) close_slot_or_fallback.c();
				attr_dev(h5, "class", "modal-title");
				attr_dev(h5, "id", /*id*/ ctx[2]);
				add_location(h5, file$c, 34, 2, 683);
				set_attributes(div, div_data);
				add_location(div, file$c, 33, 0, 642);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h5);
				if_blocks[current_block_type_index].m(h5, null);
				append_dev(div, t);

				if (close_slot_or_fallback) {
					close_slot_or_fallback.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(h5, null);
				}

				if (!current || dirty & /*id*/ 4) {
					attr_dev(h5, "id", /*id*/ ctx[2]);
				}

				if (close_slot) {
					if (close_slot.p && (!current || dirty & /*$$scope*/ 128)) {
						update_slot_base(
							close_slot,
							close_slot_template,
							ctx,
							/*$$scope*/ ctx[7],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
							: get_slot_changes(close_slot_template, /*$$scope*/ ctx[7], dirty, get_close_slot_changes),
							get_close_slot_context
						);
					}
				} else {
					if (close_slot_or_fallback && close_slot_or_fallback.p && (!current || dirty & /*closeAriaLabel, toggle*/ 3)) {
						close_slot_or_fallback.p(ctx, !current ? -1 : dirty);
					}
				}

				set_attributes(div, div_data = get_spread_update(div_levels, [
					dirty & /*$$restProps*/ 32 && /*$$restProps*/ ctx[5],
					(!current || dirty & /*classes*/ 16) && { class: /*classes*/ ctx[4] }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				transition_in(close_slot_or_fallback, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				transition_out(close_slot_or_fallback, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if_blocks[current_block_type_index].d();
				if (close_slot_or_fallback) close_slot_or_fallback.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$d.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$d($$self, $$props, $$invalidate) {
		let classes;
		const omit_props_names = ["class","toggle","closeAriaLabel","id","children"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ModalHeader', slots, ['default','close']);
		let { class: className = '' } = $$props;
		let { toggle = undefined } = $$props;
		let { closeAriaLabel = 'Close' } = $$props;
		let { id = undefined } = $$props;
		let { children = undefined } = $$props;

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(6, className = $$new_props.class);
			if ('toggle' in $$new_props) $$invalidate(0, toggle = $$new_props.toggle);
			if ('closeAriaLabel' in $$new_props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
			if ('id' in $$new_props) $$invalidate(2, id = $$new_props.id);
			if ('children' in $$new_props) $$invalidate(3, children = $$new_props.children);
			if ('$$scope' in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			className,
			toggle,
			closeAriaLabel,
			id,
			children,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(6, className = $$new_props.className);
			if ('toggle' in $$props) $$invalidate(0, toggle = $$new_props.toggle);
			if ('closeAriaLabel' in $$props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
			if ('id' in $$props) $$invalidate(2, id = $$new_props.id);
			if ('children' in $$props) $$invalidate(3, children = $$new_props.children);
			if ('classes' in $$props) $$invalidate(4, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*className*/ 64) {
				$$invalidate(4, classes = classnames(className, 'modal-header'));
			}
		};

		return [
			toggle,
			closeAriaLabel,
			id,
			children,
			classes,
			$$restProps,
			className,
			$$scope,
			slots
		];
	}

	class ModalHeader extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$d, create_fragment$d, safe_not_equal, {
				class: 6,
				toggle: 0,
				closeAriaLabel: 1,
				id: 2,
				children: 3
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModalHeader",
				options,
				id: create_fragment$d.name
			});
		}

		get class() {
			throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get toggle() {
			throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set toggle(value) {
			throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get closeAriaLabel() {
			throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set closeAriaLabel(value) {
			throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get id() {
			throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set id(value) {
			throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get children() {
			throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set children(value) {
			throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Portal/Portal.svelte generated by Svelte v4.2.19 */
	const file$b = "node_modules/@sveltestrap/sveltestrap/dist/Portal/Portal.svelte";

	function create_fragment$c(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
		let div_levels = [/*$$restProps*/ ctx[1]];
		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				set_attributes(div, div_data);
				add_location(div, file$b, 18, 0, 321);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				/*div_binding*/ ctx[4](div);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1]]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
				/*div_binding*/ ctx[4](null);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$c.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$c($$self, $$props, $$invalidate) {
		const omit_props_names = [];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Portal', slots, ['default']);
		let ref;
		let portal;

		onMount(() => {
			portal = document.createElement('div');
			document.body.appendChild(portal);
			portal.appendChild(ref);
		});

		onDestroy(() => {
			if (portal) {
				document.body.removeChild(portal);
			}
		});

		function div_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				ref = $$value;
				$$invalidate(0, ref);
			});
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('$$scope' in $$new_props) $$invalidate(2, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({ onMount, onDestroy, ref, portal });

		$$self.$inject_state = $$new_props => {
			if ('ref' in $$props) $$invalidate(0, ref = $$new_props.ref);
			if ('portal' in $$props) portal = $$new_props.portal;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [ref, $$restProps, $$scope, slots, div_binding];
	}

	class Portal extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Portal",
				options,
				id: create_fragment$c.name
			});
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Modal/Modal.svelte generated by Svelte v4.2.19 */

	const file$a = "node_modules/@sveltestrap/sveltestrap/dist/Modal/Modal.svelte";
	const get_external_slot_changes = dirty => ({});
	const get_external_slot_context = ctx => ({});

	// (323:0) {#if _isMounted}
	function create_if_block_1(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*outer*/ ctx[15];

		function switch_props(ctx, dirty) {
			return {
				props: {
					$$slots: { default: [create_default_slot_1$3] },
					$$scope: { ctx }
				},
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*outer*/ 32768 && switch_value !== (switch_value = /*outer*/ ctx[15])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = {};

					if (dirty[0] & /*wrapClassName, $$restProps, theme, modalStyle, labelledBy, modalClassName, fade, staticModal, classes, _dialog, contentClassName, body, toggle, header, isOpen*/ 8478703 | dirty[1] & /*$$scope*/ 64) {
						switch_instance_changes.$$scope = { dirty, ctx };
					}

					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(323:0) {#if _isMounted}",
			ctx
		});

		return block;
	}

	// (327:6) {#if isOpen}
	function create_if_block_2(ctx) {
		let div2;
		let t0;
		let div1;
		let div0;
		let t1;
		let current_block_type_index;
		let if_block1;
		let div0_class_value;
		let div2_class_value;
		let div2_intro;
		let div2_outro;
		let current;
		let mounted;
		let dispose;
		const external_slot_template = /*#slots*/ ctx[34].external;
		const external_slot = create_slot(external_slot_template, ctx, /*$$scope*/ ctx[37], get_external_slot_context);
		let if_block0 = /*header*/ ctx[2] && create_if_block_4(ctx);
		const if_block_creators = [create_if_block_3, create_else_block$2];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*body*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				div2 = element("div");
				if (external_slot) external_slot.c();
				t0 = space();
				div1 = element("div");
				div0 = element("div");
				if (if_block0) if_block0.c();
				t1 = space();
				if_block1.c();
				attr_dev(div0, "class", div0_class_value = classnames('modal-content', /*contentClassName*/ ctx[5]));
				add_location(div0, file$a, 347, 12, 8142);
				attr_dev(div1, "class", /*classes*/ ctx[16]);
				attr_dev(div1, "role", "document");
				add_location(div1, file$a, 346, 10, 8072);
				attr_dev(div2, "style", /*modalStyle*/ ctx[9]);
				attr_dev(div2, "aria-labelledby", /*labelledBy*/ ctx[7]);

				attr_dev(div2, "class", div2_class_value = classnames('modal', /*modalClassName*/ ctx[8], {
					fade: /*fade*/ ctx[6],
					'position-static': /*staticModal*/ ctx[0]
				}));

				attr_dev(div2, "role", "dialog");
				add_location(div2, file$a, 328, 8, 7473);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);

				if (external_slot) {
					external_slot.m(div2, null);
				}

				append_dev(div2, t0);
				append_dev(div2, div1);
				append_dev(div1, div0);
				if (if_block0) if_block0.m(div0, null);
				append_dev(div0, t1);
				if_blocks[current_block_type_index].m(div0, null);
				/*div1_binding*/ ctx[35](div1);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(div2, "introstart", /*introstart_handler*/ ctx[36], false, false, false, false),
						listen_dev(div2, "introend", /*onModalOpened*/ ctx[19], false, false, false, false),
						listen_dev(div2, "outrostart", /*onModalClosing*/ ctx[20], false, false, false, false),
						listen_dev(div2, "outroend", /*onModalClosed*/ ctx[21], false, false, false, false),
						listen_dev(div2, "click", /*handleBackdropClick*/ ctx[18], false, false, false, false),
						listen_dev(div2, "mousedown", /*handleBackdropMouseDown*/ ctx[22], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (external_slot) {
					if (external_slot.p && (!current || dirty[1] & /*$$scope*/ 64)) {
						update_slot_base(
							external_slot,
							external_slot_template,
							ctx,
							/*$$scope*/ ctx[37],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[37])
							: get_slot_changes(external_slot_template, /*$$scope*/ ctx[37], dirty, get_external_slot_changes),
							get_external_slot_context
						);
					}
				}

				if (/*header*/ ctx[2]) {
					if (if_block0) {
						if_block0.p(ctx, dirty);

						if (dirty[0] & /*header*/ 4) {
							transition_in(if_block0, 1);
						}
					} else {
						if_block0 = create_if_block_4(ctx);
						if_block0.c();
						transition_in(if_block0, 1);
						if_block0.m(div0, t1);
					}
				} else if (if_block0) {
					group_outros();

					transition_out(if_block0, 1, 1, () => {
						if_block0 = null;
					});

					check_outros();
				}

				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block1 = if_blocks[current_block_type_index];

					if (!if_block1) {
						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block1.c();
					} else {
						if_block1.p(ctx, dirty);
					}

					transition_in(if_block1, 1);
					if_block1.m(div0, null);
				}

				if (!current || dirty[0] & /*contentClassName*/ 32 && div0_class_value !== (div0_class_value = classnames('modal-content', /*contentClassName*/ ctx[5]))) {
					attr_dev(div0, "class", div0_class_value);
				}

				if (!current || dirty[0] & /*classes*/ 65536) {
					attr_dev(div1, "class", /*classes*/ ctx[16]);
				}

				if (!current || dirty[0] & /*modalStyle*/ 512) {
					attr_dev(div2, "style", /*modalStyle*/ ctx[9]);
				}

				if (!current || dirty[0] & /*labelledBy*/ 128) {
					attr_dev(div2, "aria-labelledby", /*labelledBy*/ ctx[7]);
				}

				if (!current || dirty[0] & /*modalClassName, fade, staticModal*/ 321 && div2_class_value !== (div2_class_value = classnames('modal', /*modalClassName*/ ctx[8], {
					fade: /*fade*/ ctx[6],
					'position-static': /*staticModal*/ ctx[0]
				}))) {
					attr_dev(div2, "class", div2_class_value);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(external_slot, local);
				transition_in(if_block0);
				transition_in(if_block1);

				add_render_callback(() => {
					if (!current) return;
					if (div2_outro) div2_outro.end(1);
					div2_intro = create_in_transition(div2, modalIn, {});
					div2_intro.start();
				});

				current = true;
			},
			o: function outro(local) {
				transition_out(external_slot, local);
				transition_out(if_block0);
				transition_out(if_block1);
				if (div2_intro) div2_intro.invalidate();
				div2_outro = create_out_transition(div2, modalOut, {});
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				if (external_slot) external_slot.d(detaching);
				if (if_block0) if_block0.d();
				if_blocks[current_block_type_index].d();
				/*div1_binding*/ ctx[35](null);
				if (detaching && div2_outro) div2_outro.end();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(327:6) {#if isOpen}",
			ctx
		});

		return block;
	}

	// (349:14) {#if header}
	function create_if_block_4(ctx) {
		let modalheader;
		let current;

		modalheader = new ModalHeader({
				props: {
					toggle: /*toggle*/ ctx[11],
					id: /*labelledBy*/ ctx[7],
					$$slots: { default: [create_default_slot_3$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(modalheader.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(modalheader, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const modalheader_changes = {};
				if (dirty[0] & /*toggle*/ 2048) modalheader_changes.toggle = /*toggle*/ ctx[11];
				if (dirty[0] & /*labelledBy*/ 128) modalheader_changes.id = /*labelledBy*/ ctx[7];

				if (dirty[0] & /*header*/ 4 | dirty[1] & /*$$scope*/ 64) {
					modalheader_changes.$$scope = { dirty, ctx };
				}

				modalheader.$set(modalheader_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(modalheader.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(modalheader.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(modalheader, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4.name,
			type: "if",
			source: "(349:14) {#if header}",
			ctx
		});

		return block;
	}

	// (350:16) <ModalHeader {toggle} id={labelledBy}>
	function create_default_slot_3$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text(/*header*/ ctx[2]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*header*/ 4) set_data_dev(t, /*header*/ ctx[2]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_3$1.name,
			type: "slot",
			source: "(350:16) <ModalHeader {toggle} id={labelledBy}>",
			ctx
		});

		return block;
	}

	// (358:14) {:else}
	function create_else_block$2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[34].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[37], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 64)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[37],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[37])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[37], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(358:14) {:else}",
			ctx
		});

		return block;
	}

	// (354:14) {#if body}
	function create_if_block_3(ctx) {
		let modalbody;
		let current;

		modalbody = new ModalBody({
				props: {
					$$slots: { default: [create_default_slot_2$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(modalbody.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(modalbody, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const modalbody_changes = {};

				if (dirty[1] & /*$$scope*/ 64) {
					modalbody_changes.$$scope = { dirty, ctx };
				}

				modalbody.$set(modalbody_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(modalbody.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(modalbody.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(modalbody, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(354:14) {#if body}",
			ctx
		});

		return block;
	}

	// (355:16) <ModalBody>
	function create_default_slot_2$2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[34].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[37], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 64)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[37],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[37])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[37], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_2$2.name,
			type: "slot",
			source: "(355:16) <ModalBody>",
			ctx
		});

		return block;
	}

	// (324:2) <svelte:component this={outer}>
	function create_default_slot_1$3(ctx) {
		let div;
		let current;
		let if_block = /*isOpen*/ ctx[3] && create_if_block_2(ctx);

		let div_levels = [
			{ class: /*wrapClassName*/ ctx[12] },
			{ tabindex: "-1" },
			/*$$restProps*/ ctx[23],
			{ "data-bs-theme": /*theme*/ ctx[10] }
		];

		let div_data = {};

		for (let i = 0; i < div_levels.length; i += 1) {
			div_data = assign(div_data, div_levels[i]);
		}

		const block = {
			c: function create() {
				div = element("div");
				if (if_block) if_block.c();
				set_attributes(div, div_data);
				add_location(div, file$a, 325, 4, 7290);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				if (if_block) if_block.m(div, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (/*isOpen*/ ctx[3]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty[0] & /*isOpen*/ 8) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block_2(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div, null);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				set_attributes(div, div_data = get_spread_update(div_levels, [
					(!current || dirty[0] & /*wrapClassName*/ 4096) && { class: /*wrapClassName*/ ctx[12] },
					{ tabindex: "-1" },
					dirty[0] & /*$$restProps*/ 8388608 && /*$$restProps*/ ctx[23],
					(!current || dirty[0] & /*theme*/ 1024) && { "data-bs-theme": /*theme*/ ctx[10] }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block) if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$3.name,
			type: "slot",
			source: "(324:2) <svelte:component this={outer}>",
			ctx
		});

		return block;
	}

	// (369:0) {#if backdrop && !staticModal}
	function create_if_block$2(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*outer*/ ctx[15];

		function switch_props(ctx, dirty) {
			return {
				props: {
					$$slots: { default: [create_default_slot$4] },
					$$scope: { ctx }
				},
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*outer*/ 32768 && switch_value !== (switch_value = /*outer*/ ctx[15])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = {};

					if (dirty[0] & /*fade, isOpen*/ 72 | dirty[1] & /*$$scope*/ 64) {
						switch_instance_changes.$$scope = { dirty, ctx };
					}

					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(369:0) {#if backdrop && !staticModal}",
			ctx
		});

		return block;
	}

	// (370:2) <svelte:component this={outer}>
	function create_default_slot$4(ctx) {
		let modalbackdrop;
		let current;

		modalbackdrop = new ModalBackdrop({
				props: {
					fade: /*fade*/ ctx[6],
					isOpen: /*isOpen*/ ctx[3]
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(modalbackdrop.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(modalbackdrop, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const modalbackdrop_changes = {};
				if (dirty[0] & /*fade*/ 64) modalbackdrop_changes.fade = /*fade*/ ctx[6];
				if (dirty[0] & /*isOpen*/ 8) modalbackdrop_changes.isOpen = /*isOpen*/ ctx[3];
				modalbackdrop.$set(modalbackdrop_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(modalbackdrop.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(modalbackdrop.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(modalbackdrop, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$4.name,
			type: "slot",
			source: "(370:2) <svelte:component this={outer}>",
			ctx
		});

		return block;
	}

	function create_fragment$b(ctx) {
		let t;
		let if_block1_anchor;
		let current;
		let if_block0 = /*_isMounted*/ ctx[13] && create_if_block_1(ctx);
		let if_block1 = /*backdrop*/ ctx[4] && !/*staticModal*/ ctx[0] && create_if_block$2(ctx);

		const block = {
			c: function create() {
				if (if_block0) if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				if_block1_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert_dev(target, t, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert_dev(target, if_block1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (/*_isMounted*/ ctx[13]) {
					if (if_block0) {
						if_block0.p(ctx, dirty);

						if (dirty[0] & /*_isMounted*/ 8192) {
							transition_in(if_block0, 1);
						}
					} else {
						if_block0 = create_if_block_1(ctx);
						if_block0.c();
						transition_in(if_block0, 1);
						if_block0.m(t.parentNode, t);
					}
				} else if (if_block0) {
					group_outros();

					transition_out(if_block0, 1, 1, () => {
						if_block0 = null;
					});

					check_outros();
				}

				if (/*backdrop*/ ctx[4] && !/*staticModal*/ ctx[0]) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty[0] & /*backdrop, staticModal*/ 17) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block$2(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block0);
				transition_in(if_block1);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block0);
				transition_out(if_block1);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(if_block1_anchor);
				}

				if (if_block0) if_block0.d(detaching);
				if (if_block1) if_block1.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$b.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	let openCount = 0;
	const dialogBaseClass = 'modal-dialog';

	function instance$b($$self, $$props, $$invalidate) {
		let classes;
		let outer;

		const omit_props_names = [
			"class","static","autoFocus","body","centered","container","fullscreen","header","isOpen","keyboard","backdrop","contentClassName","fade","labelledBy","modalClassName","modalStyle","returnFocusAfterClose","scrollable","size","theme","toggle","unmountOnClose","wrapClassName"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Modal', slots, ['external','default']);
		const dispatch = createEventDispatcher();
		let { class: className = '' } = $$props;
		let { static: staticModal = false } = $$props;
		let { autoFocus = true } = $$props;
		let { body = false } = $$props;
		let { centered = false } = $$props;
		let { container = undefined } = $$props;
		let { fullscreen = false } = $$props;
		let { header = undefined } = $$props;
		let { isOpen = false } = $$props;
		let { keyboard = true } = $$props;
		let { backdrop = true } = $$props;
		let { contentClassName = '' } = $$props;
		let { fade = true } = $$props;
		let { labelledBy = header ? `modal-${uuid()}` : undefined } = $$props;
		let { modalClassName = '' } = $$props;
		let { modalStyle = null } = $$props;
		let { returnFocusAfterClose = true } = $$props;
		let { scrollable = false } = $$props;
		let { size = '' } = $$props;
		let { theme = null } = $$props;
		let { toggle = undefined } = $$props;
		let { unmountOnClose = true } = $$props;
		let { wrapClassName = '' } = $$props;
		let hasOpened = false;
		let _isMounted = false;
		let _triggeringElement;
		let _originalBodyPadding;
		let _lastIsOpen = isOpen;
		let _lastHasOpened = hasOpened;
		let _dialog;
		let _mouseDownElement;
		let _removeEscListener;

		onMount(() => {
			if (isOpen) {
				init();
				hasOpened = true;
			}

			if (hasOpened && autoFocus) {
				setFocus();
			}
		});

		onDestroy(() => {
			destroy();

			if (hasOpened) {
				close();
			}
		});

		afterUpdate(() => {
			if (isOpen && !_lastIsOpen) {
				init();
				hasOpened = true;
			}

			if (autoFocus && hasOpened && !_lastHasOpened) {
				setFocus();
			}

			_lastIsOpen = isOpen;
			_lastHasOpened = hasOpened;
		});

		function setFocus() {
			if (_dialog && _dialog.parentNode && typeof _dialog.parentNode.focus === 'function') {
				_dialog.parentNode.focus();
			}
		}

		function init() {
			try {
				_triggeringElement = document.activeElement;
			} catch(err) {
				_triggeringElement = null;
			}

			if (!staticModal) {
				_originalBodyPadding = getOriginalBodyPadding();
				conditionallyUpdateScrollbar();

				if (openCount === 0) {
					document.body.className = classnames(document.body.className, 'modal-open');
				}

				++openCount;
			}

			$$invalidate(13, _isMounted = true);
		}

		function manageFocusAfterClose() {
			if (_triggeringElement) {
				if (typeof _triggeringElement.focus === 'function' && returnFocusAfterClose) {
					_triggeringElement.focus();
				}

				_triggeringElement = null;
			}
		}

		function destroy() {
			manageFocusAfterClose();
		}

		function close() {
			if (openCount <= 1) {
				document.body.classList.remove('modal-open');
			}

			manageFocusAfterClose();
			openCount = Math.max(0, openCount - 1);
			setScrollbarWidth(_originalBodyPadding);
		}

		function handleBackdropClick(e) {
			if (e.target === _mouseDownElement) {
				if (!isOpen || !backdrop) {
					return;
				}

				const backdropElem = _dialog ? _dialog.parentNode : null;

				if (backdrop === true && backdropElem && e.target === backdropElem && toggle) {
					e.stopPropagation();
					toggle(e);
				}
			}
		}

		function onModalOpened() {
			dispatch('open');

			_removeEscListener = browserEvent(document, 'keydown', event => {
				if (event.key && event.key === 'Escape' && keyboard) {
					if (toggle && backdrop === true) {
						if (_removeEscListener) _removeEscListener();
						toggle(event);
					}
				}
			});
		}

		function onModalClosing() {
			dispatch('closing');

			if (_removeEscListener) {
				_removeEscListener();
			}
		}

		function onModalClosed() {
			dispatch('close');

			if (unmountOnClose) {
				destroy();
			}

			close();

			if (_isMounted) {
				hasOpened = false;
			}

			$$invalidate(13, _isMounted = false);
		}

		function handleBackdropMouseDown(e) {
			_mouseDownElement = e.target;
		}

		function div1_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				_dialog = $$value;
				$$invalidate(14, _dialog);
			});
		}

		const introstart_handler = () => dispatch('opening');

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(23, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(24, className = $$new_props.class);
			if ('static' in $$new_props) $$invalidate(0, staticModal = $$new_props.static);
			if ('autoFocus' in $$new_props) $$invalidate(25, autoFocus = $$new_props.autoFocus);
			if ('body' in $$new_props) $$invalidate(1, body = $$new_props.body);
			if ('centered' in $$new_props) $$invalidate(26, centered = $$new_props.centered);
			if ('container' in $$new_props) $$invalidate(27, container = $$new_props.container);
			if ('fullscreen' in $$new_props) $$invalidate(28, fullscreen = $$new_props.fullscreen);
			if ('header' in $$new_props) $$invalidate(2, header = $$new_props.header);
			if ('isOpen' in $$new_props) $$invalidate(3, isOpen = $$new_props.isOpen);
			if ('keyboard' in $$new_props) $$invalidate(29, keyboard = $$new_props.keyboard);
			if ('backdrop' in $$new_props) $$invalidate(4, backdrop = $$new_props.backdrop);
			if ('contentClassName' in $$new_props) $$invalidate(5, contentClassName = $$new_props.contentClassName);
			if ('fade' in $$new_props) $$invalidate(6, fade = $$new_props.fade);
			if ('labelledBy' in $$new_props) $$invalidate(7, labelledBy = $$new_props.labelledBy);
			if ('modalClassName' in $$new_props) $$invalidate(8, modalClassName = $$new_props.modalClassName);
			if ('modalStyle' in $$new_props) $$invalidate(9, modalStyle = $$new_props.modalStyle);
			if ('returnFocusAfterClose' in $$new_props) $$invalidate(30, returnFocusAfterClose = $$new_props.returnFocusAfterClose);
			if ('scrollable' in $$new_props) $$invalidate(31, scrollable = $$new_props.scrollable);
			if ('size' in $$new_props) $$invalidate(32, size = $$new_props.size);
			if ('theme' in $$new_props) $$invalidate(10, theme = $$new_props.theme);
			if ('toggle' in $$new_props) $$invalidate(11, toggle = $$new_props.toggle);
			if ('unmountOnClose' in $$new_props) $$invalidate(33, unmountOnClose = $$new_props.unmountOnClose);
			if ('wrapClassName' in $$new_props) $$invalidate(12, wrapClassName = $$new_props.wrapClassName);
			if ('$$scope' in $$new_props) $$invalidate(37, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			openCount,
			createEventDispatcher,
			onDestroy,
			onMount,
			afterUpdate,
			modalIn,
			modalOut,
			InlineContainer,
			ModalBackdrop,
			ModalBody,
			ModalHeader,
			Portal,
			browserEvent,
			classnames,
			conditionallyUpdateScrollbar,
			getOriginalBodyPadding,
			setScrollbarWidth,
			uuid,
			dispatch,
			className,
			staticModal,
			autoFocus,
			body,
			centered,
			container,
			fullscreen,
			header,
			isOpen,
			keyboard,
			backdrop,
			contentClassName,
			fade,
			labelledBy,
			modalClassName,
			modalStyle,
			returnFocusAfterClose,
			scrollable,
			size,
			theme,
			toggle,
			unmountOnClose,
			wrapClassName,
			hasOpened,
			_isMounted,
			_triggeringElement,
			_originalBodyPadding,
			_lastIsOpen,
			_lastHasOpened,
			_dialog,
			_mouseDownElement,
			_removeEscListener,
			setFocus,
			init,
			manageFocusAfterClose,
			destroy,
			close,
			handleBackdropClick,
			onModalOpened,
			onModalClosing,
			onModalClosed,
			handleBackdropMouseDown,
			dialogBaseClass,
			outer,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(24, className = $$new_props.className);
			if ('staticModal' in $$props) $$invalidate(0, staticModal = $$new_props.staticModal);
			if ('autoFocus' in $$props) $$invalidate(25, autoFocus = $$new_props.autoFocus);
			if ('body' in $$props) $$invalidate(1, body = $$new_props.body);
			if ('centered' in $$props) $$invalidate(26, centered = $$new_props.centered);
			if ('container' in $$props) $$invalidate(27, container = $$new_props.container);
			if ('fullscreen' in $$props) $$invalidate(28, fullscreen = $$new_props.fullscreen);
			if ('header' in $$props) $$invalidate(2, header = $$new_props.header);
			if ('isOpen' in $$props) $$invalidate(3, isOpen = $$new_props.isOpen);
			if ('keyboard' in $$props) $$invalidate(29, keyboard = $$new_props.keyboard);
			if ('backdrop' in $$props) $$invalidate(4, backdrop = $$new_props.backdrop);
			if ('contentClassName' in $$props) $$invalidate(5, contentClassName = $$new_props.contentClassName);
			if ('fade' in $$props) $$invalidate(6, fade = $$new_props.fade);
			if ('labelledBy' in $$props) $$invalidate(7, labelledBy = $$new_props.labelledBy);
			if ('modalClassName' in $$props) $$invalidate(8, modalClassName = $$new_props.modalClassName);
			if ('modalStyle' in $$props) $$invalidate(9, modalStyle = $$new_props.modalStyle);
			if ('returnFocusAfterClose' in $$props) $$invalidate(30, returnFocusAfterClose = $$new_props.returnFocusAfterClose);
			if ('scrollable' in $$props) $$invalidate(31, scrollable = $$new_props.scrollable);
			if ('size' in $$props) $$invalidate(32, size = $$new_props.size);
			if ('theme' in $$props) $$invalidate(10, theme = $$new_props.theme);
			if ('toggle' in $$props) $$invalidate(11, toggle = $$new_props.toggle);
			if ('unmountOnClose' in $$props) $$invalidate(33, unmountOnClose = $$new_props.unmountOnClose);
			if ('wrapClassName' in $$props) $$invalidate(12, wrapClassName = $$new_props.wrapClassName);
			if ('hasOpened' in $$props) hasOpened = $$new_props.hasOpened;
			if ('_isMounted' in $$props) $$invalidate(13, _isMounted = $$new_props._isMounted);
			if ('_triggeringElement' in $$props) _triggeringElement = $$new_props._triggeringElement;
			if ('_originalBodyPadding' in $$props) _originalBodyPadding = $$new_props._originalBodyPadding;
			if ('_lastIsOpen' in $$props) _lastIsOpen = $$new_props._lastIsOpen;
			if ('_lastHasOpened' in $$props) _lastHasOpened = $$new_props._lastHasOpened;
			if ('_dialog' in $$props) $$invalidate(14, _dialog = $$new_props._dialog);
			if ('_mouseDownElement' in $$props) _mouseDownElement = $$new_props._mouseDownElement;
			if ('_removeEscListener' in $$props) _removeEscListener = $$new_props._removeEscListener;
			if ('outer' in $$props) $$invalidate(15, outer = $$new_props.outer);
			if ('classes' in $$props) $$invalidate(16, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty[0] & /*className, fullscreen, centered*/ 352321536 | $$self.$$.dirty[1] & /*size, scrollable*/ 3) {
				$$invalidate(16, classes = classnames(dialogBaseClass, className, {
					[`modal-${size}`]: size,
					'modal-fullscreen': fullscreen === true,
					[`modal-fullscreen-${fullscreen}-down`]: fullscreen && typeof fullscreen === 'string',
					[`${dialogBaseClass}-centered`]: centered,
					[`${dialogBaseClass}-scrollable`]: scrollable
				}));
			}

			if ($$self.$$.dirty[0] & /*container, staticModal*/ 134217729) {
				$$invalidate(15, outer = container === 'inline' || staticModal
				? InlineContainer
				: Portal);
			}
		};

		return [
			staticModal,
			body,
			header,
			isOpen,
			backdrop,
			contentClassName,
			fade,
			labelledBy,
			modalClassName,
			modalStyle,
			theme,
			toggle,
			wrapClassName,
			_isMounted,
			_dialog,
			outer,
			classes,
			dispatch,
			handleBackdropClick,
			onModalOpened,
			onModalClosing,
			onModalClosed,
			handleBackdropMouseDown,
			$$restProps,
			className,
			autoFocus,
			centered,
			container,
			fullscreen,
			keyboard,
			returnFocusAfterClose,
			scrollable,
			size,
			unmountOnClose,
			slots,
			div1_binding,
			introstart_handler,
			$$scope
		];
	}

	class Modal extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance$b,
				create_fragment$b,
				safe_not_equal,
				{
					class: 24,
					static: 0,
					autoFocus: 25,
					body: 1,
					centered: 26,
					container: 27,
					fullscreen: 28,
					header: 2,
					isOpen: 3,
					keyboard: 29,
					backdrop: 4,
					contentClassName: 5,
					fade: 6,
					labelledBy: 7,
					modalClassName: 8,
					modalStyle: 9,
					returnFocusAfterClose: 30,
					scrollable: 31,
					size: 32,
					theme: 10,
					toggle: 11,
					unmountOnClose: 33,
					wrapClassName: 12
				},
				null,
				[-1, -1]
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Modal",
				options,
				id: create_fragment$b.name
			});
		}

		get class() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get static() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set static(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get autoFocus() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set autoFocus(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get body() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set body(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get centered() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set centered(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get container() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set container(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fullscreen() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fullscreen(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get header() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set header(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get isOpen() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set isOpen(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get keyboard() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set keyboard(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get backdrop() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set backdrop(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get contentClassName() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set contentClassName(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fade() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fade(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get labelledBy() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set labelledBy(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get modalClassName() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set modalClassName(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get modalStyle() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set modalStyle(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get returnFocusAfterClose() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set returnFocusAfterClose(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get scrollable() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set scrollable(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get theme() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set theme(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get toggle() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set toggle(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get unmountOnClose() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set unmountOnClose(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get wrapClassName() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wrapClassName(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Colgroup/Colgroup.svelte generated by Svelte v4.2.19 */
	const file$9 = "node_modules/@sveltestrap/sveltestrap/dist/Colgroup/Colgroup.svelte";

	function create_fragment$a(ctx) {
		let colgroup;
		let current;
		const default_slot_template = /*#slots*/ ctx[1].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

		const block = {
			c: function create() {
				colgroup = element("colgroup");
				if (default_slot) default_slot.c();
				add_location(colgroup, file$9, 6, 0, 92);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, colgroup, anchor);

				if (default_slot) {
					default_slot.m(colgroup, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[0],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(colgroup);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$a.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$a($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Colgroup', slots, ['default']);
		setContext('colgroup', true);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Colgroup> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ setContext });
		return [$$scope, slots];
	}

	class Colgroup extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Colgroup",
				options,
				id: create_fragment$a.name
			});
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/ResponsiveContainer/ResponsiveContainer.svelte generated by Svelte v4.2.19 */
	const file$8 = "node_modules/@sveltestrap/sveltestrap/dist/ResponsiveContainer/ResponsiveContainer.svelte";

	// (16:0) {:else}
	function create_else_block$1(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[4].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[3],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$1.name,
			type: "else",
			source: "(16:0) {:else}",
			ctx
		});

		return block;
	}

	// (14:0) {#if responsive}
	function create_if_block$1(ctx) {
		let div;
		let current;
		const default_slot_template = /*#slots*/ ctx[4].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", /*responsiveClassName*/ ctx[1]);
				add_location(div, file$8, 14, 2, 343);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[3],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*responsiveClassName*/ 2) {
					attr_dev(div, "class", /*responsiveClassName*/ ctx[1]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(14:0) {#if responsive}",
			ctx
		});

		return block;
	}

	function create_fragment$9(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$1, create_else_block$1];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*responsive*/ ctx[0]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$9.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$9($$self, $$props, $$invalidate) {
		let responsiveClassName;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ResponsiveContainer', slots, ['default']);
		let { class: className = '' } = $$props;
		let { responsive = false } = $$props;
		const writable_props = ['class', 'responsive'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ResponsiveContainer> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('class' in $$props) $$invalidate(2, className = $$props.class);
			if ('responsive' in $$props) $$invalidate(0, responsive = $$props.responsive);
			if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			className,
			responsive,
			responsiveClassName
		});

		$$self.$inject_state = $$props => {
			if ('className' in $$props) $$invalidate(2, className = $$props.className);
			if ('responsive' in $$props) $$invalidate(0, responsive = $$props.responsive);
			if ('responsiveClassName' in $$props) $$invalidate(1, responsiveClassName = $$props.responsiveClassName);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*className, responsive*/ 5) {
				$$invalidate(1, responsiveClassName = classnames(className, {
					'table-responsive': responsive === true,
					[`table-responsive-${responsive}`]: typeof responsive === 'string'
				}));
			}
		};

		return [responsive, responsiveClassName, className, $$scope, slots];
	}

	class ResponsiveContainer extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, { class: 2, responsive: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ResponsiveContainer",
				options,
				id: create_fragment$9.name
			});
		}

		get class() {
			throw new Error("<ResponsiveContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<ResponsiveContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get responsive() {
			throw new Error("<ResponsiveContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set responsive(value) {
			throw new Error("<ResponsiveContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/TableFooter/TableFooter.svelte generated by Svelte v4.2.19 */
	const file$7 = "node_modules/@sveltestrap/sveltestrap/dist/TableFooter/TableFooter.svelte";

	function create_fragment$8(ctx) {
		let tfoot;
		let tr;
		let current;
		const default_slot_template = /*#slots*/ ctx[2].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
		let tfoot_levels = [/*$$restProps*/ ctx[0]];
		let tfoot_data = {};

		for (let i = 0; i < tfoot_levels.length; i += 1) {
			tfoot_data = assign(tfoot_data, tfoot_levels[i]);
		}

		const block = {
			c: function create() {
				tfoot = element("tfoot");
				tr = element("tr");
				if (default_slot) default_slot.c();
				add_location(tr, file$7, 7, 2, 117);
				set_attributes(tfoot, tfoot_data);
				add_location(tfoot, file$7, 6, 0, 90);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, tfoot, anchor);
				append_dev(tfoot, tr);

				if (default_slot) {
					default_slot.m(tr, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}

				set_attributes(tfoot, tfoot_data = get_spread_update(tfoot_levels, [dirty & /*$$restProps*/ 1 && /*$$restProps*/ ctx[0]]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(tfoot);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$8.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$8($$self, $$props, $$invalidate) {
		const omit_props_names = [];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TableFooter', slots, ['default']);
		setContext('footer', true);

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(0, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('$$scope' in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({ setContext });
		return [$$restProps, $$scope, slots];
	}

	class TableFooter extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TableFooter",
				options,
				id: create_fragment$8.name
			});
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/TableHeader/TableHeader.svelte generated by Svelte v4.2.19 */
	const file$6 = "node_modules/@sveltestrap/sveltestrap/dist/TableHeader/TableHeader.svelte";

	function create_fragment$7(ctx) {
		let thead;
		let tr;
		let current;
		const default_slot_template = /*#slots*/ ctx[2].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
		let thead_levels = [/*$$restProps*/ ctx[0]];
		let thead_data = {};

		for (let i = 0; i < thead_levels.length; i += 1) {
			thead_data = assign(thead_data, thead_levels[i]);
		}

		const block = {
			c: function create() {
				thead = element("thead");
				tr = element("tr");
				if (default_slot) default_slot.c();
				add_location(tr, file$6, 7, 2, 117);
				set_attributes(thead, thead_data);
				add_location(thead, file$6, 6, 0, 90);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, thead, anchor);
				append_dev(thead, tr);

				if (default_slot) {
					default_slot.m(tr, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[1],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
							null
						);
					}
				}

				set_attributes(thead, thead_data = get_spread_update(thead_levels, [dirty & /*$$restProps*/ 1 && /*$$restProps*/ ctx[0]]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(thead);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$7($$self, $$props, $$invalidate) {
		const omit_props_names = [];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('TableHeader', slots, ['default']);
		setContext('header', true);

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(0, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('$$scope' in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({ setContext });
		return [$$restProps, $$scope, slots];
	}

	class TableHeader extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TableHeader",
				options,
				id: create_fragment$7.name
			});
		}
	}

	/* node_modules/@sveltestrap/sveltestrap/dist/Table/Table.svelte generated by Svelte v4.2.19 */
	const file$5 = "node_modules/@sveltestrap/sveltestrap/dist/Table/Table.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[12] = list[i];
		return child_ctx;
	}

	const get_default_slot_changes = dirty => ({ row: dirty & /*rows*/ 2 });
	const get_default_slot_context = ctx => ({ row: /*row*/ ctx[12] });

	// (88:4) {:else}
	function create_else_block(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[11],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(88:4) {:else}",
			ctx
		});

		return block;
	}

	// (71:4) {#if rows}
	function create_if_block(ctx) {
		let colgroup;
		let t0;
		let tableheader;
		let t1;
		let tbody;
		let t2;
		let tablefooter;
		let current;

		colgroup = new Colgroup({
				props: {
					$$slots: { default: [create_default_slot_3] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		tableheader = new TableHeader({
				props: {
					$$slots: { default: [create_default_slot_2$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		let each_value = ensure_array_like_dev(/*rows*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		tablefooter = new TableFooter({
				props: {
					$$slots: { default: [create_default_slot_1$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(colgroup.$$.fragment);
				t0 = space();
				create_component(tableheader.$$.fragment);
				t1 = space();
				tbody = element("tbody");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t2 = space();
				create_component(tablefooter.$$.fragment);
				add_location(tbody, file$5, 77, 6, 1743);
			},
			m: function mount(target, anchor) {
				mount_component(colgroup, target, anchor);
				insert_dev(target, t0, anchor);
				mount_component(tableheader, target, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, tbody, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(tbody, null);
					}
				}

				insert_dev(target, t2, anchor);
				mount_component(tablefooter, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const colgroup_changes = {};

				if (dirty & /*$$scope*/ 2048) {
					colgroup_changes.$$scope = { dirty, ctx };
				}

				colgroup.$set(colgroup_changes);
				const tableheader_changes = {};

				if (dirty & /*$$scope*/ 2048) {
					tableheader_changes.$$scope = { dirty, ctx };
				}

				tableheader.$set(tableheader_changes);

				if (dirty & /*$$scope, rows*/ 2050) {
					each_value = ensure_array_like_dev(/*rows*/ ctx[1]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(tbody, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				const tablefooter_changes = {};

				if (dirty & /*$$scope*/ 2048) {
					tablefooter_changes.$$scope = { dirty, ctx };
				}

				tablefooter.$set(tablefooter_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(colgroup.$$.fragment, local);
				transition_in(tableheader.$$.fragment, local);

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				transition_in(tablefooter.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(colgroup.$$.fragment, local);
				transition_out(tableheader.$$.fragment, local);
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				transition_out(tablefooter.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
					detach_dev(tbody);
					detach_dev(t2);
				}

				destroy_component(colgroup, detaching);
				destroy_component(tableheader, detaching);
				destroy_each(each_blocks, detaching);
				destroy_component(tablefooter, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(71:4) {#if rows}",
			ctx
		});

		return block;
	}

	// (72:6) <Colgroup>
	function create_default_slot_3(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[11],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_3.name,
			type: "slot",
			source: "(72:6) <Colgroup>",
			ctx
		});

		return block;
	}

	// (75:6) <TableHeader>
	function create_default_slot_2$1(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[11],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_2$1.name,
			type: "slot",
			source: "(75:6) <TableHeader>",
			ctx
		});

		return block;
	}

	// (79:8) {#each rows as row}
	function create_each_block$1(ctx) {
		let tr;
		let t;
		let current;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], get_default_slot_context);

		const block = {
			c: function create() {
				tr = element("tr");
				if (default_slot) default_slot.c();
				t = space();
				add_location(tr, file$5, 79, 10, 1789);
			},
			m: function mount(target, anchor) {
				insert_dev(target, tr, anchor);

				if (default_slot) {
					default_slot.m(tr, null);
				}

				append_dev(tr, t);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope, rows*/ 2050)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[11],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, get_default_slot_changes),
							get_default_slot_context
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(tr);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(79:8) {#each rows as row}",
			ctx
		});

		return block;
	}

	// (85:6) <TableFooter>
	function create_default_slot_1$2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[11],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
							null
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$2.name,
			type: "slot",
			source: "(85:6) <TableFooter>",
			ctx
		});

		return block;
	}

	// (69:0) <ResponsiveContainer {responsive}>
	function create_default_slot$3(ctx) {
		let table;
		let current_block_type_index;
		let if_block;
		let current;
		const if_block_creators = [create_if_block, create_else_block];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*rows*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		let table_levels = [/*$$restProps*/ ctx[3], { class: /*classes*/ ctx[2] }];
		let table_data = {};

		for (let i = 0; i < table_levels.length; i += 1) {
			table_data = assign(table_data, table_levels[i]);
		}

		const block = {
			c: function create() {
				table = element("table");
				if_block.c();
				set_attributes(table, table_data);
				add_location(table, file$5, 69, 2, 1571);
			},
			m: function mount(target, anchor) {
				insert_dev(target, table, anchor);
				if_blocks[current_block_type_index].m(table, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(table, null);
				}

				set_attributes(table, table_data = get_spread_update(table_levels, [
					dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
					(!current || dirty & /*classes*/ 4) && { class: /*classes*/ ctx[2] }
				]));
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(table);
				}

				if_blocks[current_block_type_index].d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$3.name,
			type: "slot",
			source: "(69:0) <ResponsiveContainer {responsive}>",
			ctx
		});

		return block;
	}

	function create_fragment$6(ctx) {
		let responsivecontainer;
		let current;

		responsivecontainer = new ResponsiveContainer({
				props: {
					responsive: /*responsive*/ ctx[0],
					$$slots: { default: [create_default_slot$3] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(responsivecontainer.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(responsivecontainer, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const responsivecontainer_changes = {};
				if (dirty & /*responsive*/ 1) responsivecontainer_changes.responsive = /*responsive*/ ctx[0];

				if (dirty & /*$$scope, $$restProps, classes, rows*/ 2062) {
					responsivecontainer_changes.$$scope = { dirty, ctx };
				}

				responsivecontainer.$set(responsivecontainer_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(responsivecontainer.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(responsivecontainer.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(responsivecontainer, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let classes;
		const omit_props_names = ["class","size","bordered","borderless","striped","hover","responsive","rows"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Table', slots, ['default']);
		let { class: className = '' } = $$props;
		let { size = '' } = $$props;
		let { bordered = false } = $$props;
		let { borderless = false } = $$props;
		let { striped = false } = $$props;
		let { hover = false } = $$props;
		let { responsive = false } = $$props;
		let { rows = undefined } = $$props;

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('class' in $$new_props) $$invalidate(4, className = $$new_props.class);
			if ('size' in $$new_props) $$invalidate(5, size = $$new_props.size);
			if ('bordered' in $$new_props) $$invalidate(6, bordered = $$new_props.bordered);
			if ('borderless' in $$new_props) $$invalidate(7, borderless = $$new_props.borderless);
			if ('striped' in $$new_props) $$invalidate(8, striped = $$new_props.striped);
			if ('hover' in $$new_props) $$invalidate(9, hover = $$new_props.hover);
			if ('responsive' in $$new_props) $$invalidate(0, responsive = $$new_props.responsive);
			if ('rows' in $$new_props) $$invalidate(1, rows = $$new_props.rows);
			if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			classnames,
			Colgroup,
			ResponsiveContainer,
			TableFooter,
			TableHeader,
			className,
			size,
			bordered,
			borderless,
			striped,
			hover,
			responsive,
			rows,
			classes
		});

		$$self.$inject_state = $$new_props => {
			if ('className' in $$props) $$invalidate(4, className = $$new_props.className);
			if ('size' in $$props) $$invalidate(5, size = $$new_props.size);
			if ('bordered' in $$props) $$invalidate(6, bordered = $$new_props.bordered);
			if ('borderless' in $$props) $$invalidate(7, borderless = $$new_props.borderless);
			if ('striped' in $$props) $$invalidate(8, striped = $$new_props.striped);
			if ('hover' in $$props) $$invalidate(9, hover = $$new_props.hover);
			if ('responsive' in $$props) $$invalidate(0, responsive = $$new_props.responsive);
			if ('rows' in $$props) $$invalidate(1, rows = $$new_props.rows);
			if ('classes' in $$props) $$invalidate(2, classes = $$new_props.classes);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*className, size, bordered, borderless, striped, hover*/ 1008) {
				$$invalidate(2, classes = classnames(className, 'table', size ? 'table-' + size : false, bordered ? 'table-bordered' : false, borderless ? 'table-borderless' : false, striped ? 'table-striped' : false, hover ? 'table-hover' : false));
			}
		};

		return [
			responsive,
			rows,
			classes,
			$$restProps,
			className,
			size,
			bordered,
			borderless,
			striped,
			hover,
			slots,
			$$scope
		];
	}

	class Table extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$6, create_fragment$6, safe_not_equal, {
				class: 4,
				size: 5,
				bordered: 6,
				borderless: 7,
				striped: 8,
				hover: 9,
				responsive: 0,
				rows: 1
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Table",
				options,
				id: create_fragment$6.name
			});
		}

		get class() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bordered() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bordered(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get borderless() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set borderless(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get striped() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set striped(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get hover() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set hover(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get responsive() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set responsive(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get rows() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set rows(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	const colorMode = writable(getInitialColorMode());

	colorMode.subscribe((mode) => useColorMode(mode));

	function getInitialColorMode() {
	  const currentTheme = globalThis.document?.documentElement.getAttribute('data-bs-theme') || 'light';
	  const prefersDarkMode =
	    typeof globalThis.window?.matchMedia === 'function'
	      ? globalThis.window?.matchMedia('(prefers-color-scheme: dark)').matches
	      : false;

	  return currentTheme === 'dark' || (currentTheme === 'auto' && prefersDarkMode) ? 'dark' : 'light';
	}

	function useColorMode(element, mode) {
	  let target = element;

	  if (arguments.length === 1) {
	    target = globalThis.document?.documentElement;

	    if (!target) {
	      return;
	    }

	    mode = element;
	    colorMode.update(() => mode);
	  }

	  target.setAttribute('data-bs-theme', mode);
	}

	/* src/components/DeleteAction.svelte generated by Svelte v4.2.19 */

	const { console: console_1$2 } = globals;

	// (20:0) <Button color="danger" on:click= {handleDelete}>
	function create_default_slot$2(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Delete");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$2.name,
			type: "slot",
			source: "(20:0) <Button color=\\\"danger\\\" on:click= {handleDelete}>",
			ctx
		});

		return block;
	}

	function create_fragment$5(ctx) {
		let button;
		let current;

		button = new Button({
				props: {
					color: "danger",
					$$slots: { default: [create_default_slot$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*handleDelete*/ ctx[0]);

		const block = {
			c: function create() {
				create_component(button.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(button, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const button_changes = {};

				if (dirty & /*$$scope*/ 16) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(button.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(button.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(button, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('DeleteAction', slots, []);
		let { make } = $$props;
		let { model } = $$props;
		let { year } = $$props;

		const handleDelete = async event => {
			event.preventDefault();
			const carId = await fetchCarId(make, model, parseInt(year));
			console.log(carId);
			const response = await deleteCar(carId);
			console.log(response);
		}; // send data to the api

		$$self.$$.on_mount.push(function () {
			if (make === undefined && !('make' in $$props || $$self.$$.bound[$$self.$$.props['make']])) {
				console_1$2.warn("<DeleteAction> was created without expected prop 'make'");
			}

			if (model === undefined && !('model' in $$props || $$self.$$.bound[$$self.$$.props['model']])) {
				console_1$2.warn("<DeleteAction> was created without expected prop 'model'");
			}

			if (year === undefined && !('year' in $$props || $$self.$$.bound[$$self.$$.props['year']])) {
				console_1$2.warn("<DeleteAction> was created without expected prop 'year'");
			}
		});

		const writable_props = ['make', 'model', 'year'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<DeleteAction> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('make' in $$props) $$invalidate(1, make = $$props.make);
			if ('model' in $$props) $$invalidate(2, model = $$props.model);
			if ('year' in $$props) $$invalidate(3, year = $$props.year);
		};

		$$self.$capture_state = () => ({
			Button,
			deleteCar,
			fetchCarId,
			make,
			model,
			year,
			handleDelete
		});

		$$self.$inject_state = $$props => {
			if ('make' in $$props) $$invalidate(1, make = $$props.make);
			if ('model' in $$props) $$invalidate(2, model = $$props.model);
			if ('year' in $$props) $$invalidate(3, year = $$props.year);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [handleDelete, make, model, year];
	}

	class DeleteAction extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { make: 1, model: 2, year: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DeleteAction",
				options,
				id: create_fragment$5.name
			});
		}

		get make() {
			throw new Error("<DeleteAction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set make(value) {
			throw new Error("<DeleteAction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get model() {
			throw new Error("<DeleteAction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set model(value) {
			throw new Error("<DeleteAction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get year() {
			throw new Error("<DeleteAction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set year(value) {
			throw new Error("<DeleteAction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/CarsList.svelte generated by Svelte v4.2.19 */

	const { console: console_1$1 } = globals;
	const file$4 = "src/components/CarsList.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[1] = list[i];
		return child_ctx;
	}

	// (34:12) <Button color="primary">
	function create_default_slot_1$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Edit");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$1.name,
			type: "slot",
			source: "(34:12) <Button color=\\\"primary\\\">",
			ctx
		});

		return block;
	}

	// (27:6) {#each cars as car}
	function create_each_block(ctx) {
		let tr;
		let td0;
		let t0_value = /*car*/ ctx[1].make + "";
		let t0;
		let t1;
		let td1;
		let t2_value = /*car*/ ctx[1].model + "";
		let t2;
		let t3;
		let td2;
		let t4_value = /*car*/ ctx[1].year + "";
		let t4;
		let t5;
		let td3;
		let t6_value = /*car*/ ctx[1].stockLevel + "";
		let t6;
		let t7;
		let td4;
		let button;
		let t8;
		let deleteaction;
		let t9;
		let current;

		button = new Button({
				props: {
					color: "primary",
					$$slots: { default: [create_default_slot_1$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		deleteaction = new DeleteAction({
				props: {
					make: /*car*/ ctx[1].make,
					model: /*car*/ ctx[1].model,
					year: parseInt(/*car*/ ctx[1].year, 10)
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				tr = element("tr");
				td0 = element("td");
				t0 = text(t0_value);
				t1 = space();
				td1 = element("td");
				t2 = text(t2_value);
				t3 = space();
				td2 = element("td");
				t4 = text(t4_value);
				t5 = space();
				td3 = element("td");
				t6 = text(t6_value);
				t7 = space();
				td4 = element("td");
				create_component(button.$$.fragment);
				t8 = space();
				create_component(deleteaction.$$.fragment);
				t9 = space();
				add_location(td0, file$4, 28, 8, 608);
				add_location(td1, file$4, 29, 8, 636);
				add_location(td2, file$4, 30, 8, 665);
				add_location(td3, file$4, 31, 8, 693);
				add_location(td4, file$4, 32, 8, 727);
				add_location(tr, file$4, 27, 6, 595);
			},
			m: function mount(target, anchor) {
				insert_dev(target, tr, anchor);
				append_dev(tr, td0);
				append_dev(td0, t0);
				append_dev(tr, t1);
				append_dev(tr, td1);
				append_dev(td1, t2);
				append_dev(tr, t3);
				append_dev(tr, td2);
				append_dev(td2, t4);
				append_dev(tr, t5);
				append_dev(tr, td3);
				append_dev(td3, t6);
				append_dev(tr, t7);
				append_dev(tr, td4);
				mount_component(button, td4, null);
				append_dev(td4, t8);
				mount_component(deleteaction, td4, null);
				append_dev(tr, t9);
				current = true;
			},
			p: function update(ctx, dirty) {
				if ((!current || dirty & /*cars*/ 1) && t0_value !== (t0_value = /*car*/ ctx[1].make + "")) set_data_dev(t0, t0_value);
				if ((!current || dirty & /*cars*/ 1) && t2_value !== (t2_value = /*car*/ ctx[1].model + "")) set_data_dev(t2, t2_value);
				if ((!current || dirty & /*cars*/ 1) && t4_value !== (t4_value = /*car*/ ctx[1].year + "")) set_data_dev(t4, t4_value);
				if ((!current || dirty & /*cars*/ 1) && t6_value !== (t6_value = /*car*/ ctx[1].stockLevel + "")) set_data_dev(t6, t6_value);
				const button_changes = {};

				if (dirty & /*$$scope*/ 16) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);
				const deleteaction_changes = {};
				if (dirty & /*cars*/ 1) deleteaction_changes.make = /*car*/ ctx[1].make;
				if (dirty & /*cars*/ 1) deleteaction_changes.model = /*car*/ ctx[1].model;
				if (dirty & /*cars*/ 1) deleteaction_changes.year = parseInt(/*car*/ ctx[1].year, 10);
				deleteaction.$set(deleteaction_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(button.$$.fragment, local);
				transition_in(deleteaction.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(button.$$.fragment, local);
				transition_out(deleteaction.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(tr);
				}

				destroy_component(button);
				destroy_component(deleteaction);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(27:6) {#each cars as car}",
			ctx
		});

		return block;
	}

	// (16:0) <Table bordered>
	function create_default_slot$1(ctx) {
		let thead;
		let tr;
		let th0;
		let t1;
		let th1;
		let t3;
		let th2;
		let t5;
		let th3;
		let t7;
		let th4;
		let t9;
		let tbody;
		let current;
		let each_value = ensure_array_like_dev(/*cars*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				thead = element("thead");
				tr = element("tr");
				th0 = element("th");
				th0.textContent = "Make";
				t1 = space();
				th1 = element("th");
				th1.textContent = "Model";
				t3 = space();
				th2 = element("th");
				th2.textContent = "Year";
				t5 = space();
				th3 = element("th");
				th3.textContent = "Stock Level";
				t7 = space();
				th4 = element("th");
				th4.textContent = "Actions";
				t9 = space();
				tbody = element("tbody");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				add_location(th0, file$4, 18, 8, 413);
				add_location(th1, file$4, 19, 8, 435);
				add_location(th2, file$4, 20, 8, 458);
				add_location(th3, file$4, 21, 8, 480);
				add_location(th4, file$4, 22, 8, 509);
				add_location(tr, file$4, 17, 6, 400);
				add_location(thead, file$4, 16, 4, 386);
				add_location(tbody, file$4, 25, 4, 555);
			},
			m: function mount(target, anchor) {
				insert_dev(target, thead, anchor);
				append_dev(thead, tr);
				append_dev(tr, th0);
				append_dev(tr, t1);
				append_dev(tr, th1);
				append_dev(tr, t3);
				append_dev(tr, th2);
				append_dev(tr, t5);
				append_dev(tr, th3);
				append_dev(tr, t7);
				append_dev(tr, th4);
				insert_dev(target, t9, anchor);
				insert_dev(target, tbody, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(tbody, null);
					}
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*cars, parseInt*/ 1) {
					each_value = ensure_array_like_dev(/*cars*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(tbody, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(thead);
					detach_dev(t9);
					detach_dev(tbody);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$1.name,
			type: "slot",
			source: "(16:0) <Table bordered>",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let table;
		let current;

		table = new Table({
				props: {
					bordered: true,
					$$slots: { default: [create_default_slot$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(table.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(table, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const table_changes = {};

				if (dirty & /*$$scope, cars*/ 17) {
					table_changes.$$scope = { dirty, ctx };
				}

				table.$set(table_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(table.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(table.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(table, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('CarsList', slots, []);
		let cars = [];

		onMount(async () => {
			$$invalidate(0, cars = await fetchCars());
			console.log(cars);
			console.log("i am zimo");
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<CarsList> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			onMount,
			fetchCars,
			Table,
			Button,
			DeleteAction,
			cars
		});

		$$self.$inject_state = $$props => {
			if ('cars' in $$props) $$invalidate(0, cars = $$props.cars);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [cars];
	}

	class CarsList extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "CarsList",
				options,
				id: create_fragment$4.name
			});
		}
	}

	/* src/components/DeleteCar.svelte generated by Svelte v4.2.19 */

	const { console: console_1 } = globals;
	const file$3 = "src/components/DeleteCar.svelte";

	function create_fragment$3(ctx) {
		let h1;
		let t1;
		let form;
		let div0;
		let label0;
		let t3;
		let input0;
		let t4;
		let div1;
		let label1;
		let t6;
		let input1;
		let t7;
		let div2;
		let label2;
		let t9;
		let input2;
		let t10;
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Delete a Car";
				t1 = space();
				form = element("form");
				div0 = element("div");
				label0 = element("label");
				label0.textContent = "Year:";
				t3 = space();
				input0 = element("input");
				t4 = space();
				div1 = element("div");
				label1 = element("label");
				label1.textContent = "Make:";
				t6 = space();
				input1 = element("input");
				t7 = space();
				div2 = element("div");
				label2 = element("label");
				label2.textContent = "Model:";
				t9 = space();
				input2 = element("input");
				t10 = space();
				button = element("button");
				button.textContent = "Submit";
				add_location(h1, file$3, 20, 0, 509);
				attr_dev(label0, "for", "year");
				add_location(label0, file$3, 23, 8, 583);
				attr_dev(input0, "type", "number");
				attr_dev(input0, "id", "year");
				attr_dev(input0, "name", "year");
				add_location(input0, file$3, 24, 8, 625);
				add_location(div0, file$3, 22, 4, 569);
				attr_dev(label1, "for", "make");
				add_location(label1, file$3, 27, 8, 720);
				attr_dev(input1, "type", "text");
				attr_dev(input1, "id", "make");
				attr_dev(input1, "name", "make");
				add_location(input1, file$3, 28, 8, 762);
				add_location(div1, file$3, 26, 4, 706);
				attr_dev(label2, "for", "model");
				add_location(label2, file$3, 31, 8, 855);
				attr_dev(input2, "type", "text");
				attr_dev(input2, "id", "model");
				attr_dev(input2, "name", "model");
				add_location(input2, file$3, 32, 8, 899);
				add_location(div2, file$3, 30, 4, 841);
				attr_dev(button, "type", "submit");
				add_location(button, file$3, 34, 4, 981);
				add_location(form, file$3, 21, 0, 531);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, form, anchor);
				append_dev(form, div0);
				append_dev(div0, label0);
				append_dev(div0, t3);
				append_dev(div0, input0);
				set_input_value(input0, /*year*/ ctx[0]);
				append_dev(form, t4);
				append_dev(form, div1);
				append_dev(div1, label1);
				append_dev(div1, t6);
				append_dev(div1, input1);
				set_input_value(input1, /*make*/ ctx[1]);
				append_dev(form, t7);
				append_dev(form, div2);
				append_dev(div2, label2);
				append_dev(div2, t9);
				append_dev(div2, input2);
				set_input_value(input2, /*model*/ ctx[2]);
				append_dev(form, t10);
				append_dev(form, button);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
						listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
						listen_dev(form, "submit", /*handleDelete*/ ctx[3], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*year*/ 1 && to_number(input0.value) !== /*year*/ ctx[0]) {
					set_input_value(input0, /*year*/ ctx[0]);
				}

				if (dirty & /*make*/ 2 && input1.value !== /*make*/ ctx[1]) {
					set_input_value(input1, /*make*/ ctx[1]);
				}

				if (dirty & /*model*/ 4 && input2.value !== /*model*/ ctx[2]) {
					set_input_value(input2, /*model*/ ctx[2]);
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
					detach_dev(form);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('DeleteCar', slots, []);
		let year = 0;
		let make = '';
		let model = '';

		const handleDelete = async event => {
			event.preventDefault();
			const carId = await fetchCarId(make, model, year);
			console.log(carId);
			const response = await deleteCar(carId);
			console.log(response);
			$$invalidate(0, year = "");
			$$invalidate(1, make = "");
			$$invalidate(2, model = "");
		}; // send data to the api

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<DeleteCar> was created with unknown prop '${key}'`);
		});

		function input0_input_handler() {
			year = to_number(this.value);
			$$invalidate(0, year);
		}

		function input1_input_handler() {
			make = this.value;
			$$invalidate(1, make);
		}

		function input2_input_handler() {
			model = this.value;
			$$invalidate(2, model);
		}

		$$self.$capture_state = () => ({
			deleteCar,
			fetchCarId,
			year,
			make,
			model,
			handleDelete
		});

		$$self.$inject_state = $$props => {
			if ('year' in $$props) $$invalidate(0, year = $$props.year);
			if ('make' in $$props) $$invalidate(1, make = $$props.make);
			if ('model' in $$props) $$invalidate(2, model = $$props.model);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			year,
			make,
			model,
			handleDelete,
			input0_input_handler,
			input1_input_handler,
			input2_input_handler
		];
	}

	class DeleteCar extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DeleteCar",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src/components/AddUsersForm.svelte generated by Svelte v4.2.19 */
	const file$2 = "src/components/AddUsersForm.svelte";

	// (27:4) <Button on:click= {toggle} color = "secondary" >
	function create_default_slot_2(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Add A New Car");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_2.name,
			type: "slot",
			source: "(27:4) <Button on:click= {toggle} color = \\\"secondary\\\" >",
			ctx
		});

		return block;
	}

	// (46:12) <Button on:click = {handleSubmit} color="primary">
	function create_default_slot_1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Submit");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1.name,
			type: "slot",
			source: "(46:12) <Button on:click = {handleSubmit} color=\\\"primary\\\">",
			ctx
		});

		return block;
	}

	// (28:4) <Modal body header="Add A New Car" isOpen={open} {toggle}>
	function create_default_slot(ctx) {
		let div4;
		let div0;
		let span0;
		let t1;
		let input0;
		let updating_value;
		let t2;
		let div1;
		let span1;
		let t4;
		let input1;
		let updating_value_1;
		let t5;
		let div2;
		let span2;
		let t7;
		let input2;
		let updating_value_2;
		let t8;
		let div3;
		let span3;
		let t10;
		let input3;
		let updating_value_3;
		let t11;
		let button;
		let current;

		function input0_value_binding(value) {
			/*input0_value_binding*/ ctx[7](value);
		}

		let input0_props = { type: "email", placeholder: "make" };

		if (/*make*/ ctx[2] !== void 0) {
			input0_props.value = /*make*/ ctx[2];
		}

		input0 = new Input({ props: input0_props, $$inline: true });
		binding_callbacks.push(() => bind$1(input0, 'value', input0_value_binding));

		function input1_value_binding(value) {
			/*input1_value_binding*/ ctx[8](value);
		}

		let input1_props = { type: "email", placeholder: "model" };

		if (/*model*/ ctx[3] !== void 0) {
			input1_props.value = /*model*/ ctx[3];
		}

		input1 = new Input({ props: input1_props, $$inline: true });
		binding_callbacks.push(() => bind$1(input1, 'value', input1_value_binding));

		function input2_value_binding(value) {
			/*input2_value_binding*/ ctx[9](value);
		}

		let input2_props = { type: "email", placeholder: "year" };

		if (/*year*/ ctx[1] !== void 0) {
			input2_props.value = /*year*/ ctx[1];
		}

		input2 = new Input({ props: input2_props, $$inline: true });
		binding_callbacks.push(() => bind$1(input2, 'value', input2_value_binding));

		function input3_value_binding(value) {
			/*input3_value_binding*/ ctx[10](value);
		}

		let input3_props = {
			type: "email",
			placeholder: "stock (optional field)"
		};

		if (/*stocklevel*/ ctx[4] !== void 0) {
			input3_props.value = /*stocklevel*/ ctx[4];
		}

		input3 = new Input({ props: input3_props, $$inline: true });
		binding_callbacks.push(() => bind$1(input3, 'value', input3_value_binding));

		button = new Button({
				props: {
					color: "primary",
					$$slots: { default: [create_default_slot_1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*handleSubmit*/ ctx[6]);

		const block = {
			c: function create() {
				div4 = element("div");
				div0 = element("div");
				span0 = element("span");
				span0.textContent = "Make:";
				t1 = space();
				create_component(input0.$$.fragment);
				t2 = space();
				div1 = element("div");
				span1 = element("span");
				span1.textContent = "Model:";
				t4 = space();
				create_component(input1.$$.fragment);
				t5 = space();
				div2 = element("div");
				span2 = element("span");
				span2.textContent = "Year:";
				t7 = space();
				create_component(input2.$$.fragment);
				t8 = space();
				div3 = element("div");
				span3 = element("span");
				span3.textContent = "Stock Number:";
				t10 = space();
				create_component(input3.$$.fragment);
				t11 = space();
				create_component(button.$$.fragment);
				add_location(span0, file$2, 30, 16, 847);
				attr_dev(div0, "class", "make svelte-6e42dr");
				add_location(div0, file$2, 29, 12, 810);
				add_location(span1, file$2, 34, 16, 1011);
				attr_dev(div1, "class", "make svelte-6e42dr");
				add_location(div1, file$2, 33, 12, 974);
				add_location(span2, file$2, 38, 16, 1178);
				attr_dev(div2, "class", "make svelte-6e42dr");
				add_location(div2, file$2, 37, 12, 1141);
				add_location(span3, file$2, 42, 16, 1342);
				attr_dev(div3, "class", "make svelte-6e42dr");
				add_location(div3, file$2, 41, 12, 1305);
				add_location(div4, file$2, 28, 8, 792);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div4, anchor);
				append_dev(div4, div0);
				append_dev(div0, span0);
				append_dev(div0, t1);
				mount_component(input0, div0, null);
				append_dev(div4, t2);
				append_dev(div4, div1);
				append_dev(div1, span1);
				append_dev(div1, t4);
				mount_component(input1, div1, null);
				append_dev(div4, t5);
				append_dev(div4, div2);
				append_dev(div2, span2);
				append_dev(div2, t7);
				mount_component(input2, div2, null);
				append_dev(div4, t8);
				append_dev(div4, div3);
				append_dev(div3, span3);
				append_dev(div3, t10);
				mount_component(input3, div3, null);
				append_dev(div4, t11);
				mount_component(button, div4, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const input0_changes = {};

				if (!updating_value && dirty & /*make*/ 4) {
					updating_value = true;
					input0_changes.value = /*make*/ ctx[2];
					add_flush_callback(() => updating_value = false);
				}

				input0.$set(input0_changes);
				const input1_changes = {};

				if (!updating_value_1 && dirty & /*model*/ 8) {
					updating_value_1 = true;
					input1_changes.value = /*model*/ ctx[3];
					add_flush_callback(() => updating_value_1 = false);
				}

				input1.$set(input1_changes);
				const input2_changes = {};

				if (!updating_value_2 && dirty & /*year*/ 2) {
					updating_value_2 = true;
					input2_changes.value = /*year*/ ctx[1];
					add_flush_callback(() => updating_value_2 = false);
				}

				input2.$set(input2_changes);
				const input3_changes = {};

				if (!updating_value_3 && dirty & /*stocklevel*/ 16) {
					updating_value_3 = true;
					input3_changes.value = /*stocklevel*/ ctx[4];
					add_flush_callback(() => updating_value_3 = false);
				}

				input3.$set(input3_changes);
				const button_changes = {};

				if (dirty & /*$$scope*/ 2048) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(input0.$$.fragment, local);
				transition_in(input1.$$.fragment, local);
				transition_in(input2.$$.fragment, local);
				transition_in(input3.$$.fragment, local);
				transition_in(button.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(input0.$$.fragment, local);
				transition_out(input1.$$.fragment, local);
				transition_out(input2.$$.fragment, local);
				transition_out(input3.$$.fragment, local);
				transition_out(button.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div4);
				}

				destroy_component(input0);
				destroy_component(input1);
				destroy_component(input2);
				destroy_component(input3);
				destroy_component(button);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(28:4) <Modal body header=\\\"Add A New Car\\\" isOpen={open} {toggle}>",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let div;
		let button;
		let t;
		let modal;
		let current;

		button = new Button({
				props: {
					color: "secondary",
					$$slots: { default: [create_default_slot_2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*toggle*/ ctx[5]);

		modal = new Modal({
				props: {
					body: true,
					header: "Add A New Car",
					isOpen: /*open*/ ctx[0],
					toggle: /*toggle*/ ctx[5],
					$$slots: { default: [create_default_slot] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(button.$$.fragment);
				t = space();
				create_component(modal.$$.fragment);
				add_location(div, file$2, 25, 0, 640);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(button, div, null);
				append_dev(div, t);
				mount_component(modal, div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const button_changes = {};

				if (dirty & /*$$scope*/ 2048) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);
				const modal_changes = {};
				if (dirty & /*open*/ 1) modal_changes.isOpen = /*open*/ ctx[0];

				if (dirty & /*$$scope, stocklevel, year, model, make*/ 2078) {
					modal_changes.$$scope = { dirty, ctx };
				}

				modal.$set(modal_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(button.$$.fragment, local);
				transition_in(modal.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(button.$$.fragment, local);
				transition_out(modal.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(button);
				destroy_component(modal);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('AddUsersForm', slots, []);
		let open = false;
		const toggle = () => $$invalidate(0, open = !open);
		let year = '';
		let make = '';
		let model = '';
		let stocklevel = 0;

		const handleSubmit = async event => {
			event.preventDefault();

			const newCar = {
				year: parseInt(year),
				make,
				model,
				stocklevel: parseInt(stocklevel)
			};

			await addCar(newCar);
			$$invalidate(1, year = "");
			$$invalidate(2, make = "");
			$$invalidate(3, model = "");
			$$invalidate(4, stocklevel = "");

			// send data to the api
			$$invalidate(0, open = false);
		};

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddUsersForm> was created with unknown prop '${key}'`);
		});

		function input0_value_binding(value) {
			make = value;
			$$invalidate(2, make);
		}

		function input1_value_binding(value) {
			model = value;
			$$invalidate(3, model);
		}

		function input2_value_binding(value) {
			year = value;
			$$invalidate(1, year);
		}

		function input3_value_binding(value) {
			stocklevel = value;
			$$invalidate(4, stocklevel);
		}

		$$self.$capture_state = () => ({
			Button,
			Modal,
			Input,
			addCar,
			open,
			toggle,
			year,
			make,
			model,
			stocklevel,
			handleSubmit
		});

		$$self.$inject_state = $$props => {
			if ('open' in $$props) $$invalidate(0, open = $$props.open);
			if ('year' in $$props) $$invalidate(1, year = $$props.year);
			if ('make' in $$props) $$invalidate(2, make = $$props.make);
			if ('model' in $$props) $$invalidate(3, model = $$props.model);
			if ('stocklevel' in $$props) $$invalidate(4, stocklevel = $$props.stocklevel);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			open,
			year,
			make,
			model,
			stocklevel,
			toggle,
			handleSubmit,
			input0_value_binding,
			input1_value_binding,
			input2_value_binding,
			input3_value_binding
		];
	}

	class AddUsersForm extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "AddUsersForm",
				options,
				id: create_fragment$2.name
			});
		}
	}

	/* src/pages/HomePage.svelte generated by Svelte v4.2.19 */
	const file$1 = "src/pages/HomePage.svelte";

	function create_fragment$1(ctx) {
		let div;
		let h1;
		let t1;
		let addusersform;
		let t2;
		let carslist;
		let current;
		addusersform = new AddUsersForm({ $$inline: true });
		carslist = new CarsList({ $$inline: true });

		const block = {
			c: function create() {
				div = element("div");
				h1 = element("h1");
				h1.textContent = "Car Stock Management System";
				t1 = space();
				create_component(addusersform.$$.fragment);
				t2 = space();
				create_component(carslist.$$.fragment);
				add_location(h1, file$1, 7, 2, 206);
				add_location(div, file$1, 6, 0, 198);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h1);
				append_dev(div, t1);
				mount_component(addusersform, div, null);
				append_dev(div, t2);
				mount_component(carslist, div, null);
				current = true;
			},
			p: noop$1,
			i: function intro(local) {
				if (current) return;
				transition_in(addusersform.$$.fragment, local);
				transition_in(carslist.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(addusersform.$$.fragment, local);
				transition_out(carslist.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(addusersform);
				destroy_component(carslist);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('HomePage', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HomePage> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ CarsList, Table, AddUsersForm });
		return [];
	}

	class HomePage extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "HomePage",
				options,
				id: create_fragment$1.name
			});
		}
	}

	/* src/App.svelte generated by Svelte v4.2.19 */
	const file = "src/App.svelte";

	function create_fragment(ctx) {
		let link;
		let t0;
		let ul;
		let homepage;
		let t1;
		let deletecar;
		let current;
		homepage = new HomePage({ $$inline: true });
		deletecar = new DeleteCar({ $$inline: true });

		const block = {
			c: function create() {
				link = element("link");
				t0 = space();
				ul = element("ul");
				create_component(homepage.$$.fragment);
				t1 = space();
				create_component(deletecar.$$.fragment);
				attr_dev(link, "rel", "stylesheet");
				attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
				add_location(link, file, 7, 2, 203);
				add_location(ul, file, 10, 0, 322);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, link);
				insert_dev(target, t0, anchor);
				insert_dev(target, ul, anchor);
				mount_component(homepage, ul, null);
				append_dev(ul, t1);
				mount_component(deletecar, ul, null);
				current = true;
			},
			p: noop$1,
			i: function intro(local) {
				if (current) return;
				transition_in(homepage.$$.fragment, local);
				transition_in(deletecar.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(homepage.$$.fragment, local);
				transition_out(deletecar.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(ul);
				}

				detach_dev(link);
				destroy_component(homepage);
				destroy_component(deletecar);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ CarsList, DeleteCar, HomePage });
		return [];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
		target: document.body,
		props: {
			name: 'world'
		}
	});

	return app;

})();
//# sourceMappingURL=bundle.js.map
