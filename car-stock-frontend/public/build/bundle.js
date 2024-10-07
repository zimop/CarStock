
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop$1() {}

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

	/** @returns {void} */
	function validate_store(store, name) {
		if (store != null && typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop$1;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
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

	/** @returns {{}} */
	function compute_slots(slots) {
		const result = {};
		for (const key in slots) {
			result[key] = true;
		}
		return result;
	}

	function set_store_value(store, ret, value) {
		store.set(value);
		return ret;
	}

	function action_destroyer(action_result) {
		return action_result && is_function(action_result.destroy) ? action_result.destroy : noop$1;
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
	function listen$1(node, event, handler, options) {
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

	/**
	 * Retrieves the context that belongs to the closest parent component with the specified `key`.
	 * Must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#getcontext
	 * @template T
	 * @param {any} key
	 * @returns {T}
	 */
	function getContext(key) {
		return get_current_component().$$.context.get(key);
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
		const dispose = listen$1(node, event, handler, options);
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
	    return response.data;
	};

	const deleteCar = async (id) => {
	    const response = await axios$1.delete(`${API_URL}/${id}`);
	    return response.data;
	};

	/* src\components\CarsList.svelte generated by Svelte v4.2.19 */

	const { console: console_1$1 } = globals;
	const file$e = "src\\components\\CarsList.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[1] = list[i];
		return child_ctx;
	}

	// (15:4) {#each cars as car}
	function create_each_block$1(ctx) {
		let li0;
		let t0;
		let t1_value = /*car*/ ctx[1].make + "";
		let t1;
		let t2;
		let li1;
		let t3;
		let t4_value = /*car*/ ctx[1].model + "";
		let t4;
		let t5;
		let li2;
		let t6;
		let t7_value = /*car*/ ctx[1].year + "";
		let t7;
		let t8;
		let li3;
		let t9;
		let t10_value = /*car*/ ctx[1].stockLevel + "";
		let t10;

		const block = {
			c: function create() {
				li0 = element("li");
				t0 = text("Car Make: ");
				t1 = text(t1_value);
				t2 = space();
				li1 = element("li");
				t3 = text("Car Model: ");
				t4 = text(t4_value);
				t5 = space();
				li2 = element("li");
				t6 = text("Car Year: ");
				t7 = text(t7_value);
				t8 = space();
				li3 = element("li");
				t9 = text("Stock Level: ");
				t10 = text(t10_value);
				add_location(li0, file$e, 15, 8, 315);
				add_location(li1, file$e, 16, 8, 354);
				add_location(li2, file$e, 17, 8, 395);
				add_location(li3, file$e, 18, 8, 434);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li0, anchor);
				append_dev(li0, t0);
				append_dev(li0, t1);
				insert_dev(target, t2, anchor);
				insert_dev(target, li1, anchor);
				append_dev(li1, t3);
				append_dev(li1, t4);
				insert_dev(target, t5, anchor);
				insert_dev(target, li2, anchor);
				append_dev(li2, t6);
				append_dev(li2, t7);
				insert_dev(target, t8, anchor);
				insert_dev(target, li3, anchor);
				append_dev(li3, t9);
				append_dev(li3, t10);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*cars*/ 1 && t1_value !== (t1_value = /*car*/ ctx[1].make + "")) set_data_dev(t1, t1_value);
				if (dirty & /*cars*/ 1 && t4_value !== (t4_value = /*car*/ ctx[1].model + "")) set_data_dev(t4, t4_value);
				if (dirty & /*cars*/ 1 && t7_value !== (t7_value = /*car*/ ctx[1].year + "")) set_data_dev(t7, t7_value);
				if (dirty & /*cars*/ 1 && t10_value !== (t10_value = /*car*/ ctx[1].stockLevel + "")) set_data_dev(t10, t10_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li0);
					detach_dev(t2);
					detach_dev(li1);
					detach_dev(t5);
					detach_dev(li2);
					detach_dev(t8);
					detach_dev(li3);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(15:4) {#each cars as car}",
			ctx
		});

		return block;
	}

	function create_fragment$e(ctx) {
		let h1;
		let t1;
		let ul;
		let each_value = ensure_array_like_dev(/*cars*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Cars List";
				t1 = space();
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				add_location(h1, file$e, 12, 0, 256);
				add_location(ul, file$e, 13, 0, 276);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, ul, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*cars*/ 1) {
					each_value = ensure_array_like_dev(/*cars*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop$1,
			o: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
					detach_dev(t1);
					detach_dev(ul);
				}

				destroy_each(each_blocks, detaching);
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

	function instance$d($$self, $$props, $$invalidate) {
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

		$$self.$capture_state = () => ({ onMount, fetchCars, cars });

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
			init(this, options, instance$d, create_fragment$e, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "CarsList",
				options,
				id: create_fragment$e.name
			});
		}
	}

	/* src\components\AddCar.svelte generated by Svelte v4.2.19 */
	const file$d = "src\\components\\AddCar.svelte";

	function create_fragment$d(ctx) {
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
		let div3;
		let label3;
		let t12;
		let input3;
		let t13;
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				h1 = element("h1");
				h1.textContent = "Add a New Car";
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
				div3 = element("div");
				label3 = element("label");
				label3.textContent = "Stock Level:";
				t12 = space();
				input3 = element("input");
				t13 = space();
				button = element("button");
				button.textContent = "Submit";
				add_location(h1, file$d, 19, 0, 485);
				attr_dev(label0, "for", "year");
				add_location(label0, file$d, 22, 8, 563);
				attr_dev(input0, "type", "number");
				attr_dev(input0, "id", "year");
				attr_dev(input0, "name", "year");
				add_location(input0, file$d, 23, 8, 606);
				add_location(div0, file$d, 21, 4, 548);
				attr_dev(label1, "for", "make");
				add_location(label1, file$d, 26, 8, 704);
				attr_dev(input1, "type", "text");
				attr_dev(input1, "id", "make");
				attr_dev(input1, "name", "make");
				add_location(input1, file$d, 27, 8, 747);
				add_location(div1, file$d, 25, 4, 689);
				attr_dev(label2, "for", "model");
				add_location(label2, file$d, 30, 8, 843);
				attr_dev(input2, "type", "text");
				attr_dev(input2, "id", "model");
				attr_dev(input2, "name", "model");
				add_location(input2, file$d, 31, 8, 888);
				add_location(div2, file$d, 29, 4, 828);
				attr_dev(label3, "for", "stocklevel");
				add_location(label3, file$d, 34, 8, 987);
				attr_dev(input3, "type", "number");
				attr_dev(input3, "id", "stocklevel");
				attr_dev(input3, "name", "stocklevel");
				add_location(input3, file$d, 35, 8, 1043);
				add_location(div3, file$d, 33, 4, 972);
				attr_dev(button, "type", "submit");
				add_location(button, file$d, 37, 4, 1144);
				add_location(form, file$d, 20, 0, 509);
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
				append_dev(form, div3);
				append_dev(div3, label3);
				append_dev(div3, t12);
				append_dev(div3, input3);
				set_input_value(input3, /*stocklevel*/ ctx[3]);
				append_dev(form, t13);
				append_dev(form, button);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
						listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
						listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
						listen_dev(form, "submit", /*handleSubmit*/ ctx[4], false, false, false, false)
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

				if (dirty & /*stocklevel*/ 8 && to_number(input3.value) !== /*stocklevel*/ ctx[3]) {
					set_input_value(input3, /*stocklevel*/ ctx[3]);
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
			id: create_fragment$d.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$c($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('AddCar', slots, []);
		let year = 0;
		let make = '';
		let model = '';
		let stocklevel = 0;

		const handleSubmit = async event => {
			event.preventDefault();

			const newCar = {
				year,
				make,
				model,
				stocklevel: parseInt(stocklevel)
			};

			await addCar(newCar);
			$$invalidate(0, year = "");
			$$invalidate(1, make = "");
			$$invalidate(2, model = "");
			$$invalidate(3, stocklevel = "");
		}; // send data to the api

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddCar> was created with unknown prop '${key}'`);
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

		function input3_input_handler() {
			stocklevel = to_number(this.value);
			$$invalidate(3, stocklevel);
		}

		$$self.$capture_state = () => ({
			addCar,
			year,
			make,
			model,
			stocklevel,
			handleSubmit
		});

		$$self.$inject_state = $$props => {
			if ('year' in $$props) $$invalidate(0, year = $$props.year);
			if ('make' in $$props) $$invalidate(1, make = $$props.make);
			if ('model' in $$props) $$invalidate(2, model = $$props.model);
			if ('stocklevel' in $$props) $$invalidate(3, stocklevel = $$props.stocklevel);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			year,
			make,
			model,
			stocklevel,
			handleSubmit,
			input0_input_handler,
			input1_input_handler,
			input2_input_handler,
			input3_input_handler
		];
	}

	class AddCar extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$c, create_fragment$d, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "AddCar",
				options,
				id: create_fragment$d.name
			});
		}
	}

	/* src\components\DeleteCar.svelte generated by Svelte v4.2.19 */

	const { console: console_1 } = globals;
	const file$c = "src\\components\\DeleteCar.svelte";

	function create_fragment$c(ctx) {
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
				add_location(h1, file$c, 20, 0, 531);
				attr_dev(label0, "for", "year");
				add_location(label0, file$c, 23, 8, 608);
				attr_dev(input0, "type", "number");
				attr_dev(input0, "id", "year");
				attr_dev(input0, "name", "year");
				add_location(input0, file$c, 24, 8, 651);
				add_location(div0, file$c, 22, 4, 593);
				attr_dev(label1, "for", "make");
				add_location(label1, file$c, 27, 8, 749);
				attr_dev(input1, "type", "text");
				attr_dev(input1, "id", "make");
				attr_dev(input1, "name", "make");
				add_location(input1, file$c, 28, 8, 792);
				add_location(div1, file$c, 26, 4, 734);
				attr_dev(label2, "for", "model");
				add_location(label2, file$c, 31, 8, 888);
				attr_dev(input2, "type", "text");
				attr_dev(input2, "id", "model");
				attr_dev(input2, "name", "model");
				add_location(input2, file$c, 32, 8, 933);
				add_location(div2, file$c, 30, 4, 873);
				attr_dev(button, "type", "submit");
				add_location(button, file$c, 34, 4, 1017);
				add_location(form, file$c, 21, 0, 554);
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
			id: create_fragment$c.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$b($$self, $$props, $$invalidate) {
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
			init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DeleteCar",
				options,
				id: create_fragment$c.name
			});
		}
	}

	/******************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

	var extendStatics = function(d, b) {
	  extendStatics = Object.setPrototypeOf ||
	      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	  return extendStatics(d, b);
	};

	function __extends(d, b) {
	  if (typeof b !== "function" && b !== null)
	      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	  extendStatics(d, b);
	  function __() { this.constructor = d; }
	  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var __assign = function() {
	  __assign = Object.assign || function __assign(t) {
	      for (var s, i = 1, n = arguments.length; i < n; i++) {
	          s = arguments[i];
	          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
	      }
	      return t;
	  };
	  return __assign.apply(this, arguments);
	};

	function __awaiter(thisArg, _arguments, P, generator) {
	  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	  return new (P || (P = Promise))(function (resolve, reject) {
	      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	      step((generator = generator.apply(thisArg, _arguments || [])).next());
	  });
	}

	function __generator(thisArg, body) {
	  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
	  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	  function verb(n) { return function (v) { return step([n, v]); }; }
	  function step(op) {
	      if (f) throw new TypeError("Generator is already executing.");
	      while (g && (g = 0, op[0] && (_ = 0)), _) try {
	          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
	          if (y = 0, t) op = [op[0] & 2, t.value];
	          switch (op[0]) {
	              case 0: case 1: t = op; break;
	              case 4: _.label++; return { value: op[1], done: false };
	              case 5: _.label++; y = op[1]; op = [0]; continue;
	              case 7: op = _.ops.pop(); _.trys.pop(); continue;
	              default:
	                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                  if (t[2]) _.ops.pop();
	                  _.trys.pop(); continue;
	          }
	          op = body.call(thisArg, _);
	      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	  }
	}

	typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	  var e = new Error(message);
	  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	};

	/**
	 * @license
	 * Copyright 2016 Google Inc.
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	var MDCFoundation = /** @class */ (function () {
	    function MDCFoundation(adapter) {
	        if (adapter === void 0) { adapter = {}; }
	        this.adapter = adapter;
	    }
	    Object.defineProperty(MDCFoundation, "cssClasses", {
	        get: function () {
	            // Classes extending MDCFoundation should implement this method to return an object which exports every
	            // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
	            return {};
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(MDCFoundation, "strings", {
	        get: function () {
	            // Classes extending MDCFoundation should implement this method to return an object which exports all
	            // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
	            return {};
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(MDCFoundation, "numbers", {
	        get: function () {
	            // Classes extending MDCFoundation should implement this method to return an object which exports all
	            // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
	            return {};
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(MDCFoundation, "defaultAdapter", {
	        get: function () {
	            // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
	            // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
	            // validation.
	            return {};
	        },
	        enumerable: false,
	        configurable: true
	    });
	    MDCFoundation.prototype.init = function () {
	        // Subclasses should override this method to perform initialization routines (registering events, etc.)
	    };
	    MDCFoundation.prototype.destroy = function () {
	        // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
	    };
	    return MDCFoundation;
	}());

	/**
	 * @license
	 * Copyright 2018 Google Inc.
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	/**
	 * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
	 * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
	 */
	function closest(element, selector) {
	    if (element.closest) {
	        return element.closest(selector);
	    }
	    var el = element;
	    while (el) {
	        if (matches(el, selector)) {
	            return el;
	        }
	        el = el.parentElement;
	    }
	    return null;
	}
	function matches(element, selector) {
	    var nativeMatches = element.matches
	        || element.webkitMatchesSelector
	        || element.msMatchesSelector;
	    return nativeMatches.call(element, selector);
	}
	/**
	 * Used to compute the estimated scroll width of elements. When an element is
	 * hidden due to display: none; being applied to a parent element, the width is
	 * returned as 0. However, the element will have a true width once no longer
	 * inside a display: none context. This method computes an estimated width when
	 * the element is hidden or returns the true width when the element is visble.
	 * @param {Element} element the element whose width to estimate
	 */
	function estimateScrollWidth(element) {
	    // Check the offsetParent. If the element inherits display: none from any
	    // parent, the offsetParent property will be null (see
	    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent).
	    // This check ensures we only clone the node when necessary.
	    var htmlEl = element;
	    if (htmlEl.offsetParent !== null) {
	        return htmlEl.scrollWidth;
	    }
	    var clone = htmlEl.cloneNode(true);
	    clone.style.setProperty('position', 'absolute');
	    clone.style.setProperty('transform', 'translate(-9999px, -9999px)');
	    document.documentElement.appendChild(clone);
	    var scrollWidth = clone.scrollWidth;
	    document.documentElement.removeChild(clone);
	    return scrollWidth;
	}

	var ponyfill = /*#__PURE__*/Object.freeze({
		__proto__: null,
		closest: closest,
		estimateScrollWidth: estimateScrollWidth,
		matches: matches
	});

	/**
	 * @license
	 * Copyright 2019 Google Inc.
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	/**
	 * CSS class names used in component.
	 */
	var cssClasses = {
	    CELL: 'mdc-data-table__cell',
	    CELL_NUMERIC: 'mdc-data-table__cell--numeric',
	    CONTENT: 'mdc-data-table__content',
	    HEADER_CELL: 'mdc-data-table__header-cell',
	    HEADER_CELL_LABEL: 'mdc-data-table__header-cell-label',
	    HEADER_CELL_SORTED: 'mdc-data-table__header-cell--sorted',
	    HEADER_CELL_SORTED_DESCENDING: 'mdc-data-table__header-cell--sorted-descending',
	    HEADER_CELL_WITH_SORT: 'mdc-data-table__header-cell--with-sort',
	    HEADER_CELL_WRAPPER: 'mdc-data-table__header-cell-wrapper',
	    HEADER_ROW: 'mdc-data-table__header-row',
	    HEADER_ROW_CHECKBOX: 'mdc-data-table__header-row-checkbox',
	    IN_PROGRESS: 'mdc-data-table--in-progress',
	    LINEAR_PROGRESS: 'mdc-data-table__linear-progress',
	    PAGINATION_ROWS_PER_PAGE_LABEL: 'mdc-data-table__pagination-rows-per-page-label',
	    PAGINATION_ROWS_PER_PAGE_SELECT: 'mdc-data-table__pagination-rows-per-page-select',
	    PROGRESS_INDICATOR: 'mdc-data-table__progress-indicator',
	    ROOT: 'mdc-data-table',
	    ROW: 'mdc-data-table__row',
	    ROW_CHECKBOX: 'mdc-data-table__row-checkbox',
	    ROW_SELECTED: 'mdc-data-table__row--selected',
	    SORT_ICON_BUTTON: 'mdc-data-table__sort-icon-button',
	    SORT_STATUS_LABEL: 'mdc-data-table__sort-status-label',
	    TABLE_CONTAINER: 'mdc-data-table__table-container',
	};
	/**
	 * DOM attributes used in component.
	 */
	var attributes = {
	    ARIA_SELECTED: 'aria-selected',
	    ARIA_SORT: 'aria-sort',
	};
	/**
	 * List of data attributes used in component.
	 */
	var dataAttributes = {
	    COLUMN_ID: 'data-column-id',
	    ROW_ID: 'data-row-id',
	};
	/**
	 * CSS selectors used in component.
	 */
	var selectors = {
	    CONTENT: "." + cssClasses.CONTENT,
	    HEADER_CELL: "." + cssClasses.HEADER_CELL,
	    HEADER_CELL_WITH_SORT: "." + cssClasses.HEADER_CELL_WITH_SORT,
	    HEADER_ROW: "." + cssClasses.HEADER_ROW,
	    HEADER_ROW_CHECKBOX: "." + cssClasses.HEADER_ROW_CHECKBOX,
	    PROGRESS_INDICATOR: "." + cssClasses.PROGRESS_INDICATOR,
	    ROW: "." + cssClasses.ROW,
	    ROW_CHECKBOX: "." + cssClasses.ROW_CHECKBOX,
	    ROW_SELECTED: "." + cssClasses.ROW_SELECTED,
	    SORT_ICON_BUTTON: "." + cssClasses.SORT_ICON_BUTTON,
	    SORT_STATUS_LABEL: "." + cssClasses.SORT_STATUS_LABEL,
	};
	/**
	 * Attributes and selectors used in component.
	 * @deprecated Use `attributes`, `dataAttributes` and `selectors` instead.
	 */
	var strings = {
	    ARIA_SELECTED: attributes.ARIA_SELECTED,
	    ARIA_SORT: attributes.ARIA_SORT,
	    DATA_ROW_ID_ATTR: dataAttributes.ROW_ID,
	    HEADER_ROW_CHECKBOX_SELECTOR: selectors.HEADER_ROW_CHECKBOX,
	    ROW_CHECKBOX_SELECTOR: selectors.ROW_CHECKBOX,
	    ROW_SELECTED_SELECTOR: selectors.ROW_SELECTED,
	    ROW_SELECTOR: selectors.ROW,
	};
	/**
	 * Sort values defined by ARIA.
	 * See https://www.w3.org/WAI/PF/aria/states_and_properties#aria-sort
	 */
	var SortValue;
	(function (SortValue) {
	    // Items are sorted in ascending order by this column.
	    SortValue["ASCENDING"] = "ascending";
	    // Items are sorted in descending order by this column.
	    SortValue["DESCENDING"] = "descending";
	    // There is no defined sort applied to the column.
	    SortValue["NONE"] = "none";
	    // A sort algorithm other than ascending or descending has been applied.
	    SortValue["OTHER"] = "other";
	})(SortValue || (SortValue = {}));

	/**
	 * @license
	 * Copyright 2019 Google Inc.
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	/**
	 * The Foundation of data table component containing pure business logic, any
	 * logic requiring DOM manipulation are delegated to adapter methods.
	 */
	var MDCDataTableFoundation = /** @class */ (function (_super) {
	    __extends(MDCDataTableFoundation, _super);
	    function MDCDataTableFoundation(adapter) {
	        return _super.call(this, __assign(__assign({}, MDCDataTableFoundation.defaultAdapter), adapter)) || this;
	    }
	    Object.defineProperty(MDCDataTableFoundation, "defaultAdapter", {
	        get: function () {
	            return {
	                addClass: function () { return undefined; },
	                addClassAtRowIndex: function () { return undefined; },
	                getAttributeByHeaderCellIndex: function () { return ''; },
	                getHeaderCellCount: function () { return 0; },
	                getHeaderCellElements: function () { return []; },
	                getRowCount: function () { return 0; },
	                getRowElements: function () { return []; },
	                getRowIdAtIndex: function () { return ''; },
	                getRowIndexByChildElement: function () { return 0; },
	                getSelectedRowCount: function () { return 0; },
	                getTableContainerHeight: function () { return 0; },
	                getTableHeaderHeight: function () { return 0; },
	                isCheckboxAtRowIndexChecked: function () { return false; },
	                isHeaderRowCheckboxChecked: function () { return false; },
	                isRowsSelectable: function () { return false; },
	                notifyRowSelectionChanged: function () { return undefined; },
	                notifySelectedAll: function () { return undefined; },
	                notifySortAction: function () { return undefined; },
	                notifyUnselectedAll: function () { return undefined; },
	                notifyRowClick: function () { return undefined; },
	                registerHeaderRowCheckbox: function () { return undefined; },
	                registerRowCheckboxes: function () { return undefined; },
	                removeClass: function () { return undefined; },
	                removeClassAtRowIndex: function () { return undefined; },
	                removeClassNameByHeaderCellIndex: function () { return undefined; },
	                setAttributeAtRowIndex: function () { return undefined; },
	                setAttributeByHeaderCellIndex: function () { return undefined; },
	                setClassNameByHeaderCellIndex: function () { return undefined; },
	                setHeaderRowCheckboxChecked: function () { return undefined; },
	                setHeaderRowCheckboxIndeterminate: function () { return undefined; },
	                setProgressIndicatorStyles: function () { return undefined; },
	                setRowCheckboxCheckedAtIndex: function () { return undefined; },
	                setSortStatusLabelByHeaderCellIndex: function () { return undefined; },
	            };
	        },
	        enumerable: false,
	        configurable: true
	    });
	    /**
	     * Re-initializes header row checkbox and row checkboxes when selectable rows
	     * are added or removed from table. Use this if registering checkbox is
	     * synchronous.
	     */
	    MDCDataTableFoundation.prototype.layout = function () {
	        if (this.adapter.isRowsSelectable()) {
	            this.adapter.registerHeaderRowCheckbox();
	            this.adapter.registerRowCheckboxes();
	            this.setHeaderRowCheckboxState();
	        }
	    };
	    /**
	     * Re-initializes header row checkbox and row checkboxes when selectable rows
	     * are added or removed from table. Use this if registering checkbox is
	     * asynchronous.
	     */
	    MDCDataTableFoundation.prototype.layoutAsync = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!this.adapter.isRowsSelectable()) return [3 /*break*/, 3];
	                        return [4 /*yield*/, this.adapter.registerHeaderRowCheckbox()];
	                    case 1:
	                        _a.sent();
	                        return [4 /*yield*/, this.adapter.registerRowCheckboxes()];
	                    case 2:
	                        _a.sent();
	                        this.setHeaderRowCheckboxState();
	                        _a.label = 3;
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * @return Returns array of row elements.
	     */
	    MDCDataTableFoundation.prototype.getRows = function () {
	        return this.adapter.getRowElements();
	    };
	    /**
	     * @return Array of header cell elements.
	     */
	    MDCDataTableFoundation.prototype.getHeaderCells = function () {
	        return this.adapter.getHeaderCellElements();
	    };
	    /**
	     * Sets selected row ids. Overwrites previously selected rows.
	     * @param rowIds Array of row ids that needs to be selected.
	     */
	    MDCDataTableFoundation.prototype.setSelectedRowIds = function (rowIds) {
	        for (var rowIndex = 0; rowIndex < this.adapter.getRowCount(); rowIndex++) {
	            var rowId = this.adapter.getRowIdAtIndex(rowIndex);
	            var isSelected = false;
	            if (rowId && rowIds.indexOf(rowId) >= 0) {
	                isSelected = true;
	            }
	            this.adapter.setRowCheckboxCheckedAtIndex(rowIndex, isSelected);
	            this.selectRowAtIndex(rowIndex, isSelected);
	        }
	        this.setHeaderRowCheckboxState();
	    };
	    /**
	     * @return Returns array of all row ids.
	     */
	    MDCDataTableFoundation.prototype.getRowIds = function () {
	        var rowIds = [];
	        for (var rowIndex = 0; rowIndex < this.adapter.getRowCount(); rowIndex++) {
	            rowIds.push(this.adapter.getRowIdAtIndex(rowIndex));
	        }
	        return rowIds;
	    };
	    /**
	     * @return Returns array of selected row ids.
	     */
	    MDCDataTableFoundation.prototype.getSelectedRowIds = function () {
	        var selectedRowIds = [];
	        for (var rowIndex = 0; rowIndex < this.adapter.getRowCount(); rowIndex++) {
	            if (this.adapter.isCheckboxAtRowIndexChecked(rowIndex)) {
	                selectedRowIds.push(this.adapter.getRowIdAtIndex(rowIndex));
	            }
	        }
	        return selectedRowIds;
	    };
	    /**
	     * Handles header row checkbox change event.
	     */
	    MDCDataTableFoundation.prototype.handleHeaderRowCheckboxChange = function () {
	        var isHeaderChecked = this.adapter.isHeaderRowCheckboxChecked();
	        for (var rowIndex = 0; rowIndex < this.adapter.getRowCount(); rowIndex++) {
	            this.adapter.setRowCheckboxCheckedAtIndex(rowIndex, isHeaderChecked);
	            this.selectRowAtIndex(rowIndex, isHeaderChecked);
	        }
	        if (isHeaderChecked) {
	            this.adapter.notifySelectedAll();
	        }
	        else {
	            this.adapter.notifyUnselectedAll();
	        }
	    };
	    /**
	     * Handles change event originated from row checkboxes.
	     */
	    MDCDataTableFoundation.prototype.handleRowCheckboxChange = function (event) {
	        var rowIndex = this.adapter.getRowIndexByChildElement(event.target);
	        if (rowIndex === -1) {
	            return;
	        }
	        var selected = this.adapter.isCheckboxAtRowIndexChecked(rowIndex);
	        this.selectRowAtIndex(rowIndex, selected);
	        this.setHeaderRowCheckboxState();
	        var rowId = this.adapter.getRowIdAtIndex(rowIndex);
	        this.adapter.notifyRowSelectionChanged({ rowId: rowId, rowIndex: rowIndex, selected: selected });
	    };
	    /**
	     * Handles sort action on sortable header cell.
	     */
	    MDCDataTableFoundation.prototype.handleSortAction = function (eventData) {
	        var columnId = eventData.columnId, columnIndex = eventData.columnIndex, headerCell = eventData.headerCell;
	        // Reset sort attributes / classes on other header cells.
	        for (var index = 0; index < this.adapter.getHeaderCellCount(); index++) {
	            if (index === columnIndex) {
	                continue;
	            }
	            this.adapter.removeClassNameByHeaderCellIndex(index, cssClasses.HEADER_CELL_SORTED);
	            this.adapter.removeClassNameByHeaderCellIndex(index, cssClasses.HEADER_CELL_SORTED_DESCENDING);
	            this.adapter.setAttributeByHeaderCellIndex(index, strings.ARIA_SORT, SortValue.NONE);
	            this.adapter.setSortStatusLabelByHeaderCellIndex(index, SortValue.NONE);
	        }
	        // Set appropriate sort attributes / classes on target header cell.
	        this.adapter.setClassNameByHeaderCellIndex(columnIndex, cssClasses.HEADER_CELL_SORTED);
	        var currentSortValue = this.adapter.getAttributeByHeaderCellIndex(columnIndex, strings.ARIA_SORT);
	        var sortValue = SortValue.NONE;
	        // Set to descending if sorted on ascending order.
	        if (currentSortValue === SortValue.ASCENDING) {
	            this.adapter.setClassNameByHeaderCellIndex(columnIndex, cssClasses.HEADER_CELL_SORTED_DESCENDING);
	            this.adapter.setAttributeByHeaderCellIndex(columnIndex, strings.ARIA_SORT, SortValue.DESCENDING);
	            sortValue = SortValue.DESCENDING;
	            // Set to ascending if sorted on descending order.
	        }
	        else if (currentSortValue === SortValue.DESCENDING) {
	            this.adapter.removeClassNameByHeaderCellIndex(columnIndex, cssClasses.HEADER_CELL_SORTED_DESCENDING);
	            this.adapter.setAttributeByHeaderCellIndex(columnIndex, strings.ARIA_SORT, SortValue.ASCENDING);
	            sortValue = SortValue.ASCENDING;
	        }
	        else {
	            // Set to ascending by default when not sorted.
	            this.adapter.setAttributeByHeaderCellIndex(columnIndex, strings.ARIA_SORT, SortValue.ASCENDING);
	            sortValue = SortValue.ASCENDING;
	        }
	        this.adapter.setSortStatusLabelByHeaderCellIndex(columnIndex, sortValue);
	        this.adapter.notifySortAction({
	            columnId: columnId,
	            columnIndex: columnIndex,
	            headerCell: headerCell,
	            sortValue: sortValue,
	        });
	    };
	    /**
	     * Handles data table row click event.
	     */
	    MDCDataTableFoundation.prototype.handleRowClick = function (_a) {
	        var rowId = _a.rowId, row = _a.row;
	        this.adapter.notifyRowClick({
	            rowId: rowId,
	            row: row,
	        });
	    };
	    /**
	     * Shows progress indicator blocking only the table body content when in
	     * loading state.
	     */
	    MDCDataTableFoundation.prototype.showProgress = function () {
	        var tableHeaderHeight = this.adapter.getTableHeaderHeight();
	        // Calculate the height of table content (Not scroll content) excluding
	        // header row height.
	        var height = this.adapter.getTableContainerHeight() - tableHeaderHeight;
	        var top = tableHeaderHeight;
	        this.adapter.setProgressIndicatorStyles({
	            height: height + "px",
	            top: top + "px",
	        });
	        this.adapter.addClass(cssClasses.IN_PROGRESS);
	    };
	    /**
	     * Hides progress indicator when data table is finished loading.
	     */
	    MDCDataTableFoundation.prototype.hideProgress = function () {
	        this.adapter.removeClass(cssClasses.IN_PROGRESS);
	    };
	    /**
	     * Updates header row checkbox state based on number of rows selected.
	     */
	    MDCDataTableFoundation.prototype.setHeaderRowCheckboxState = function () {
	        if (this.adapter.getSelectedRowCount() === 0) {
	            this.adapter.setHeaderRowCheckboxChecked(false);
	            this.adapter.setHeaderRowCheckboxIndeterminate(false);
	        }
	        else if (this.adapter.getSelectedRowCount() === this.adapter.getRowCount()) {
	            this.adapter.setHeaderRowCheckboxChecked(true);
	            this.adapter.setHeaderRowCheckboxIndeterminate(false);
	        }
	        else {
	            this.adapter.setHeaderRowCheckboxIndeterminate(true);
	            this.adapter.setHeaderRowCheckboxChecked(false);
	        }
	    };
	    /**
	     * Sets the attributes of row element based on selection state.
	     */
	    MDCDataTableFoundation.prototype.selectRowAtIndex = function (rowIndex, selected) {
	        if (selected) {
	            this.adapter.addClassAtRowIndex(rowIndex, cssClasses.ROW_SELECTED);
	            this.adapter.setAttributeAtRowIndex(rowIndex, strings.ARIA_SELECTED, 'true');
	        }
	        else {
	            this.adapter.removeClassAtRowIndex(rowIndex, cssClasses.ROW_SELECTED);
	            this.adapter.setAttributeAtRowIndex(rowIndex, strings.ARIA_SELECTED, 'false');
	        }
	    };
	    return MDCDataTableFoundation;
	}(MDCFoundation));

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

	function classMap(classObj) {
	    return Object.entries(classObj)
	        .filter(([name, value]) => name !== '' && value)
	        .map(([name]) => name)
	        .join(' ');
	}

	function dispatch(element, eventType, detail, eventInit = { bubbles: true }, 
	/** This is an internal thing used by SMUI to duplicate some SMUI events as MDC events. */
	duplicateEventForMDC = false) {
	    if (typeof Event === 'undefined') {
	        throw new Error('Event not defined.');
	    }
	    if (!element) {
	        throw new Error('Tried to dipatch event without element.');
	    }
	    const event = new CustomEvent(eventType, Object.assign(Object.assign({}, eventInit), { detail }));
	    element === null || element === void 0 ? void 0 : element.dispatchEvent(event);
	    if (duplicateEventForMDC && eventType.startsWith('SMUI')) {
	        const duplicateEvent = new CustomEvent(eventType.replace(/^SMUI/g, () => 'MDC'), Object.assign(Object.assign({}, eventInit), { detail }));
	        element === null || element === void 0 ? void 0 : element.dispatchEvent(duplicateEvent);
	        if (duplicateEvent.defaultPrevented) {
	            event.preventDefault();
	        }
	    }
	    return event;
	}

	function exclude(obj, keys) {
	    let names = Object.getOwnPropertyNames(obj);
	    const newObj = {};
	    for (let i = 0; i < names.length; i++) {
	        const name = names[i];
	        const cashIndex = name.indexOf('$');
	        if (cashIndex !== -1 &&
	            keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
	            continue;
	        }
	        if (keys.indexOf(name) !== -1) {
	            continue;
	        }
	        newObj[name] = obj[name];
	    }
	    return newObj;
	}

	// Match old modifiers. (only works on DOM events)
	const oldModifierRegex = /^[a-z]+(?::(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;
	// Match new modifiers.
	const newModifierRegex = /^[^$]+(?:\$(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;
	function forwardEventsBuilder(component) {
	    // This is our pseudo $on function. It is defined on component mount.
	    let $on;
	    // This is a list of events bound before mount.
	    let events = [];
	    // And we override the $on function to forward all bound events.
	    component.$on = (fullEventType, callback) => {
	        let eventType = fullEventType;
	        let destructor = () => { };
	        if ($on) {
	            // The event was bound programmatically.
	            destructor = $on(eventType, callback);
	        }
	        else {
	            // The event was bound before mount by Svelte.
	            events.push([eventType, callback]);
	        }
	        const oldModifierMatch = eventType.match(oldModifierRegex);
	        if (oldModifierMatch && console) {
	            console.warn('Event modifiers in SMUI now use "$" instead of ":", so that ' +
	                'all events can be bound with modifiers. Please update your ' +
	                'event binding: ', eventType);
	        }
	        return () => {
	            destructor();
	        };
	    };
	    function bubble(e) {
	        // Internally bubble the event up from Svelte components.
	        const callbacks = component.$$.callbacks[e.type];
	        if (callbacks) {
	            // @ts-ignore
	            callbacks.slice().forEach((fn) => fn.call(this, e));
	        }
	    }
	    return (node) => {
	        const destructors = [];
	        const forwardDestructors = {};
	        // This function is responsible for listening and forwarding
	        // all bound events.
	        $on = (fullEventType, callback) => {
	            let eventType = fullEventType;
	            let handler = callback;
	            // DOM addEventListener options argument.
	            let options = false;
	            const oldModifierMatch = eventType.match(oldModifierRegex);
	            const newModifierMatch = eventType.match(newModifierRegex);
	            const modifierMatch = oldModifierMatch || newModifierMatch;
	            if (eventType.match(/^SMUI:\w+:/)) {
	                const newEventTypeParts = eventType.split(':');
	                let newEventType = '';
	                for (let i = 0; i < newEventTypeParts.length; i++) {
	                    newEventType +=
	                        i === newEventTypeParts.length - 1
	                            ? ':' + newEventTypeParts[i]
	                            : newEventTypeParts[i]
	                                .split('-')
	                                .map((value) => value.slice(0, 1).toUpperCase() + value.slice(1))
	                                .join('');
	                }
	                console.warn(`The event ${eventType.split('$')[0]} has been renamed to ${newEventType.split('$')[0]}.`);
	                eventType = newEventType;
	            }
	            if (modifierMatch) {
	                // Parse the event modifiers.
	                // Supported modifiers:
	                // - preventDefault
	                // - stopPropagation
	                // - stopImmediatePropagation
	                // - passive
	                // - nonpassive
	                // - capture
	                // - once
	                // - self
	                // - trusted
	                const parts = eventType.split(oldModifierMatch ? ':' : '$');
	                eventType = parts[0];
	                const eventOptions = parts.slice(1).reduce((obj, mod) => {
	                    obj[mod] = true;
	                    return obj;
	                }, {});
	                if (eventOptions.passive) {
	                    options = options || {};
	                    options.passive = true;
	                }
	                if (eventOptions.nonpassive) {
	                    options = options || {};
	                    options.passive = false;
	                }
	                if (eventOptions.capture) {
	                    options = options || {};
	                    options.capture = true;
	                }
	                if (eventOptions.once) {
	                    options = options || {};
	                    options.once = true;
	                }
	                if (eventOptions.preventDefault) {
	                    handler = prevent_default(handler);
	                }
	                if (eventOptions.stopPropagation) {
	                    handler = stop_propagation(handler);
	                }
	                if (eventOptions.stopImmediatePropagation) {
	                    handler = stop_immediate_propagation(handler);
	                }
	                if (eventOptions.self) {
	                    handler = self_event(node, handler);
	                }
	                if (eventOptions.trusted) {
	                    handler = trusted_event(handler);
	                }
	            }
	            // Listen for the event directly, with the given options.
	            const off = listen(node, eventType, handler, options);
	            const destructor = () => {
	                off();
	                const idx = destructors.indexOf(destructor);
	                if (idx > -1) {
	                    destructors.splice(idx, 1);
	                }
	            };
	            destructors.push(destructor);
	            // Forward the event from Svelte.
	            if (!(eventType in forwardDestructors)) {
	                forwardDestructors[eventType] = listen(node, eventType, bubble);
	            }
	            return destructor;
	        };
	        for (let i = 0; i < events.length; i++) {
	            // Listen to all the events added before mount.
	            $on(events[i][0], events[i][1]);
	        }
	        return {
	            destroy: () => {
	                // Remove all event listeners.
	                for (let i = 0; i < destructors.length; i++) {
	                    destructors[i]();
	                }
	                // Remove all event forwarders.
	                for (let entry of Object.entries(forwardDestructors)) {
	                    entry[1]();
	                }
	            },
	        };
	    };
	}
	function listen(node, event, handler, options) {
	    node.addEventListener(event, handler, options);
	    return () => node.removeEventListener(event, handler, options);
	}
	function prevent_default(fn) {
	    return function (event) {
	        event.preventDefault();
	        // @ts-ignore
	        return fn.call(this, event);
	    };
	}
	function stop_propagation(fn) {
	    return function (event) {
	        event.stopPropagation();
	        // @ts-ignore
	        return fn.call(this, event);
	    };
	}
	function stop_immediate_propagation(fn) {
	    return function (event) {
	        event.stopImmediatePropagation();
	        // @ts-ignore
	        return fn.call(this, event);
	    };
	}
	function self_event(node, fn) {
	    return function (event) {
	        if (event.target !== node) {
	            return;
	        }
	        // @ts-ignore
	        return fn.call(this, event);
	    };
	}
	function trusted_event(fn) {
	    return function (event) {
	        if (!event.isTrusted) {
	            return;
	        }
	        // @ts-ignore
	        return fn.call(this, event);
	    };
	}

	function prefixFilter(obj, prefix) {
	    let names = Object.getOwnPropertyNames(obj);
	    const newObj = {};
	    for (let i = 0; i < names.length; i++) {
	        const name = names[i];
	        if (name.substring(0, prefix.length) === prefix) {
	            newObj[name.substring(prefix.length)] = obj[name];
	        }
	    }
	    return newObj;
	}

	function useActions(node, actions) {
	    let actionReturns = [];
	    if (actions) {
	        for (let i = 0; i < actions.length; i++) {
	            const actionEntry = actions[i];
	            const action = Array.isArray(actionEntry) ? actionEntry[0] : actionEntry;
	            if (Array.isArray(actionEntry) && actionEntry.length > 1) {
	                actionReturns.push(action(node, actionEntry[1]));
	            }
	            else {
	                actionReturns.push(action(node));
	            }
	        }
	    }
	    return {
	        update(actions) {
	            if (((actions && actions.length) || 0) != actionReturns.length) {
	                throw new Error('You must not change the length of an actions array.');
	            }
	            if (actions) {
	                for (let i = 0; i < actions.length; i++) {
	                    const returnEntry = actionReturns[i];
	                    if (returnEntry && returnEntry.update) {
	                        const actionEntry = actions[i];
	                        if (Array.isArray(actionEntry) && actionEntry.length > 1) {
	                            returnEntry.update(actionEntry[1]);
	                        }
	                        else {
	                            returnEntry.update();
	                        }
	                    }
	                }
	            }
	        },
	        destroy() {
	            for (let i = 0; i < actionReturns.length; i++) {
	                const returnEntry = actionReturns[i];
	                if (returnEntry && returnEntry.destroy) {
	                    returnEntry.destroy();
	                }
	            }
	        },
	    };
	}

	/* node_modules\@smui\data-table\dist\DataTable.svelte generated by Svelte v4.2.19 */

	const { Error: Error_1 } = globals;

	const file$b = "node_modules\\@smui\\data-table\\dist\\DataTable.svelte";
	const get_paginate_slot_changes = dirty => ({});
	const get_paginate_slot_context = ctx => ({});
	const get_progress_slot_changes = dirty => ({});
	const get_progress_slot_context = ctx => ({});

	// (44:2) {#if $$slots.progress}
	function create_if_block$3(ctx) {
		let div1;
		let div0;
		let t;
		let div1_style_value;
		let current;
		const progress_slot_template = /*#slots*/ ctx[36].progress;
		const progress_slot = create_slot(progress_slot_template, ctx, /*$$scope*/ ctx[35], get_progress_slot_context);

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				t = space();
				if (progress_slot) progress_slot.c();
				attr_dev(div0, "class", "mdc-data-table__scrim");
				add_location(div0, file$b, 50, 6, 1528);
				attr_dev(div1, "class", "mdc-data-table__progress-indicator");
				attr_dev(div1, "style", div1_style_value = Object.entries(/*progressIndicatorStyles*/ ctx[13]).map(func).join(' '));
				add_location(div1, file$b, 44, 4, 1335);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div1, t);

				if (progress_slot) {
					progress_slot.m(div1, null);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (progress_slot) {
					if (progress_slot.p && (!current || dirty[1] & /*$$scope*/ 16)) {
						update_slot_base(
							progress_slot,
							progress_slot_template,
							ctx,
							/*$$scope*/ ctx[35],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[35])
							: get_slot_changes(progress_slot_template, /*$$scope*/ ctx[35], dirty, get_progress_slot_changes),
							get_progress_slot_context
						);
					}
				}

				if (!current || dirty[0] & /*progressIndicatorStyles*/ 8192 && div1_style_value !== (div1_style_value = Object.entries(/*progressIndicatorStyles*/ ctx[13]).map(func).join(' '))) {
					attr_dev(div1, "style", div1_style_value);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(progress_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(progress_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				if (progress_slot) progress_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(44:2) {#if $$slots.progress}",
			ctx
		});

		return block;
	}

	function create_fragment$b(ctx) {
		let div1;
		let div0;
		let table;
		let table_class_value;
		let useActions_action;
		let div0_class_value;
		let useActions_action_1;
		let t0;
		let t1;
		let div1_class_value;
		let useActions_action_2;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[36].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[35], null);

		let table_levels = [
			{
				class: table_class_value = classMap({
					[/*table$class*/ ctx[6]]: true,
					'mdc-data-table__table': true
				})
			},
			prefixFilter(/*$$restProps*/ ctx[25], 'table$')
		];

		let table_data = {};

		for (let i = 0; i < table_levels.length; i += 1) {
			table_data = assign(table_data, table_levels[i]);
		}

		let div0_levels = [
			{
				class: div0_class_value = classMap({
					[/*container$class*/ ctx[4]]: true,
					'mdc-data-table__table-container': true
				})
			},
			prefixFilter(/*$$restProps*/ ctx[25], 'container$')
		];

		let div_data = {};

		for (let i = 0; i < div0_levels.length; i += 1) {
			div_data = assign(div_data, div0_levels[i]);
		}

		let if_block = /*$$slots*/ ctx[24].progress && create_if_block$3(ctx);
		const paginate_slot_template = /*#slots*/ ctx[36].paginate;
		const paginate_slot = create_slot(paginate_slot_template, ctx, /*$$scope*/ ctx[35], get_paginate_slot_context);

		let div1_levels = [
			{
				class: div1_class_value = classMap({
					[/*className*/ ctx[1]]: true,
					'mdc-data-table': true,
					'mdc-data-table--sticky-header': /*stickyHeader*/ ctx[2],
					.../*internalClasses*/ ctx[12]
				})
			},
			exclude(/*$$restProps*/ ctx[25], ['container$', 'table$'])
		];

		let div_data_1 = {};

		for (let i = 0; i < div1_levels.length; i += 1) {
			div_data_1 = assign(div_data_1, div1_levels[i]);
		}

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				table = element("table");
				if (default_slot) default_slot.c();
				t0 = space();
				if (if_block) if_block.c();
				t1 = space();
				if (paginate_slot) paginate_slot.c();
				set_attributes(table, table_data);
				add_location(table, file$b, 31, 4, 1073);
				set_attributes(div0, div_data);
				add_location(div0, file$b, 22, 2, 842);
				set_attributes(div1, div_data_1);
				add_location(div1, file$b, 0, 0, 0);
			},
			l: function claim(nodes) {
				throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div0, table);

				if (default_slot) {
					default_slot.m(table, null);
				}

				/*div0_binding*/ ctx[37](div0);
				append_dev(div1, t0);
				if (if_block) if_block.m(div1, null);
				append_dev(div1, t1);

				if (paginate_slot) {
					paginate_slot.m(div1, null);
				}

				/*div1_binding*/ ctx[38](div1);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, table, /*table$use*/ ctx[5])),
						action_destroyer(useActions_action_1 = useActions.call(null, div0, /*container$use*/ ctx[3])),
						action_destroyer(useActions_action_2 = useActions.call(null, div1, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[15].call(null, div1)),
						listen_dev(div1, "SMUICheckbox:mount", /*SMUICheckbox_mount_handler*/ ctx[39], false, false, false, false),
						listen_dev(div1, "SMUIDataTableHeader:mount", /*handleHeaderMount*/ ctx[19], false, false, false, false),
						listen_dev(div1, "SMUIDataTableHeader:unmount", /*SMUIDataTableHeader_unmount_handler*/ ctx[40], false, false, false, false),
						listen_dev(div1, "SMUIDataTableBody:mount", /*handleBodyMount*/ ctx[20], false, false, false, false),
						listen_dev(div1, "SMUIDataTableBody:unmount", /*SMUIDataTableBody_unmount_handler*/ ctx[41], false, false, false, false),
						listen_dev(div1, "SMUIDataTableHeaderCheckbox:change", /*SMUIDataTableHeaderCheckbox_change_handler*/ ctx[42], false, false, false, false),
						listen_dev(div1, "SMUIDataTableHeader:click", /*handleHeaderRowClick*/ ctx[22], false, false, false, false),
						listen_dev(div1, "SMUIDataTableRow:click", /*handleRowClick*/ ctx[23], false, false, false, false),
						listen_dev(div1, "SMUIDataTableBodyCheckbox:change", /*handleBodyCheckboxChange*/ ctx[21], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 16)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[35],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[35])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[35], dirty, null),
							null
						);
					}
				}

				set_attributes(table, table_data = get_spread_update(table_levels, [
					(!current || dirty[0] & /*table$class*/ 64 && table_class_value !== (table_class_value = classMap({
						[/*table$class*/ ctx[6]]: true,
						'mdc-data-table__table': true
					}))) && { class: table_class_value },
					dirty[0] & /*$$restProps*/ 33554432 && prefixFilter(/*$$restProps*/ ctx[25], 'table$')
				]));

				if (useActions_action && is_function(useActions_action.update) && dirty[0] & /*table$use*/ 32) useActions_action.update.call(null, /*table$use*/ ctx[5]);

				set_attributes(div0, div_data = get_spread_update(div0_levels, [
					(!current || dirty[0] & /*container$class*/ 16 && div0_class_value !== (div0_class_value = classMap({
						[/*container$class*/ ctx[4]]: true,
						'mdc-data-table__table-container': true
					}))) && { class: div0_class_value },
					dirty[0] & /*$$restProps*/ 33554432 && prefixFilter(/*$$restProps*/ ctx[25], 'container$')
				]));

				if (useActions_action_1 && is_function(useActions_action_1.update) && dirty[0] & /*container$use*/ 8) useActions_action_1.update.call(null, /*container$use*/ ctx[3]);

				if (/*$$slots*/ ctx[24].progress) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty[0] & /*$$slots*/ 16777216) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$3(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div1, t1);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				if (paginate_slot) {
					if (paginate_slot.p && (!current || dirty[1] & /*$$scope*/ 16)) {
						update_slot_base(
							paginate_slot,
							paginate_slot_template,
							ctx,
							/*$$scope*/ ctx[35],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[35])
							: get_slot_changes(paginate_slot_template, /*$$scope*/ ctx[35], dirty, get_paginate_slot_changes),
							get_paginate_slot_context
						);
					}
				}

				set_attributes(div1, div_data_1 = get_spread_update(div1_levels, [
					(!current || dirty[0] & /*className, stickyHeader, internalClasses*/ 4102 && div1_class_value !== (div1_class_value = classMap({
						[/*className*/ ctx[1]]: true,
						'mdc-data-table': true,
						'mdc-data-table--sticky-header': /*stickyHeader*/ ctx[2],
						.../*internalClasses*/ ctx[12]
					}))) && { class: div1_class_value },
					dirty[0] & /*$$restProps*/ 33554432 && exclude(/*$$restProps*/ ctx[25], ['container$', 'table$'])
				]));

				if (useActions_action_2 && is_function(useActions_action_2.update) && dirty[0] & /*use*/ 1) useActions_action_2.update.call(null, /*use*/ ctx[0]);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				transition_in(if_block);
				transition_in(paginate_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				transition_out(if_block);
				transition_out(paginate_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				if (default_slot) default_slot.d(detaching);
				/*div0_binding*/ ctx[37](null);
				if (if_block) if_block.d();
				if (paginate_slot) paginate_slot.d(detaching);
				/*div1_binding*/ ctx[38](null);
				mounted = false;
				run_all(dispose);
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

	const func = ([name, value]) => `${name}: ${value};`;

	function instance_1($$self, $$props, $$invalidate) {
		const omit_props_names = [
			"use","class","stickyHeader","sortable","sort","sortDirection","sortAscendingAriaLabel","sortDescendingAriaLabel","container$use","container$class","table$use","table$class","layout","getElement"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let $progressClosed;
		let $sortDirectionStore;
		let $sortStore;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('DataTable', slots, ['default','progress','paginate']);
		const $$slots = compute_slots(slots);
		const { closest } = ponyfill;
		const forwardEvents = forwardEventsBuilder(get_current_component());
		let { use = [] } = $$props;
		let { class: className = '' } = $$props;
		let { stickyHeader = false } = $$props;
		let { sortable = false } = $$props;
		let { sort = null } = $$props;
		let { sortDirection = 'ascending' } = $$props;
		let { sortAscendingAriaLabel = 'sorted, ascending' } = $$props;
		let { sortDescendingAriaLabel = 'sorted, descending' } = $$props;
		let { container$use = [] } = $$props;
		let { container$class = '' } = $$props;
		let { table$use = [] } = $$props;
		let { table$class = '' } = $$props;
		let element;
		let instance;
		let container;
		let header = undefined;
		let body = undefined;
		let internalClasses = {};
		let progressIndicatorStyles = { height: 'auto', top: 'initial' };
		let addLayoutListener = getContext('SMUI:addLayoutListener');
		let removeLayoutListener;
		let postMount = false;
		let progressClosed = writable(false);
		validate_store(progressClosed, 'progressClosed');
		component_subscribe($$self, progressClosed, value => $$invalidate(34, $progressClosed = value));
		let sortStore = writable(sort);
		validate_store(sortStore, 'sortStore');
		component_subscribe($$self, sortStore, value => $$invalidate(45, $sortStore = value));
		let sortDirectionStore = writable(sortDirection);
		validate_store(sortDirectionStore, 'sortDirectionStore');
		component_subscribe($$self, sortDirectionStore, value => $$invalidate(44, $sortDirectionStore = value));
		setContext('SMUI:checkbox:context', 'data-table');
		setContext('SMUI:linear-progress:context', 'data-table');
		setContext('SMUI:linear-progress:closed', progressClosed);
		setContext('SMUI:data-table:sortable', sortable);
		setContext('SMUI:data-table:sort', sortStore);
		setContext('SMUI:data-table:sortDirection', sortDirectionStore);
		setContext('SMUI:data-table:sortAscendingAriaLabel', sortAscendingAriaLabel);
		setContext('SMUI:data-table:sortDescendingAriaLabel', sortDescendingAriaLabel);

		if (addLayoutListener) {
			removeLayoutListener = addLayoutListener(layout);
		}

		let previousProgressClosed = undefined;

		onMount(() => {
			$$invalidate(7, instance = new MDCDataTableFoundation({
					addClass,
					removeClass,
					getHeaderCellElements: () => {
						var _a;

						return (_a = header === null || header === void 0
						? void 0
						: header.cells.map(accessor => accessor.element)) !== null && _a !== void 0
						? _a
						: [];
					},
					getHeaderCellCount: () => {
						var _a;

						return (_a = header === null || header === void 0
						? void 0
						: header.cells.length) !== null && _a !== void 0
						? _a
						: 0;
					},
					getAttributeByHeaderCellIndex: (index, name) => {
						var _a;

						return (_a = header === null || header === void 0
						? void 0
						: header.orderedCells[index].getAttr(name)) !== null && _a !== void 0
						? _a
						: null;
					},
					setAttributeByHeaderCellIndex: (index, name, value) => {
						header === null || header === void 0
						? void 0
						: header.orderedCells[index].addAttr(name, value);
					},
					setClassNameByHeaderCellIndex: (index, className) => {
						header === null || header === void 0
						? void 0
						: header.orderedCells[index].addClass(className);
					},
					removeClassNameByHeaderCellIndex: (index, className) => {
						header === null || header === void 0
						? void 0
						: header.orderedCells[index].removeClass(className);
					},
					notifySortAction: data => {
						$$invalidate(26, sort = data.columnId);
						$$invalidate(27, sortDirection = data.sortValue);
						dispatch(getElement(), 'SMUIDataTable:sorted', data, undefined, true);
					},
					getTableContainerHeight: () => container.getBoundingClientRect().height,
					getTableHeaderHeight: () => {
						const tableHeader = getElement().querySelector('.mdc-data-table__header-row');

						if (!tableHeader) {
							throw new Error('MDCDataTable: Table header element not found.');
						}

						return tableHeader.getBoundingClientRect().height;
					},
					setProgressIndicatorStyles: styles => {
						$$invalidate(13, progressIndicatorStyles = styles);
					},
					addClassAtRowIndex: (rowIndex, className) => {
						body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].addClass(className);
					},
					getRowCount: () => {
						var _a;

						return (_a = body === null || body === void 0
						? void 0
						: body.rows.length) !== null && _a !== void 0
						? _a
						: 0;
					},
					getRowElements: () => {
						var _a;

						return (_a = body === null || body === void 0
						? void 0
						: body.rows.map(accessor => accessor.element)) !== null && _a !== void 0
						? _a
						: [];
					},
					getRowIdAtIndex: rowIndex => {
						var _a;

						return (_a = body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].rowId) !== null && _a !== void 0
						? _a
						: null;
					},
					getRowIndexByChildElement: el => {
						var _a;

						return (_a = body === null || body === void 0
						? void 0
						: body.orderedRows.map(accessor => accessor.element).indexOf(closest(el, '.mdc-data-table__row'))) !== null && _a !== void 0
						? _a
						: -1;
					},
					getSelectedRowCount: () => {
						var _a;

						return (_a = body === null || body === void 0
						? void 0
						: body.rows.filter(accessor => accessor.selected).length) !== null && _a !== void 0
						? _a
						: 0;
					},
					isCheckboxAtRowIndexChecked: rowIndex => {
						const checkbox = body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].checkbox;

						if (checkbox) {
							return checkbox.checked;
						}

						return false;
					},
					isHeaderRowCheckboxChecked: () => {
						const checkbox = header === null || header === void 0
						? void 0
						: header.checkbox;

						if (checkbox) {
							return checkbox.checked;
						}

						return false;
					},
					isRowsSelectable: () => !!getElement().querySelector('.mdc-data-table__row-checkbox') || !!getElement().querySelector('.mdc-data-table__header-row-checkbox'),
					notifyRowSelectionChanged: data => {
						const row = body === null || body === void 0
						? void 0
						: body.orderedRows[data.rowIndex];

						if (row) {
							dispatch(
								getElement(),
								'SMUIDataTable:rowSelectionChanged',
								{
									row: row.element,
									rowId: row.rowId,
									rowIndex: data.rowIndex,
									selected: data.selected
								},
								undefined,
								true
							);
						}
					},
					notifySelectedAll: () => {
						setHeaderRowCheckboxIndeterminate(false);
						dispatch(getElement(), 'SMUIDataTable:selectedAll', undefined, undefined, true);
					},
					notifyUnselectedAll: () => {
						setHeaderRowCheckboxIndeterminate(false);
						dispatch(getElement(), 'SMUIDataTable:unselectedAll', undefined, undefined, true);
					},
					notifyRowClick: detail => {
						dispatch(getElement(), 'SMUIDataTable:rowClick', detail, undefined, true);
					},
					registerHeaderRowCheckbox: () => {
						
					}, // Handled automatically.
					registerRowCheckboxes: () => {
						
					}, // Handled automatically.
					removeClassAtRowIndex: (rowIndex, className) => {
						body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].removeClass(className);
					},
					setAttributeAtRowIndex: (rowIndex, name, value) => {
						body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].addAttr(name, value);
					},
					setHeaderRowCheckboxChecked: checked => {
						const checkbox = header === null || header === void 0
						? void 0
						: header.checkbox;

						if (checkbox) {
							checkbox.checked = checked;
						}
					},
					setHeaderRowCheckboxIndeterminate,
					setRowCheckboxCheckedAtIndex: (rowIndex, checked) => {
						const checkbox = body === null || body === void 0
						? void 0
						: body.orderedRows[rowIndex].checkbox;

						if (checkbox) {
							checkbox.checked = checked;
						}
					},
					setSortStatusLabelByHeaderCellIndex: (_columnIndex, _sortValue) => {
						
					}, // Handled automatically.
					
				}));

			instance.init();
			instance.layout();
			$$invalidate(14, postMount = true);

			return () => {
				instance.destroy();
			};
		});

		onDestroy(() => {
			if (removeLayoutListener) {
				removeLayoutListener();
			}
		});

		function handleHeaderMount(event) {
			$$invalidate(10, header = event.detail);
		}

		function handleBodyMount(event) {
			$$invalidate(11, body = event.detail);
		}

		function handleBodyCheckboxChange(event) {
			if (instance) {
				instance.handleRowCheckboxChange(event);
			}
		}

		function addClass(className) {
			if (!internalClasses[className]) {
				$$invalidate(12, internalClasses[className] = true, internalClasses);
			}
		}

		function removeClass(className) {
			if (!(className in internalClasses) || internalClasses[className]) {
				$$invalidate(12, internalClasses[className] = false, internalClasses);
			}
		}

		function setHeaderRowCheckboxIndeterminate(indeterminate) {
			const checkbox = header === null || header === void 0
			? void 0
			: header.checkbox;

			if (checkbox) {
				checkbox.indeterminate = indeterminate;
			}
		}

		function handleHeaderRowClick(event) {
			if (!instance || !event.detail.target) {
				return;
			}

			const headerCell = closest(event.detail.target, '.mdc-data-table__header-cell--with-sort');

			if (headerCell) {
				handleSortAction(headerCell);
			}
		}

		function handleRowClick(event) {
			if (!instance || !event.detail.target) {
				return;
			}

			const row = closest(event.detail.target, '.mdc-data-table__row');

			if (row && instance) {
				instance.handleRowClick({ rowId: event.detail.rowId, row });
			}
		}

		function handleSortAction(headerCell) {
			var _a, _b;

			const orderedCells = (_a = header === null || header === void 0
			? void 0
			: header.orderedCells) !== null && _a !== void 0
			? _a
			: [];

			const columnIndex = orderedCells.map(accessor => accessor.element).indexOf(headerCell);

			if (columnIndex === -1) {
				return;
			}

			const columnId = (_b = orderedCells[columnIndex].columnId) !== null && _b !== void 0
			? _b
			: null;

			instance.handleSortAction({ columnId, columnIndex, headerCell });
		}

		function layout() {
			return instance.layout();
		}

		function getElement() {
			return element;
		}

		function div0_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				container = $$value;
				$$invalidate(9, container);
			});
		}

		function div1_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(8, element);
			});
		}

		const SMUICheckbox_mount_handler = () => instance && postMount && instance.layout();
		const SMUIDataTableHeader_unmount_handler = () => $$invalidate(10, header = undefined);
		const SMUIDataTableBody_unmount_handler = () => $$invalidate(11, body = undefined);
		const SMUIDataTableHeaderCheckbox_change_handler = () => instance && instance.handleHeaderRowCheckboxChange();

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(25, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
			if ('class' in $$new_props) $$invalidate(1, className = $$new_props.class);
			if ('stickyHeader' in $$new_props) $$invalidate(2, stickyHeader = $$new_props.stickyHeader);
			if ('sortable' in $$new_props) $$invalidate(28, sortable = $$new_props.sortable);
			if ('sort' in $$new_props) $$invalidate(26, sort = $$new_props.sort);
			if ('sortDirection' in $$new_props) $$invalidate(27, sortDirection = $$new_props.sortDirection);
			if ('sortAscendingAriaLabel' in $$new_props) $$invalidate(29, sortAscendingAriaLabel = $$new_props.sortAscendingAriaLabel);
			if ('sortDescendingAriaLabel' in $$new_props) $$invalidate(30, sortDescendingAriaLabel = $$new_props.sortDescendingAriaLabel);
			if ('container$use' in $$new_props) $$invalidate(3, container$use = $$new_props.container$use);
			if ('container$class' in $$new_props) $$invalidate(4, container$class = $$new_props.container$class);
			if ('table$use' in $$new_props) $$invalidate(5, table$use = $$new_props.table$use);
			if ('table$class' in $$new_props) $$invalidate(6, table$class = $$new_props.table$class);
			if ('$$scope' in $$new_props) $$invalidate(35, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			MDCDataTableFoundation,
			ponyfill,
			onMount,
			onDestroy,
			getContext,
			setContext,
			writable,
			get_current_component,
			forwardEventsBuilder,
			classMap,
			exclude,
			prefixFilter,
			useActions,
			dispatch,
			closest,
			forwardEvents,
			use,
			className,
			stickyHeader,
			sortable,
			sort,
			sortDirection,
			sortAscendingAriaLabel,
			sortDescendingAriaLabel,
			container$use,
			container$class,
			table$use,
			table$class,
			element,
			instance,
			container,
			header,
			body,
			internalClasses,
			progressIndicatorStyles,
			addLayoutListener,
			removeLayoutListener,
			postMount,
			progressClosed,
			sortStore,
			sortDirectionStore,
			previousProgressClosed,
			handleHeaderMount,
			handleBodyMount,
			handleBodyCheckboxChange,
			addClass,
			removeClass,
			setHeaderRowCheckboxIndeterminate,
			handleHeaderRowClick,
			handleRowClick,
			handleSortAction,
			layout,
			getElement,
			$progressClosed,
			$sortDirectionStore,
			$sortStore
		});

		$$self.$inject_state = $$new_props => {
			if ('use' in $$props) $$invalidate(0, use = $$new_props.use);
			if ('className' in $$props) $$invalidate(1, className = $$new_props.className);
			if ('stickyHeader' in $$props) $$invalidate(2, stickyHeader = $$new_props.stickyHeader);
			if ('sortable' in $$props) $$invalidate(28, sortable = $$new_props.sortable);
			if ('sort' in $$props) $$invalidate(26, sort = $$new_props.sort);
			if ('sortDirection' in $$props) $$invalidate(27, sortDirection = $$new_props.sortDirection);
			if ('sortAscendingAriaLabel' in $$props) $$invalidate(29, sortAscendingAriaLabel = $$new_props.sortAscendingAriaLabel);
			if ('sortDescendingAriaLabel' in $$props) $$invalidate(30, sortDescendingAriaLabel = $$new_props.sortDescendingAriaLabel);
			if ('container$use' in $$props) $$invalidate(3, container$use = $$new_props.container$use);
			if ('container$class' in $$props) $$invalidate(4, container$class = $$new_props.container$class);
			if ('table$use' in $$props) $$invalidate(5, table$use = $$new_props.table$use);
			if ('table$class' in $$props) $$invalidate(6, table$class = $$new_props.table$class);
			if ('element' in $$props) $$invalidate(8, element = $$new_props.element);
			if ('instance' in $$props) $$invalidate(7, instance = $$new_props.instance);
			if ('container' in $$props) $$invalidate(9, container = $$new_props.container);
			if ('header' in $$props) $$invalidate(10, header = $$new_props.header);
			if ('body' in $$props) $$invalidate(11, body = $$new_props.body);
			if ('internalClasses' in $$props) $$invalidate(12, internalClasses = $$new_props.internalClasses);
			if ('progressIndicatorStyles' in $$props) $$invalidate(13, progressIndicatorStyles = $$new_props.progressIndicatorStyles);
			if ('addLayoutListener' in $$props) addLayoutListener = $$new_props.addLayoutListener;
			if ('removeLayoutListener' in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
			if ('postMount' in $$props) $$invalidate(14, postMount = $$new_props.postMount);
			if ('progressClosed' in $$props) $$invalidate(16, progressClosed = $$new_props.progressClosed);
			if ('sortStore' in $$props) $$invalidate(17, sortStore = $$new_props.sortStore);
			if ('sortDirectionStore' in $$props) $$invalidate(18, sortDirectionStore = $$new_props.sortDirectionStore);
			if ('previousProgressClosed' in $$props) $$invalidate(33, previousProgressClosed = $$new_props.previousProgressClosed);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty[0] & /*sort*/ 67108864) {
				set_store_value(sortStore, $sortStore = sort, $sortStore);
			}

			if ($$self.$$.dirty[0] & /*sortDirection*/ 134217728) {
				set_store_value(sortDirectionStore, $sortDirectionStore = sortDirection, $sortDirectionStore);
			}

			if ($$self.$$.dirty[0] & /*instance*/ 128 | $$self.$$.dirty[1] & /*previousProgressClosed, $progressClosed*/ 12) {
				if ($$slots.progress && instance && previousProgressClosed !== $progressClosed) {
					$$invalidate(33, previousProgressClosed = $progressClosed);

					if ($progressClosed) {
						instance.hideProgress();
					} else {
						instance.showProgress();
					}
				}
			}
		};

		return [
			use,
			className,
			stickyHeader,
			container$use,
			container$class,
			table$use,
			table$class,
			instance,
			element,
			container,
			header,
			body,
			internalClasses,
			progressIndicatorStyles,
			postMount,
			forwardEvents,
			progressClosed,
			sortStore,
			sortDirectionStore,
			handleHeaderMount,
			handleBodyMount,
			handleBodyCheckboxChange,
			handleHeaderRowClick,
			handleRowClick,
			$$slots,
			$$restProps,
			sort,
			sortDirection,
			sortable,
			sortAscendingAriaLabel,
			sortDescendingAriaLabel,
			layout,
			getElement,
			previousProgressClosed,
			$progressClosed,
			$$scope,
			slots,
			div0_binding,
			div1_binding,
			SMUICheckbox_mount_handler,
			SMUIDataTableHeader_unmount_handler,
			SMUIDataTableBody_unmount_handler,
			SMUIDataTableHeaderCheckbox_change_handler
		];
	}

	class DataTable extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance_1,
				create_fragment$b,
				safe_not_equal,
				{
					use: 0,
					class: 1,
					stickyHeader: 2,
					sortable: 28,
					sort: 26,
					sortDirection: 27,
					sortAscendingAriaLabel: 29,
					sortDescendingAriaLabel: 30,
					container$use: 3,
					container$class: 4,
					table$use: 5,
					table$class: 6,
					layout: 31,
					getElement: 32
				},
				null,
				[-1, -1]
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DataTable",
				options,
				id: create_fragment$b.name
			});
		}

		get use() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set use(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get stickyHeader() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set stickyHeader(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sortable() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sortable(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sort() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sort(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sortDirection() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sortDirection(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sortAscendingAriaLabel() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sortAscendingAriaLabel(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sortDescendingAriaLabel() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sortDescendingAriaLabel(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get container$use() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set container$use(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get container$class() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set container$class(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get table$use() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set table$use(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get table$class() {
			throw new Error_1("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set table$class(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get layout() {
			return this.$$.ctx[31];
		}

		set layout(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get getElement() {
			return this.$$.ctx[32];
		}

		set getElement(value) {
			throw new Error_1("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules\@smui\data-table\dist\Head.svelte generated by Svelte v4.2.19 */
	const file$a = "node_modules\\@smui\\data-table\\dist\\Head.svelte";

	function create_fragment$a(ctx) {
		let thead;
		let useActions_action;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[10].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
		let thead_levels = [/*$$restProps*/ ctx[7]];
		let thead_data = {};

		for (let i = 0; i < thead_levels.length; i += 1) {
			thead_data = assign(thead_data, thead_levels[i]);
		}

		const block = {
			c: function create() {
				thead = element("thead");
				if (default_slot) default_slot.c();
				set_attributes(thead, thead_data);
				add_location(thead, file$a, 0, 0, 0);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, thead, anchor);

				if (default_slot) {
					default_slot.m(thead, null);
				}

				/*thead_binding*/ ctx[11](thead);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, thead, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[3].call(null, thead)),
						listen_dev(thead, "SMUICheckbox:mount", /*handleCheckboxMount*/ ctx[4], false, false, false, false),
						listen_dev(thead, "SMUICheckbox:unmount", /*SMUICheckbox_unmount_handler*/ ctx[12], false, false, false, false),
						listen_dev(thead, "SMUIDataTableCell:mount", /*handleCellMount*/ ctx[5], false, false, false, false),
						listen_dev(thead, "SMUIDataTableCell:unmount", /*handleCellUnmount*/ ctx[6], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[9],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
							null
						);
					}
				}

				set_attributes(thead, thead_data = get_spread_update(thead_levels, [dirty & /*$$restProps*/ 128 && /*$$restProps*/ ctx[7]]));
				if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
				/*thead_binding*/ ctx[11](null);
				mounted = false;
				run_all(dispose);
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
		const omit_props_names = ["use","getElement"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Head', slots, ['default']);
		const forwardEvents = forwardEventsBuilder(get_current_component());
		let { use = [] } = $$props;
		let element;
		let checkbox = undefined;
		let cells = [];
		const cellAccessorMap = new WeakMap();
		setContext('SMUI:data-table:row:header', true);

		onMount(() => {
			const accessor = {
				get cells() {
					return cells;
				},
				get orderedCells() {
					return getOrderedCells();
				},
				get checkbox() {
					return checkbox;
				}
			};

			dispatch(getElement(), 'SMUIDataTableHeader:mount', accessor);

			return () => {
				dispatch(getElement(), 'SMUIDataTableHeader:unmount', accessor);
			};
		});

		function handleCheckboxMount(event) {
			$$invalidate(2, checkbox = event.detail);
		}

		function handleCellMount(event) {
			cells.push(event.detail);
			cellAccessorMap.set(event.detail.element, event.detail);
			event.stopPropagation();
		}

		function handleCellUnmount(event) {
			const idx = cells.indexOf(event.detail);

			if (idx !== -1) {
				cells.splice(idx, 1);
				cells = cells;
			}

			cellAccessorMap.delete(event.detail.element);
			event.stopPropagation();
		}

		function getOrderedCells() {
			return [...getElement().querySelectorAll('.mdc-data-table__header-cell')].map(element => cellAccessorMap.get(element)).filter(accessor => accessor && accessor._smui_data_table_header_cell_accessor);
		}

		function getElement() {
			return element;
		}

		function thead_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(1, element);
			});
		}

		const SMUICheckbox_unmount_handler = () => $$invalidate(2, checkbox = undefined);

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
			if ('$$scope' in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			onMount,
			setContext,
			get_current_component,
			forwardEventsBuilder,
			useActions,
			dispatch,
			forwardEvents,
			use,
			element,
			checkbox,
			cells,
			cellAccessorMap,
			handleCheckboxMount,
			handleCellMount,
			handleCellUnmount,
			getOrderedCells,
			getElement
		});

		$$self.$inject_state = $$new_props => {
			if ('use' in $$props) $$invalidate(0, use = $$new_props.use);
			if ('element' in $$props) $$invalidate(1, element = $$new_props.element);
			if ('checkbox' in $$props) $$invalidate(2, checkbox = $$new_props.checkbox);
			if ('cells' in $$props) cells = $$new_props.cells;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			use,
			element,
			checkbox,
			forwardEvents,
			handleCheckboxMount,
			handleCellMount,
			handleCellUnmount,
			$$restProps,
			getElement,
			$$scope,
			slots,
			thead_binding,
			SMUICheckbox_unmount_handler
		];
	}

	class Head extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, { use: 0, getElement: 8 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Head",
				options,
				id: create_fragment$a.name
			});
		}

		get use() {
			throw new Error("<Head>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set use(value) {
			throw new Error("<Head>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get getElement() {
			return this.$$.ctx[8];
		}

		set getElement(value) {
			throw new Error("<Head>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules\@smui\data-table\dist\Body.svelte generated by Svelte v4.2.19 */

	const file$9 = "node_modules\\@smui\\data-table\\dist\\Body.svelte";

	function create_fragment$9(ctx) {
		let tbody;
		let tbody_class_value;
		let useActions_action;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[9].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

		let tbody_levels = [
			{
				class: tbody_class_value = classMap({
					[/*className*/ ctx[1]]: true,
					'mdc-data-table__content': true
				})
			},
			/*$$restProps*/ ctx[6]
		];

		let tbody_data = {};

		for (let i = 0; i < tbody_levels.length; i += 1) {
			tbody_data = assign(tbody_data, tbody_levels[i]);
		}

		const block = {
			c: function create() {
				tbody = element("tbody");
				if (default_slot) default_slot.c();
				set_attributes(tbody, tbody_data);
				add_location(tbody, file$9, 0, 0, 0);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, tbody, anchor);

				if (default_slot) {
					default_slot.m(tbody, null);
				}

				/*tbody_binding*/ ctx[10](tbody);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, tbody, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[3].call(null, tbody)),
						listen_dev(tbody, "SMUIDataTableRow:mount", /*handleRowMount*/ ctx[4], false, false, false, false),
						listen_dev(tbody, "SMUIDataTableRow:unmount", /*handleRowUnmount*/ ctx[5], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[8],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
							null
						);
					}
				}

				set_attributes(tbody, tbody_data = get_spread_update(tbody_levels, [
					(!current || dirty & /*className*/ 2 && tbody_class_value !== (tbody_class_value = classMap({
						[/*className*/ ctx[1]]: true,
						'mdc-data-table__content': true
					}))) && { class: tbody_class_value },
					dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]
				]));

				if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
					detach_dev(tbody);
				}

				if (default_slot) default_slot.d(detaching);
				/*tbody_binding*/ ctx[10](null);
				mounted = false;
				run_all(dispose);
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
		const omit_props_names = ["use","class","getElement"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Body', slots, ['default']);
		const forwardEvents = forwardEventsBuilder(get_current_component());
		let { use = [] } = $$props;
		let { class: className = '' } = $$props;
		let element;
		let rows = [];
		const rowAccessorMap = new WeakMap();
		setContext('SMUI:data-table:row:header', false);

		onMount(() => {
			const accessor = {
				get rows() {
					return rows;
				},
				get orderedRows() {
					return getOrderedRows();
				}
			};

			dispatch(getElement(), 'SMUIDataTableBody:mount', accessor);

			return () => {
				dispatch(getElement(), 'SMUIDataTableBody:unmount', accessor);
			};
		});

		function handleRowMount(event) {
			rows.push(event.detail);
			rowAccessorMap.set(event.detail.element, event.detail);
			event.stopPropagation();
		}

		function handleRowUnmount(event) {
			const idx = rows.indexOf(event.detail);

			if (idx !== -1) {
				rows.splice(idx, 1);
				rows = rows;
			}

			rowAccessorMap.delete(event.detail.element);
			event.stopPropagation();
		}

		function getOrderedRows() {
			return [...getElement().querySelectorAll('.mdc-data-table__row')].map(element => rowAccessorMap.get(element)).filter(accessor => accessor && accessor._smui_data_table_row_accessor);
		}

		function getElement() {
			return element;
		}

		function tbody_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(2, element);
			});
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
			if ('class' in $$new_props) $$invalidate(1, className = $$new_props.class);
			if ('$$scope' in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			onMount,
			setContext,
			get_current_component,
			forwardEventsBuilder,
			classMap,
			useActions,
			dispatch,
			forwardEvents,
			use,
			className,
			element,
			rows,
			rowAccessorMap,
			handleRowMount,
			handleRowUnmount,
			getOrderedRows,
			getElement
		});

		$$self.$inject_state = $$new_props => {
			if ('use' in $$props) $$invalidate(0, use = $$new_props.use);
			if ('className' in $$props) $$invalidate(1, className = $$new_props.className);
			if ('element' in $$props) $$invalidate(2, element = $$new_props.element);
			if ('rows' in $$props) rows = $$new_props.rows;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			use,
			className,
			element,
			forwardEvents,
			handleRowMount,
			handleRowUnmount,
			$$restProps,
			getElement,
			$$scope,
			slots,
			tbody_binding
		];
	}

	class Body extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, { use: 0, class: 1, getElement: 7 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Body",
				options,
				id: create_fragment$9.name
			});
		}

		get use() {
			throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set use(value) {
			throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error("<Body>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get getElement() {
			return this.$$.ctx[7];
		}

		set getElement(value) {
			throw new Error("<Body>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules\@smui\data-table\dist\Row.svelte generated by Svelte v4.2.19 */

	const file$8 = "node_modules\\@smui\\data-table\\dist\\Row.svelte";

	function create_fragment$8(ctx) {
		let tr;
		let tr_class_value;
		let tr_aria_selected_value;
		let useActions_action;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[15].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

		let tr_levels = [
			{
				class: tr_class_value = classMap({
					[/*className*/ ctx[1]]: true,
					'mdc-data-table__header-row': /*header*/ ctx[7],
					'mdc-data-table__row': !/*header*/ ctx[7],
					'mdc-data-table__row--selected': !/*header*/ ctx[7] && /*checkbox*/ ctx[3] && /*checkbox*/ ctx[3].checked,
					.../*internalClasses*/ ctx[4]
				})
			},
			{
				"aria-selected": tr_aria_selected_value = /*checkbox*/ ctx[3]
				? /*checkbox*/ ctx[3].checked ? 'true' : 'false'
				: undefined
			},
			/*internalAttrs*/ ctx[5],
			/*$$restProps*/ ctx[11]
		];

		let tr_data = {};

		for (let i = 0; i < tr_levels.length; i += 1) {
			tr_data = assign(tr_data, tr_levels[i]);
		}

		const block = {
			c: function create() {
				tr = element("tr");
				if (default_slot) default_slot.c();
				set_attributes(tr, tr_data);
				add_location(tr, file$8, 0, 0, 0);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, tr, anchor);

				if (default_slot) {
					default_slot.m(tr, null);
				}

				/*tr_binding*/ ctx[16](tr);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, tr, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[6].call(null, tr)),
						listen_dev(tr, "click", /*click_handler*/ ctx[17], false, false, false, false),
						listen_dev(tr, "SMUICheckbox:mount", /*handleCheckboxMount*/ ctx[8], false, false, false, false),
						listen_dev(tr, "SMUICheckbox:unmount", /*SMUICheckbox_unmount_handler*/ ctx[18], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[14],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
							null
						);
					}
				}

				set_attributes(tr, tr_data = get_spread_update(tr_levels, [
					(!current || dirty & /*className, checkbox, internalClasses*/ 26 && tr_class_value !== (tr_class_value = classMap({
						[/*className*/ ctx[1]]: true,
						'mdc-data-table__header-row': /*header*/ ctx[7],
						'mdc-data-table__row': !/*header*/ ctx[7],
						'mdc-data-table__row--selected': !/*header*/ ctx[7] && /*checkbox*/ ctx[3] && /*checkbox*/ ctx[3].checked,
						.../*internalClasses*/ ctx[4]
					}))) && { class: tr_class_value },
					(!current || dirty & /*checkbox*/ 8 && tr_aria_selected_value !== (tr_aria_selected_value = /*checkbox*/ ctx[3]
					? /*checkbox*/ ctx[3].checked ? 'true' : 'false'
					: undefined)) && { "aria-selected": tr_aria_selected_value },
					dirty & /*internalAttrs*/ 32 && /*internalAttrs*/ ctx[5],
					dirty & /*$$restProps*/ 2048 && /*$$restProps*/ ctx[11]
				]));

				if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
				/*tr_binding*/ ctx[16](null);
				mounted = false;
				run_all(dispose);
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
	let counter$1 = 0;

	function instance$8($$self, $$props, $$invalidate) {
		const omit_props_names = ["use","class","rowId","getElement"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Row', slots, ['default']);
		const forwardEvents = forwardEventsBuilder(get_current_component());
		let { use = [] } = $$props;
		let { class: className = '' } = $$props;
		let { rowId = 'SMUI-data-table-row-' + counter$1++ } = $$props;
		let element;
		let checkbox = undefined;
		let internalClasses = {};
		let internalAttrs = {};
		let header = getContext('SMUI:data-table:row:header');

		onMount(() => {
			const accessor = header
			? {
					_smui_data_table_row_accessor: false,
					get element() {
						return getElement();
					},
					get checkbox() {
						return checkbox;
					},
					get rowId() {
						return undefined;
					},
					get selected() {
						var _a;

						return (_a = checkbox && checkbox.checked) !== null && _a !== void 0
						? _a
						: false;
					},
					addClass,
					removeClass,
					getAttr,
					addAttr
				}
			: {
					_smui_data_table_row_accessor: true,
					get element() {
						return getElement();
					},
					get checkbox() {
						return checkbox;
					},
					get rowId() {
						return rowId;
					},
					get selected() {
						var _a;

						return (_a = checkbox && checkbox.checked) !== null && _a !== void 0
						? _a
						: false;
					},
					addClass,
					removeClass,
					getAttr,
					addAttr
				};

			dispatch(getElement(), 'SMUIDataTableRow:mount', accessor);

			return () => {
				dispatch(getElement(), 'SMUIDataTableRow:unmount', accessor);
			};
		});

		function handleCheckboxMount(event) {
			$$invalidate(3, checkbox = event.detail);
		}

		function addClass(className) {
			if (!internalClasses[className]) {
				$$invalidate(4, internalClasses[className] = true, internalClasses);
			}
		}

		function removeClass(className) {
			if (!(className in internalClasses) || internalClasses[className]) {
				$$invalidate(4, internalClasses[className] = false, internalClasses);
			}
		}

		function getAttr(name) {
			var _a;

			return name in internalAttrs
			? (_a = internalAttrs[name]) !== null && _a !== void 0
				? _a
				: null
			: getElement().getAttribute(name);
		}

		function addAttr(name, value) {
			if (internalAttrs[name] !== value) {
				$$invalidate(5, internalAttrs[name] = value, internalAttrs);
			}
		}

		function notifyHeaderClick(event) {
			dispatch(getElement(), 'SMUIDataTableHeader:click', event);
		}

		function notifyRowClick(event) {
			dispatch(getElement(), 'SMUIDataTableRow:click', { rowId, target: event.target });
		}

		function getElement() {
			return element;
		}

		function tr_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(2, element);
			});
		}

		const click_handler = event => header
		? notifyHeaderClick(event)
		: notifyRowClick(event);

		const SMUICheckbox_unmount_handler = () => $$invalidate(3, checkbox = undefined);

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
			if ('class' in $$new_props) $$invalidate(1, className = $$new_props.class);
			if ('rowId' in $$new_props) $$invalidate(12, rowId = $$new_props.rowId);
			if ('$$scope' in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			counter: counter$1,
			onMount,
			getContext,
			get_current_component,
			forwardEventsBuilder,
			classMap,
			useActions,
			dispatch,
			forwardEvents,
			use,
			className,
			rowId,
			element,
			checkbox,
			internalClasses,
			internalAttrs,
			header,
			handleCheckboxMount,
			addClass,
			removeClass,
			getAttr,
			addAttr,
			notifyHeaderClick,
			notifyRowClick,
			getElement
		});

		$$self.$inject_state = $$new_props => {
			if ('use' in $$props) $$invalidate(0, use = $$new_props.use);
			if ('className' in $$props) $$invalidate(1, className = $$new_props.className);
			if ('rowId' in $$props) $$invalidate(12, rowId = $$new_props.rowId);
			if ('element' in $$props) $$invalidate(2, element = $$new_props.element);
			if ('checkbox' in $$props) $$invalidate(3, checkbox = $$new_props.checkbox);
			if ('internalClasses' in $$props) $$invalidate(4, internalClasses = $$new_props.internalClasses);
			if ('internalAttrs' in $$props) $$invalidate(5, internalAttrs = $$new_props.internalAttrs);
			if ('header' in $$props) $$invalidate(7, header = $$new_props.header);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			use,
			className,
			element,
			checkbox,
			internalClasses,
			internalAttrs,
			forwardEvents,
			header,
			handleCheckboxMount,
			notifyHeaderClick,
			notifyRowClick,
			$$restProps,
			rowId,
			getElement,
			$$scope,
			slots,
			tr_binding,
			click_handler,
			SMUICheckbox_unmount_handler
		];
	}

	class Row extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$8, create_fragment$8, safe_not_equal, {
				use: 0,
				class: 1,
				rowId: 12,
				getElement: 13
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Row",
				options,
				id: create_fragment$8.name
			});
		}

		get use() {
			throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set use(value) {
			throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get rowId() {
			throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set rowId(value) {
			throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get getElement() {
			return this.$$.ctx[13];
		}

		set getElement(value) {
			throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* node_modules\@smui\data-table\dist\Cell.svelte generated by Svelte v4.2.19 */

	const file$7 = "node_modules\\@smui\\data-table\\dist\\Cell.svelte";

	// (43:0) {:else}
	function create_else_block_1(ctx) {
		let td;
		let td_class_value;
		let useActions_action;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[22].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

		let td_levels = [
			{
				class: td_class_value = classMap({
					[/*className*/ ctx[1]]: true,
					'mdc-data-table__cell': true,
					'mdc-data-table__cell--numeric': /*numeric*/ ctx[2],
					'mdc-data-table__cell--checkbox': /*checkbox*/ ctx[3],
					.../*internalClasses*/ ctx[7]
				})
			},
			/*internalAttrs*/ ctx[8],
			/*$$restProps*/ ctx[19]
		];

		let td_data = {};

		for (let i = 0; i < td_levels.length; i += 1) {
			td_data = assign(td_data, td_levels[i]);
		}

		const block = {
			c: function create() {
				td = element("td");
				if (default_slot) default_slot.c();
				set_attributes(td, td_data);
				add_location(td, file$7, 43, 2, 1231);
			},
			m: function mount(target, anchor) {
				insert_dev(target, td, anchor);

				if (default_slot) {
					default_slot.m(td, null);
				}

				/*td_binding*/ ctx[25](td);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, td, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[11].call(null, td)),
						listen_dev(td, "change", /*change_handler_1*/ ctx[26], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2097152)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[21],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[21])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, null),
							null
						);
					}
				}

				set_attributes(td, td_data = get_spread_update(td_levels, [
					(!current || dirty & /*className, numeric, checkbox, internalClasses*/ 142 && td_class_value !== (td_class_value = classMap({
						[/*className*/ ctx[1]]: true,
						'mdc-data-table__cell': true,
						'mdc-data-table__cell--numeric': /*numeric*/ ctx[2],
						'mdc-data-table__cell--checkbox': /*checkbox*/ ctx[3],
						.../*internalClasses*/ ctx[7]
					}))) && { class: td_class_value },
					dirty & /*internalAttrs*/ 256 && /*internalAttrs*/ ctx[8],
					dirty & /*$$restProps*/ 524288 && /*$$restProps*/ ctx[19]
				]));

				if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
					detach_dev(td);
				}

				if (default_slot) default_slot.d(detaching);
				/*td_binding*/ ctx[25](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block_1.name,
			type: "else",
			source: "(43:0) {:else}",
			ctx
		});

		return block;
	}

	// (1:0) {#if header}
	function create_if_block$2(ctx) {
		let th;
		let current_block_type_index;
		let if_block;
		let th_class_value;
		let th_aria_sort_value;
		let useActions_action;
		let current;
		let mounted;
		let dispose;
		const if_block_creators = [create_if_block_1, create_else_block$2];
		const if_blocks = [];

		function select_block_type_1(ctx, dirty) {
			if (/*sortable*/ ctx[5]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type_1(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		let th_levels = [
			{
				class: th_class_value = classMap({
					[/*className*/ ctx[1]]: true,
					'mdc-data-table__header-cell': true,
					'mdc-data-table__header-cell--numeric': /*numeric*/ ctx[2],
					'mdc-data-table__header-cell--checkbox': /*checkbox*/ ctx[3],
					'mdc-data-table__header-cell--with-sort': /*sortable*/ ctx[5],
					'mdc-data-table__header-cell--sorted': /*sortable*/ ctx[5] && /*$sort*/ ctx[9] === /*columnId*/ ctx[4],
					.../*internalClasses*/ ctx[7]
				})
			},
			{ role: "columnheader" },
			{ scope: "col" },
			{ "data-column-id": /*columnId*/ ctx[4] },
			{
				"aria-sort": th_aria_sort_value = /*sortable*/ ctx[5]
				? /*$sort*/ ctx[9] === /*columnId*/ ctx[4]
					? /*$sortDirection*/ ctx[10]
					: 'none'
				: undefined
			},
			/*internalAttrs*/ ctx[8],
			/*$$restProps*/ ctx[19]
		];

		let th_data = {};

		for (let i = 0; i < th_levels.length; i += 1) {
			th_data = assign(th_data, th_levels[i]);
		}

		const block = {
			c: function create() {
				th = element("th");
				if_block.c();
				set_attributes(th, th_data);
				add_location(th, file$7, 1, 2, 15);
			},
			m: function mount(target, anchor) {
				insert_dev(target, th, anchor);
				if_blocks[current_block_type_index].m(th, null);
				/*th_binding*/ ctx[23](th);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(useActions_action = useActions.call(null, th, /*use*/ ctx[0])),
						action_destroyer(/*forwardEvents*/ ctx[11].call(null, th)),
						listen_dev(th, "change", /*change_handler*/ ctx[24], false, false, false, false)
					];

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
					if_block.m(th, null);
				}

				set_attributes(th, th_data = get_spread_update(th_levels, [
					(!current || dirty & /*className, numeric, checkbox, sortable, $sort, columnId, internalClasses*/ 702 && th_class_value !== (th_class_value = classMap({
						[/*className*/ ctx[1]]: true,
						'mdc-data-table__header-cell': true,
						'mdc-data-table__header-cell--numeric': /*numeric*/ ctx[2],
						'mdc-data-table__header-cell--checkbox': /*checkbox*/ ctx[3],
						'mdc-data-table__header-cell--with-sort': /*sortable*/ ctx[5],
						'mdc-data-table__header-cell--sorted': /*sortable*/ ctx[5] && /*$sort*/ ctx[9] === /*columnId*/ ctx[4],
						.../*internalClasses*/ ctx[7]
					}))) && { class: th_class_value },
					{ role: "columnheader" },
					{ scope: "col" },
					(!current || dirty & /*columnId*/ 16) && { "data-column-id": /*columnId*/ ctx[4] },
					(!current || dirty & /*sortable, $sort, columnId, $sortDirection*/ 1584 && th_aria_sort_value !== (th_aria_sort_value = /*sortable*/ ctx[5]
					? /*$sort*/ ctx[9] === /*columnId*/ ctx[4]
						? /*$sortDirection*/ ctx[10]
						: 'none'
					: undefined)) && { "aria-sort": th_aria_sort_value },
					dirty & /*internalAttrs*/ 256 && /*internalAttrs*/ ctx[8],
					dirty & /*$$restProps*/ 524288 && /*$$restProps*/ ctx[19]
				]));

				if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
					detach_dev(th);
				}

				if_blocks[current_block_type_index].d();
				/*th_binding*/ ctx[23](null);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(1:0) {#if header}",
			ctx
		});

		return block;
	}

	// (41:4) {:else}
	function create_else_block$2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[22].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

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
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2097152)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[21],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[21])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, null),
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
			source: "(41:4) {:else}",
			ctx
		});

		return block;
	}

	// (26:5) {#if sortable}
	function create_if_block_1(ctx) {
		let div1;
		let t0;
		let div0;

		let t1_value = (/*$sort*/ ctx[9] === /*columnId*/ ctx[4]
		? /*$sortDirection*/ ctx[10] === 'ascending'
			? /*sortAscendingAriaLabel*/ ctx[15]
			: /*sortDescendingAriaLabel*/ ctx[16]
		: '') + "";

		let t1;
		let div0_id_value;
		let current;
		const default_slot_template = /*#slots*/ ctx[22].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

		const block = {
			c: function create() {
				div1 = element("div");
				if (default_slot) default_slot.c();
				t0 = space();
				div0 = element("div");
				t1 = text(t1_value);
				attr_dev(div0, "class", "mdc-data-table__sort-status-label");
				attr_dev(div0, "aria-hidden", "true");
				attr_dev(div0, "id", div0_id_value = "" + (/*columnId*/ ctx[4] + "-status-label"));
				add_location(div0, file$7, 28, 8, 853);
				attr_dev(div1, "class", "mdc-data-table__header-cell-wrapper");
				add_location(div1, file$7, 26, 6, 778);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);

				if (default_slot) {
					default_slot.m(div1, null);
				}

				append_dev(div1, t0);
				append_dev(div1, div0);
				append_dev(div0, t1);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 2097152)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[21],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[21])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, null),
							null
						);
					}
				}

				if ((!current || dirty & /*$sort, columnId, $sortDirection*/ 1552) && t1_value !== (t1_value = (/*$sort*/ ctx[9] === /*columnId*/ ctx[4]
				? /*$sortDirection*/ ctx[10] === 'ascending'
					? /*sortAscendingAriaLabel*/ ctx[15]
					: /*sortDescendingAriaLabel*/ ctx[16]
				: '') + "")) set_data_dev(t1, t1_value);

				if (!current || dirty & /*columnId*/ 16 && div0_id_value !== (div0_id_value = "" + (/*columnId*/ ctx[4] + "-status-label"))) {
					attr_dev(div0, "id", div0_id_value);
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
					detach_dev(div1);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(26:5) {#if sortable}",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$2, create_else_block_1];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*header*/ ctx[12]) return 0;
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
				if_block.p(ctx, dirty);
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
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}
	let counter = 0;

	function instance$7($$self, $$props, $$invalidate) {
		const omit_props_names = ["use","class","numeric","checkbox","columnId","sortable","getElement"];
		let $$restProps = compute_rest_props($$props, omit_props_names);
		let $sort;
		let $sortDirection;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Cell', slots, ['default']);
		const forwardEvents = forwardEventsBuilder(get_current_component());
		let header = getContext('SMUI:data-table:row:header');
		let { use = [] } = $$props;
		let { class: className = '' } = $$props;
		let { numeric = false } = $$props;
		let { checkbox = false } = $$props;

		let { columnId = header
		? 'SMUI-data-table-column-' + counter++
		: 'SMUI-data-table-unused' } = $$props;

		let { sortable = getContext('SMUI:data-table:sortable') } = $$props;
		let element;
		let internalClasses = {};
		let internalAttrs = {};
		let sort = getContext('SMUI:data-table:sort');
		validate_store(sort, 'sort');
		component_subscribe($$self, sort, value => $$invalidate(9, $sort = value));
		let sortDirection = getContext('SMUI:data-table:sortDirection');
		validate_store(sortDirection, 'sortDirection');
		component_subscribe($$self, sortDirection, value => $$invalidate(10, $sortDirection = value));
		let sortAscendingAriaLabel = getContext('SMUI:data-table:sortAscendingAriaLabel');
		let sortDescendingAriaLabel = getContext('SMUI:data-table:sortDescendingAriaLabel');

		if (sortable) {
			setContext('SMUI:label:context', 'data-table:sortable-header-cell');
			setContext('SMUI:icon-button:context', 'data-table:sortable-header-cell');
			setContext('SMUI:icon-button:aria-describedby', columnId + '-status-label');
		}

		onMount(() => {
			const accessor = header
			? {
					_smui_data_table_header_cell_accessor: true,
					get element() {
						return getElement();
					},
					get columnId() {
						return columnId;
					},
					addClass,
					removeClass,
					getAttr,
					addAttr
				}
			: {
					_smui_data_table_header_cell_accessor: false,
					get element() {
						return getElement();
					},
					get columnId() {
						return undefined;
					},
					addClass,
					removeClass,
					getAttr,
					addAttr
				};

			dispatch(getElement(), 'SMUIDataTableCell:mount', accessor);

			return () => {
				dispatch(getElement(), 'SMUIDataTableCell:unmount', accessor);
			};
		});

		function addClass(className) {
			if (!internalClasses[className]) {
				$$invalidate(7, internalClasses[className] = true, internalClasses);
			}
		}

		function removeClass(className) {
			if (!(className in internalClasses) || internalClasses[className]) {
				$$invalidate(7, internalClasses[className] = false, internalClasses);
			}
		}

		function getAttr(name) {
			var _a;

			return name in internalAttrs
			? (_a = internalAttrs[name]) !== null && _a !== void 0
				? _a
				: null
			: getElement().getAttribute(name);
		}

		function addAttr(name, value) {
			if (internalAttrs[name] !== value) {
				$$invalidate(8, internalAttrs[name] = value, internalAttrs);
			}
		}

		function notifyHeaderChange(event) {
			dispatch(getElement(), 'SMUIDataTableHeaderCheckbox:change', event);
		}

		function notifyBodyChange(event) {
			dispatch(getElement(), 'SMUIDataTableBodyCheckbox:change', event);
		}

		function getElement() {
			return element;
		}

		function th_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(6, element);
			});
		}

		const change_handler = event => checkbox && notifyHeaderChange(event);

		function td_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				element = $$value;
				$$invalidate(6, element);
			});
		}

		const change_handler_1 = event => checkbox && notifyBodyChange(event);

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(19, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
			if ('class' in $$new_props) $$invalidate(1, className = $$new_props.class);
			if ('numeric' in $$new_props) $$invalidate(2, numeric = $$new_props.numeric);
			if ('checkbox' in $$new_props) $$invalidate(3, checkbox = $$new_props.checkbox);
			if ('columnId' in $$new_props) $$invalidate(4, columnId = $$new_props.columnId);
			if ('sortable' in $$new_props) $$invalidate(5, sortable = $$new_props.sortable);
			if ('$$scope' in $$new_props) $$invalidate(21, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			counter,
			onMount,
			getContext,
			setContext,
			get_current_component,
			forwardEventsBuilder,
			classMap,
			useActions,
			dispatch,
			forwardEvents,
			header,
			use,
			className,
			numeric,
			checkbox,
			columnId,
			sortable,
			element,
			internalClasses,
			internalAttrs,
			sort,
			sortDirection,
			sortAscendingAriaLabel,
			sortDescendingAriaLabel,
			addClass,
			removeClass,
			getAttr,
			addAttr,
			notifyHeaderChange,
			notifyBodyChange,
			getElement,
			$sort,
			$sortDirection
		});

		$$self.$inject_state = $$new_props => {
			if ('header' in $$props) $$invalidate(12, header = $$new_props.header);
			if ('use' in $$props) $$invalidate(0, use = $$new_props.use);
			if ('className' in $$props) $$invalidate(1, className = $$new_props.className);
			if ('numeric' in $$props) $$invalidate(2, numeric = $$new_props.numeric);
			if ('checkbox' in $$props) $$invalidate(3, checkbox = $$new_props.checkbox);
			if ('columnId' in $$props) $$invalidate(4, columnId = $$new_props.columnId);
			if ('sortable' in $$props) $$invalidate(5, sortable = $$new_props.sortable);
			if ('element' in $$props) $$invalidate(6, element = $$new_props.element);
			if ('internalClasses' in $$props) $$invalidate(7, internalClasses = $$new_props.internalClasses);
			if ('internalAttrs' in $$props) $$invalidate(8, internalAttrs = $$new_props.internalAttrs);
			if ('sort' in $$props) $$invalidate(13, sort = $$new_props.sort);
			if ('sortDirection' in $$props) $$invalidate(14, sortDirection = $$new_props.sortDirection);
			if ('sortAscendingAriaLabel' in $$props) $$invalidate(15, sortAscendingAriaLabel = $$new_props.sortAscendingAriaLabel);
			if ('sortDescendingAriaLabel' in $$props) $$invalidate(16, sortDescendingAriaLabel = $$new_props.sortDescendingAriaLabel);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			use,
			className,
			numeric,
			checkbox,
			columnId,
			sortable,
			element,
			internalClasses,
			internalAttrs,
			$sort,
			$sortDirection,
			forwardEvents,
			header,
			sort,
			sortDirection,
			sortAscendingAriaLabel,
			sortDescendingAriaLabel,
			notifyHeaderChange,
			notifyBodyChange,
			$$restProps,
			getElement,
			$$scope,
			slots,
			th_binding,
			change_handler,
			td_binding,
			change_handler_1
		];
	}

	class Cell extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$7, create_fragment$7, safe_not_equal, {
				use: 0,
				class: 1,
				numeric: 2,
				checkbox: 3,
				columnId: 4,
				sortable: 5,
				getElement: 20
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Cell",
				options,
				id: create_fragment$7.name
			});
		}

		get use() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set use(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get class() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get numeric() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set numeric(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get checkbox() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set checkbox(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get columnId() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set columnId(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get sortable() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sortable(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get getElement() {
			return this.$$.ctx[20];
		}

		set getElement(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
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

	/* node_modules\@sveltestrap\sveltestrap\dist\Colgroup\Colgroup.svelte generated by Svelte v4.2.19 */
	const file$6 = "node_modules\\@sveltestrap\\sveltestrap\\dist\\Colgroup\\Colgroup.svelte";

	function create_fragment$6(ctx) {
		let colgroup;
		let current;
		const default_slot_template = /*#slots*/ ctx[1].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

		const block = {
			c: function create() {
				colgroup = element("colgroup");
				if (default_slot) default_slot.c();
				add_location(colgroup, file$6, 6, 0, 92);
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
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
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
			init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Colgroup",
				options,
				id: create_fragment$6.name
			});
		}
	}

	/* node_modules\@sveltestrap\sveltestrap\dist\ResponsiveContainer\ResponsiveContainer.svelte generated by Svelte v4.2.19 */
	const file$5 = "node_modules\\@sveltestrap\\sveltestrap\\dist\\ResponsiveContainer\\ResponsiveContainer.svelte";

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
				add_location(div, file$5, 14, 2, 343);
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

	function create_fragment$5(ctx) {
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
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
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
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { class: 2, responsive: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ResponsiveContainer",
				options,
				id: create_fragment$5.name
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

	/* node_modules\@sveltestrap\sveltestrap\dist\TableFooter\TableFooter.svelte generated by Svelte v4.2.19 */
	const file$4 = "node_modules\\@sveltestrap\\sveltestrap\\dist\\TableFooter\\TableFooter.svelte";

	function create_fragment$4(ctx) {
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
				add_location(tr, file$4, 7, 2, 117);
				set_attributes(tfoot, tfoot_data);
				add_location(tfoot, file$4, 6, 0, 90);
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
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
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
			init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TableFooter",
				options,
				id: create_fragment$4.name
			});
		}
	}

	/* node_modules\@sveltestrap\sveltestrap\dist\TableHeader\TableHeader.svelte generated by Svelte v4.2.19 */
	const file$3 = "node_modules\\@sveltestrap\\sveltestrap\\dist\\TableHeader\\TableHeader.svelte";

	function create_fragment$3(ctx) {
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
				add_location(tr, file$3, 7, 2, 117);
				set_attributes(thead, thead_data);
				add_location(thead, file$3, 6, 0, 90);
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
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
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
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "TableHeader",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* node_modules\@sveltestrap\sveltestrap\dist\Table\Table.svelte generated by Svelte v4.2.19 */
	const file$2 = "node_modules\\@sveltestrap\\sveltestrap\\dist\\Table\\Table.svelte";

	function get_each_context(ctx, list, i) {
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
					$$slots: { default: [create_default_slot_2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		let each_value = ensure_array_like_dev(/*rows*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		tablefooter = new TableFooter({
				props: {
					$$slots: { default: [create_default_slot_1] },
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
				add_location(tbody, file$2, 77, 6, 1743);
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
	function create_default_slot_2(ctx) {
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
			id: create_default_slot_2.name,
			type: "slot",
			source: "(75:6) <TableHeader>",
			ctx
		});

		return block;
	}

	// (79:8) {#each rows as row}
	function create_each_block(ctx) {
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
				add_location(tr, file$2, 79, 10, 1789);
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
			id: create_each_block.name,
			type: "each",
			source: "(79:8) {#each rows as row}",
			ctx
		});

		return block;
	}

	// (85:6) <TableFooter>
	function create_default_slot_1(ctx) {
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
			id: create_default_slot_1.name,
			type: "slot",
			source: "(85:6) <TableFooter>",
			ctx
		});

		return block;
	}

	// (69:0) <ResponsiveContainer {responsive}>
	function create_default_slot$1(ctx) {
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
				add_location(table, file$2, 69, 2, 1571);
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
			id: create_default_slot$1.name,
			type: "slot",
			source: "(69:0) <ResponsiveContainer {responsive}>",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let responsivecontainer;
		let current;

		responsivecontainer = new ResponsiveContainer({
				props: {
					responsive: /*responsive*/ ctx[0],
					$$slots: { default: [create_default_slot$1] },
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
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
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

			init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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
				id: create_fragment$2.name
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

	/* src\pages\HomePage.svelte generated by Svelte v4.2.19 */
	const file$1 = "src\\pages\\HomePage.svelte";

	// (6:0) <Table bordered>
	function create_default_slot(ctx) {
		let thead;
		let tr0;
		let th0;
		let t1;
		let th1;
		let t3;
		let th2;
		let t5;
		let th3;
		let t7;
		let tbody;
		let tr1;
		let th4;
		let t9;
		let td0;
		let t11;
		let td1;
		let t13;
		let td2;
		let t15;
		let tr2;
		let th5;
		let t17;
		let td3;
		let t19;
		let td4;
		let t21;
		let td5;
		let t23;
		let tr3;
		let th6;
		let t25;
		let td6;
		let t27;
		let td7;
		let t29;
		let td8;

		const block = {
			c: function create() {
				thead = element("thead");
				tr0 = element("tr");
				th0 = element("th");
				th0.textContent = "#";
				t1 = space();
				th1 = element("th");
				th1.textContent = "First Name";
				t3 = space();
				th2 = element("th");
				th2.textContent = "Last Name";
				t5 = space();
				th3 = element("th");
				th3.textContent = "Username";
				t7 = space();
				tbody = element("tbody");
				tr1 = element("tr");
				th4 = element("th");
				th4.textContent = "1";
				t9 = space();
				td0 = element("td");
				td0.textContent = "Mark";
				t11 = space();
				td1 = element("td");
				td1.textContent = "Otto";
				t13 = space();
				td2 = element("td");
				td2.textContent = "@mdo";
				t15 = space();
				tr2 = element("tr");
				th5 = element("th");
				th5.textContent = "2";
				t17 = space();
				td3 = element("td");
				td3.textContent = "Jacob";
				t19 = space();
				td4 = element("td");
				td4.textContent = "Thornton";
				t21 = space();
				td5 = element("td");
				td5.textContent = "@fat";
				t23 = space();
				tr3 = element("tr");
				th6 = element("th");
				th6.textContent = "3";
				t25 = space();
				td6 = element("td");
				td6.textContent = "Larry";
				t27 = space();
				td7 = element("td");
				td7.textContent = "the Bird";
				t29 = space();
				td8 = element("td");
				td8.textContent = "@twitter";
				add_location(th0, file$1, 8, 8, 204);
				add_location(th1, file$1, 9, 8, 224);
				add_location(th2, file$1, 10, 8, 253);
				add_location(th3, file$1, 11, 8, 281);
				add_location(tr0, file$1, 7, 6, 190);
				add_location(thead, file$1, 6, 4, 175);
				attr_dev(th4, "scope", "row");
				add_location(th4, file$1, 16, 8, 360);
				add_location(td0, file$1, 17, 8, 392);
				add_location(td1, file$1, 18, 8, 415);
				add_location(td2, file$1, 19, 8, 438);
				add_location(tr1, file$1, 15, 6, 346);
				attr_dev(th5, "scope", "row");
				add_location(th5, file$1, 22, 8, 486);
				add_location(td3, file$1, 23, 8, 518);
				add_location(td4, file$1, 24, 8, 542);
				add_location(td5, file$1, 25, 8, 569);
				add_location(tr2, file$1, 21, 6, 472);
				attr_dev(th6, "scope", "row");
				add_location(th6, file$1, 28, 8, 617);
				add_location(td6, file$1, 29, 8, 649);
				add_location(td7, file$1, 30, 8, 673);
				add_location(td8, file$1, 31, 8, 700);
				add_location(tr3, file$1, 27, 6, 603);
				add_location(tbody, file$1, 14, 4, 331);
			},
			m: function mount(target, anchor) {
				insert_dev(target, thead, anchor);
				append_dev(thead, tr0);
				append_dev(tr0, th0);
				append_dev(tr0, t1);
				append_dev(tr0, th1);
				append_dev(tr0, t3);
				append_dev(tr0, th2);
				append_dev(tr0, t5);
				append_dev(tr0, th3);
				insert_dev(target, t7, anchor);
				insert_dev(target, tbody, anchor);
				append_dev(tbody, tr1);
				append_dev(tr1, th4);
				append_dev(tr1, t9);
				append_dev(tr1, td0);
				append_dev(tr1, t11);
				append_dev(tr1, td1);
				append_dev(tr1, t13);
				append_dev(tr1, td2);
				append_dev(tbody, t15);
				append_dev(tbody, tr2);
				append_dev(tr2, th5);
				append_dev(tr2, t17);
				append_dev(tr2, td3);
				append_dev(tr2, t19);
				append_dev(tr2, td4);
				append_dev(tr2, t21);
				append_dev(tr2, td5);
				append_dev(tbody, t23);
				append_dev(tbody, tr3);
				append_dev(tr3, th6);
				append_dev(tr3, t25);
				append_dev(tr3, td6);
				append_dev(tr3, t27);
				append_dev(tr3, td7);
				append_dev(tr3, t29);
				append_dev(tr3, td8);
			},
			p: noop$1,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(thead);
					detach_dev(t7);
					detach_dev(tbody);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(6:0) <Table bordered>",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let table;
		let current;

		table = new Table({
				props: {
					bordered: true,
					$$slots: { default: [create_default_slot] },
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

				if (dirty & /*$$scope*/ 1) {
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

		$$self.$capture_state = () => ({ DataTable, Head, Body, Row, Cell, Table });
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

	/* src\App.svelte generated by Svelte v4.2.19 */
	const file = "src\\App.svelte";

	function create_fragment(ctx) {
		let link;
		let t0;
		let h1;
		let t2;
		let ul;
		let homepage;
		let t3;
		let carslist;
		let t4;
		let addcar;
		let t5;
		let deletecar;
		let current;
		homepage = new HomePage({ $$inline: true });
		carslist = new CarsList({ $$inline: true });
		addcar = new AddCar({ $$inline: true });
		deletecar = new DeleteCar({ $$inline: true });

		const block = {
			c: function create() {
				link = element("link");
				t0 = space();
				h1 = element("h1");
				h1.textContent = "Cars Stock Management System";
				t2 = space();
				ul = element("ul");
				create_component(homepage.$$.fragment);
				t3 = space();
				create_component(carslist.$$.fragment);
				t4 = space();
				create_component(addcar.$$.fragment);
				t5 = space();
				create_component(deletecar.$$.fragment);
				attr_dev(link, "rel", "stylesheet");
				attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
				add_location(link, file, 8, 2, 264);
				add_location(h1, file, 11, 0, 386);
				add_location(ul, file, 12, 0, 425);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, link);
				insert_dev(target, t0, anchor);
				insert_dev(target, h1, anchor);
				insert_dev(target, t2, anchor);
				insert_dev(target, ul, anchor);
				mount_component(homepage, ul, null);
				append_dev(ul, t3);
				mount_component(carslist, ul, null);
				append_dev(ul, t4);
				mount_component(addcar, ul, null);
				append_dev(ul, t5);
				mount_component(deletecar, ul, null);
				current = true;
			},
			p: noop$1,
			i: function intro(local) {
				if (current) return;
				transition_in(homepage.$$.fragment, local);
				transition_in(carslist.$$.fragment, local);
				transition_in(addcar.$$.fragment, local);
				transition_in(deletecar.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(homepage.$$.fragment, local);
				transition_out(carslist.$$.fragment, local);
				transition_out(addcar.$$.fragment, local);
				transition_out(deletecar.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(h1);
					detach_dev(t2);
					detach_dev(ul);
				}

				detach_dev(link);
				destroy_component(homepage);
				destroy_component(carslist);
				destroy_component(addcar);
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

		$$self.$capture_state = () => ({ CarsList, AddCar, DeleteCar, HomePage });
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
