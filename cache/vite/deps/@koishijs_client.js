import {
  RouterLink,
  START_LOCATION_NORMALIZED,
  createRouter,
  createWebHistory
} from "./chunk-UHNJWA4E.js";
import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  installer
} from "./chunk-VIUY7NCX.js";
import {
  toValue as toValue2,
  useLocalStorage,
  usePreferredDark
} from "./chunk-YETCFMTS.js";
import "./chunk-T45SRSZM.js";
import {
  marked
} from "./chunk-VELY6VKU.js";
import {
  require_lib
} from "./chunk-FWLRPHK7.js";
import {
  ChatInput,
  IconArrowDown,
  IconArrowUp,
  IconBranch,
  IconClose,
  IconCollapse,
  IconDelete,
  IconEllipsis,
  IconExpand,
  IconExternal,
  IconEye,
  IconEyeSlash,
  IconInsertAfter,
  IconInsertBefore,
  IconInvalid,
  IconRedo,
  IconReset,
  IconSquareCheck,
  IconSquareEmpty,
  IconUndo,
  MessageContent,
  Primitive,
  Time,
  VirtualList,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  camelCase,
  camelize,
  capitalize,
  client_default,
  clone,
  contain,
  deduplicate,
  deepEqual,
  defineProperty,
  difference,
  filterKeys,
  form,
  hyphenate,
  intersection,
  is,
  isNullable,
  isPlainObject,
  lib_default,
  makeArray,
  mapValues,
  noop,
  omit,
  paramCase,
  pick,
  remove,
  sanitize,
  snakeCase,
  src_default,
  trimSlash,
  uncapitalize,
  union,
  useI18nText
} from "./chunk-RQ6BKGMR.js";
import {
  DatetimeFormat,
  I18nD,
  I18nInjectionKey,
  I18nN,
  I18nT,
  NumberFormat,
  Translation,
  VERSION,
  castToVueI18n,
  createI18n,
  useI18n,
  vTDirective
} from "./chunk-TPLCFMBP.js";
import "./chunk-H5N6YIGP.js";
import {
  computed2 as computed,
  createApp,
  defineComponent,
  h,
  inject,
  markRaw,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
  resolveComponent,
  shallowReactive,
  toValue,
  watch,
  watchEffect
} from "./chunk-HJS2ZR7L.js";
import {
  __export,
  __publicField,
  __toESM
} from "./chunk-ZC22LKFR.js";

// node_modules/@koishijs/client/client/data.ts
var global = KOISHI_CONFIG;
var store = reactive({});
var socket = ref(null);
var listeners = {};
var responseHooks = {};
function send(type, ...args) {
  if (!socket.value)
    return;
  console.debug("↑%c", "color:brown", type, args);
  const id = Math.random().toString(36).slice(2, 9);
  socket.value.send(JSON.stringify({ id, type, args }));
  return new Promise((resolve, reject) => {
    responseHooks[id] = [resolve, reject];
    setTimeout(() => {
      delete responseHooks[id];
      reject(new Error("timeout"));
    }, 6e4);
  });
}
function receive(event, listener) {
  listeners[event] = listener;
}
receive("data", ({ key, value }) => {
  store[key] = value;
});
receive("patch", ({ key, value }) => {
  if (Array.isArray(store[key])) {
    store[key].push(...value);
  } else if (store[key]) {
    Object.assign(store[key], value);
  }
});
receive("response", ({ id, value, error }) => {
  if (!responseHooks[id])
    return;
  const [resolve, reject] = responseHooks[id];
  delete responseHooks[id];
  if (error) {
    reject(error);
  } else {
    resolve(value);
  }
});
function connect(callback) {
  const value = callback();
  let sendTimer;
  let closeTimer;
  const refresh = () => {
    if (!global.heartbeat)
      return;
    clearTimeout(sendTimer);
    clearTimeout(closeTimer);
    sendTimer = +setTimeout(() => send("ping"), global.heartbeat.interval);
    closeTimer = +setTimeout(() => value == null ? void 0 : value.close(), global.heartbeat.timeout);
  };
  const reconnect = () => {
    socket.value = null;
    for (const key in store) {
      store[key] = void 0;
    }
    console.log("[koishi] websocket disconnected, will retry in 1s...");
    setTimeout(() => {
      connect(callback).then(location.reload, () => {
        console.log("[koishi] websocket disconnected, will retry in 1s...");
      });
    }, 1e3);
  };
  value.addEventListener("message", (ev) => {
    refresh();
    const data = JSON.parse(ev.data);
    console.debug("↓%c", "color:purple", data.type, data.body);
    if (data.type in listeners) {
      listeners[data.type](data.body);
    }
  });
  value.addEventListener("close", reconnect);
  return new Promise((resolve, reject) => {
    value.addEventListener("open", (event) => {
      socket.value = markRaw(value);
      resolve(event);
    });
    value.addEventListener("error", reject);
  });
}

// node_modules/marked-vue/lib/index.mjs
var xss = __toESM(require_lib(), 1);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var allowedTags = [
  // Content sectioning
  "address",
  "article",
  "aside",
  "footer",
  "header",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hgroup",
  "main",
  "nav",
  "section",
  // Text content
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "ul",
  // Inline text semantics
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rb",
  "rp",
  "rt",
  "rtc",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  // Table content
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr"
];
var voidTags = ["img", "br", "hr", "area", "base", "basefont", "input", "link", "meta"];
var allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
function checkUrl(value) {
  try {
    const url = new URL(value, location.toString());
    return allowedProtocols.includes(url.protocol);
  } catch (e) {
    return false;
  }
}
__name(checkUrl, "checkUrl");
function sanitize2(html) {
  const whiteList = {
    ...Object.fromEntries(allowedTags.map((tag) => [tag, []]))
  };
  const stack = [];
  html = xss.filterXSS(html, {
    whiteList,
    stripIgnoreTag: true,
    onTag(tag, raw, options) {
      let html2;
      if (tag === "a" && !options.isClosing) {
        const attrs = {};
        xss.parseAttr(raw.slice(3), (name, value) => {
          if (name === "href") {
            attrs[name] = checkUrl(value) ? value : "#";
          } else if (name === "title") {
            attrs[name] = xss.escapeAttrValue(value);
          }
          return "";
        });
        attrs.rel = "noopener noreferrer";
        attrs.target = "_blank";
        html2 = `<a ${Object.entries(attrs).map(([name, value]) => `${name}="${value}"`).join(" ")}>`;
      }
      if (raw.endsWith("/>") || voidTags.includes(tag))
        return;
      if (!options.isClosing) {
        stack.push(tag);
        return html2;
      }
      let result = "";
      while (stack.length) {
        const last = stack.pop();
        if (last === tag) {
          return result + raw;
        }
        result += `</${last}>`;
      }
      return raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  });
  while (stack.length) {
    const last = stack.pop();
    html += `</${last}>`;
  }
  return html;
}
__name(sanitize2, "sanitize");
var src_default2 = defineComponent({
  props: {
    source: String,
    inline: Boolean,
    tag: String,
    unsafe: Boolean
  },
  setup(props) {
    return () => {
      let html = props.inline ? marked.parseInline(props.source || "") : marked.parse(props.source || "");
      if (!props.unsafe)
        html = sanitize2(html);
      const tag = props.tag || (props.inline ? "span" : "div");
      return h(tag, {
        class: "markdown",
        innerHTML: html
      });
    };
  }
});

// node_modules/@koishijs/client/client/components/common/index.ts
import Button from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/common/k-button.vue";
import Hint from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/common/k-hint.vue";
import Tab from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/common/k-tab.vue";
function common_default(app) {
  app.component("k-button", Button);
  app.component("k-hint", Hint);
  app.component("k-tab", Tab);
}

// node_modules/@koishijs/client/client/components/index.ts
import Dynamic from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/dynamic.vue";
import ChatImage from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/chat/image.vue";

// node_modules/@koishijs/client/client/components/icons/index.ts
var icons_exports = {};
__export(icons_exports, {
  install: () => install,
  register: () => register
});
import Default from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/default.vue";
import Ellipsis from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/ellipsis.vue";
import Home from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/home.vue";
import Moon from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/moon.vue";
import Settings from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/settings.vue";
import Sun from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/activity/sun.vue";
import ArrowLeft from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/arrow-left.vue";
import ArrowRight from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/arrow-right.vue";
import BoxOpen from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/box-open.vue";
import CheckFull from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/check-full.vue";
import ChevronDown from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/chevron-down.vue";
import ChevronLeft from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/chevron-left.vue";
import ChevronRight from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/chevron-right.vue";
import ChevronUp from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/chevron-up.vue";
import ClipboardList from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/clipboard-list.vue";
import Edit from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/edit.vue";
import ExclamationFull from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/exclamation-full.vue";
import Expand from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/expand.vue";
import FileArchive from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/file-archive.vue";
import Filter from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/filter.vue";
import GitHub from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/github.vue";
import GitLab from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/gitlab.vue";
import InfoFull from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/info-full.vue";
import Koishi from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/koishi.vue";
import Link from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/link.vue";
import PaperPlane from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/paper-plane.vue";
import QuestionEmpty from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/question-empty.vue";
import Redo from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/redo.vue";
import Search from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/search.vue";
import SearchMinus from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/search-minus.vue";
import SearchPlus from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/search-plus.vue";
import StarEmpty from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/star-empty.vue";
import StarFull from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/star-full.vue";
import Start from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/start.vue";
import Tag from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/tag.vue";
import TimesFull from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/times-full.vue";
import Tools from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/tools.vue";
import Undo from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/undo.vue";
import User from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/svg/user.vue";
import "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/icons/style.scss";
var registry = reactive({});
register("activity:default", Default);
register("activity:ellipsis", Ellipsis);
register("activity:home", Home);
register("activity:moon", Moon);
register("activity:settings", Settings);
register("activity:sun", Sun);
register("arrow-up", IconArrowUp);
register("arrow-down", IconArrowDown);
register("arrow-left", ArrowLeft);
register("arrow-right", ArrowRight);
register("box-open", BoxOpen);
register("check-full", CheckFull);
register("chevron-down", ChevronDown);
register("chevron-left", ChevronLeft);
register("chevron-right", ChevronRight);
register("chevron-up", ChevronUp);
register("clipboard-list", ClipboardList);
register("close", IconClose);
register("delete", IconDelete);
register("edit", Edit);
register("exclamation-full", ExclamationFull);
register("expand", Expand);
register("external", IconExternal);
register("eye-slash", IconEyeSlash);
register("eye", IconEye);
register("file-archive", FileArchive);
register("filter", Filter);
register("github", GitHub);
register("gitlab", GitLab);
register("info-full", InfoFull);
register("koishi", Koishi);
register("link", Link);
register("paper-plane", PaperPlane);
register("question-empty", QuestionEmpty);
register("redo", Redo);
register("search", Search);
register("search-minus", SearchMinus);
register("search-plus", SearchPlus);
register("star-empty", StarEmpty);
register("star-full", StarFull);
register("start", Start);
register("tag", Tag);
register("times-full", TimesFull);
register("tools", Tools);
register("undo", Undo);
register("user", User);
function register(name, component) {
  registry[name] = markRaw(component);
}
function install(app) {
  app.component("k-icon", defineComponent({
    props: {
      name: String
    },
    render(props) {
      const component = registry[props.name];
      return component && h(component);
    }
  }));
}

// node_modules/@koishijs/client/client/components/layout/index.ts
import CardNumeric from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/card-numeric.vue";
import Card from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/card.vue";
import Content from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/content.vue";
import Empty from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/empty.vue";
import TabGroup from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/tab-group.vue";
import TabItem from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/layout/tab-item.vue";
function layout_default(app) {
  app.component("k-numeric", CardNumeric);
  app.component("k-card", Card);
  app.component("k-content", Content);
  app.component("k-empty", Empty);
  app.component("k-tab-group", TabGroup);
  app.component("k-tab-item", TabItem);
}

// node_modules/cordis/lib/index.mjs
var __defProp2 = Object.defineProperty;
var __name2 = (target, value) => __defProp2(target, "name", { value, configurable: true });
function isBailed(value) {
  return value !== null && value !== false && value !== void 0;
}
__name2(isBailed, "isBailed");
var _a;
var Lifecycle = (_a = class {
  constructor(root2) {
    __publicField(this, "isActive", false);
    __publicField(this, "_tasks", /* @__PURE__ */ new Set());
    __publicField(this, "_hooks", {});
    this.root = root2;
    defineProperty(this, Context.current, root2);
    defineProperty(this.on("internal/hook", function(name, listener, prepend) {
      const method = prepend ? "unshift" : "push";
      const { scope } = this[Context.current];
      const { runtime, disposables } = scope;
      if (name === "ready" && this.isActive) {
        scope.ensure(async () => listener());
      } else if (name === "dispose") {
        disposables[method](listener);
        defineProperty(listener, "name", "event <dispose>");
        return () => remove(disposables, listener);
      } else if (name === "fork") {
        runtime.forkables[method](listener);
        return scope.collect("event <fork>", () => remove(runtime.forkables, listener));
      }
    }), Context.static, root2.scope);
  }
  async flush() {
    while (this._tasks.size) {
      await Promise.all(Array.from(this._tasks));
    }
  }
  getHooks(name, thisArg) {
    const hooks = this._hooks[name] || [];
    return hooks.slice().filter(([context]) => {
      const filter = thisArg == null ? void 0 : thisArg[Context.filter];
      return !filter || filter.call(thisArg, context);
    }).map(([, callback]) => callback);
  }
  prepareEvent(type, args) {
    const thisArg = typeof args[0] === "object" ? args.shift() : null;
    const name = args.shift();
    if (name !== "internal/event") {
      this.emit("internal/event", type, name, args, thisArg);
    }
    return [this.getHooks(name, thisArg), thisArg ?? this[Context.current]];
  }
  async parallel(...args) {
    const [hooks, thisArg] = this.prepareEvent("parallel", args);
    await Promise.all(hooks.map(async (callback) => {
      await callback.apply(thisArg, args);
    }));
  }
  emit(...args) {
    const [hooks, thisArg] = this.prepareEvent("emit", args);
    for (const callback of hooks) {
      callback.apply(thisArg, args);
    }
  }
  async serial(...args) {
    const [hooks, thisArg] = this.prepareEvent("serial", args);
    for (const callback of hooks) {
      const result = await callback.apply(thisArg, args);
      if (isBailed(result))
        return result;
    }
  }
  bail(...args) {
    const [hooks, thisArg] = this.prepareEvent("bail", args);
    for (const callback of hooks) {
      const result = callback.apply(thisArg, args);
      if (isBailed(result))
        return result;
    }
  }
  register(label, hooks, listener, prepend) {
    const maxListeners = this.root.config.maxListeners;
    if (hooks.length >= maxListeners) {
      this.root.emit("internal/warning", new Error(`max listener count (${maxListeners}) for ${label} exceeded, which may be caused by a memory leak`));
    }
    const caller = this[Context.current];
    const method = prepend ? "unshift" : "push";
    hooks[method]([caller, listener]);
    return caller.state.collect(label, () => this.unregister(hooks, listener));
  }
  unregister(hooks, listener) {
    const index = hooks.findIndex(([context, callback]) => callback === listener);
    if (index >= 0) {
      hooks.splice(index, 1);
      return true;
    }
  }
  on(name, listener, prepend = false) {
    var _a8;
    const result = this.bail(this, "internal/hook", name, listener, prepend);
    if (result)
      return result;
    const hooks = (_a8 = this._hooks)[name] || (_a8[name] = []);
    const label = typeof name === "string" ? `event <${name}>` : "event (Symbol)";
    return this.register(label, hooks, listener, prepend);
  }
  once(name, listener, prepend = false) {
    const dispose = this.on(name, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, prepend);
    return dispose;
  }
  off(name, listener) {
    return this.unregister(this._hooks[name] || [], listener);
  }
  async start() {
    this.isActive = true;
    const hooks = this._hooks.ready || [];
    while (hooks.length) {
      const [context, callback] = hooks.shift();
      context.scope.ensure(async () => callback());
    }
    await this.flush();
  }
  async stop() {
    this.isActive = false;
    this.root.scope.reset();
  }
}, __name2(_a, "Lifecycle"), _a);
function isConstructor(func) {
  if (!func.prototype)
    return false;
  if (func.prototype.constructor !== func)
    return false;
  return true;
}
__name2(isConstructor, "isConstructor");
function getConstructor(instance) {
  return Object.getPrototypeOf(instance).constructor;
}
__name2(getConstructor, "getConstructor");
function resolveConfig(plugin, config3) {
  const schema = plugin["Config"] || plugin["schema"];
  if (schema && plugin["schema"] !== false)
    config3 = schema(config3);
  return config3 ?? {};
}
__name2(resolveConfig, "resolveConfig");
function isUnproxyable(value) {
  return [Map, Set, Date, Promise].some((constructor) => value instanceof constructor);
}
__name2(isUnproxyable, "isUnproxyable");
var _a2;
var EffectScope = (_a2 = class {
  constructor(parent, config3) {
    __publicField(this, "uid");
    __publicField(this, "ctx");
    __publicField(this, "disposables", []);
    __publicField(this, "error");
    __publicField(this, "status", "pending");
    // Same as `this.ctx`, but with a more specific type.
    __publicField(this, "context");
    __publicField(this, "proxy");
    __publicField(this, "acceptors", []);
    __publicField(this, "tasks", /* @__PURE__ */ new Set());
    __publicField(this, "hasError", false);
    __publicField(this, "isActive", false);
    this.parent = parent;
    this.config = config3;
    this.uid = parent.registry ? parent.registry.counter : 0;
    this.ctx = this.context = parent.extend({ scope: this });
    this.proxy = new Proxy({}, {
      get: (target, key) => Reflect.get(this.config, key)
    });
  }
  get _config() {
    return this.runtime.isReactive ? this.proxy : this.config;
  }
  collect(label, callback) {
    const dispose = defineProperty(() => {
      remove(this.disposables, dispose);
      return callback();
    }, "name", label);
    this.disposables.push(dispose);
    return dispose;
  }
  restart() {
    this.reset();
    this.error = null;
    this.hasError = false;
    this.status = "pending";
    this.start();
  }
  _getStatus() {
    if (this.uid === null)
      return "disposed";
    if (this.hasError)
      return "failed";
    if (this.tasks.size)
      return "loading";
    if (this.ready)
      return "active";
    return "pending";
  }
  _updateStatus(callback) {
    const oldValue = this.status;
    callback == null ? void 0 : callback();
    this.status = this._getStatus();
    if (oldValue !== this.status) {
      this.context.emit("internal/status", this, oldValue);
    }
  }
  ensure(callback) {
    const task = callback().catch((reason) => {
      this.context.emit("internal/warning", reason);
      this.cancel(reason);
    }).finally(() => {
      this._updateStatus(() => this.tasks.delete(task));
      this.context.events._tasks.delete(task);
    });
    this._updateStatus(() => this.tasks.add(task));
    this.context.events._tasks.add(task);
  }
  cancel(reason) {
    this.error = reason;
    this._updateStatus(() => this.hasError = true);
    this.reset();
  }
  setupInject() {
    if (!this.runtime.using.length)
      return;
    defineProperty(this.context.on("internal/before-service", (name) => {
      if (!this.runtime.using.includes(name))
        return;
      this._updateStatus();
      this.reset();
    }), Context.static, this);
    defineProperty(this.context.on("internal/service", (name) => {
      if (!this.runtime.using.includes(name))
        return;
      this.start();
    }), Context.static, this);
  }
  get ready() {
    return this.runtime.using.every((name) => !isNullable(this.ctx[name]));
  }
  reset() {
    this.isActive = false;
    this.disposables = this.disposables.splice(0).filter((dispose) => {
      if (this.uid !== null && dispose[Context.static] === this)
        return true;
      dispose();
    });
  }
  init(error) {
    if (!this.config) {
      this.cancel(error);
    } else {
      this.start();
    }
  }
  start() {
    if (!this.ready || this.isActive || this.uid === null)
      return true;
    this.isActive = true;
    this._updateStatus(() => this.hasError = false);
  }
  accept(...args) {
    var _a8;
    const keys = Array.isArray(args[0]) ? args.shift() : null;
    const acceptor = { keys, callback: args[0], ...args[1] };
    this.acceptors.push(acceptor);
    if (acceptor.immediate)
      (_a8 = acceptor.callback) == null ? void 0 : _a8.call(acceptor, this.config);
    return this.collect(`accept <${(keys == null ? void 0 : keys.join(", ")) || "*"}>`, () => remove(this.acceptors, acceptor));
  }
  decline(keys) {
    return this.accept(keys, () => true);
  }
  checkUpdate(resolved, forced) {
    if (forced || !this.config)
      return [true, true];
    if (forced === false)
      return [false, false];
    const modified = /* @__PURE__ */ Object.create(null);
    const checkPropertyUpdate = __name2((key) => {
      const result = modified[key] ?? (modified[key] = !deepEqual(this.config[key], resolved[key]));
      hasUpdate || (hasUpdate = result);
      return result;
    }, "checkPropertyUpdate");
    const ignored = /* @__PURE__ */ new Set();
    let hasUpdate = false, shouldRestart = false;
    let fallback = this.runtime.isReactive || null;
    for (const { keys, callback, passive } of this.acceptors) {
      if (!keys) {
        fallback || (fallback = !passive);
      } else if (passive) {
        keys == null ? void 0 : keys.forEach((key) => ignored.add(key));
      } else {
        let hasUpdate2 = false;
        for (const key of keys) {
          hasUpdate2 || (hasUpdate2 = checkPropertyUpdate(key));
        }
        if (!hasUpdate2)
          continue;
      }
      const result = callback == null ? void 0 : callback(resolved);
      if (result)
        shouldRestart = true;
    }
    for (const key in { ...this.config, ...resolved }) {
      if (fallback === false)
        continue;
      if (!(key in modified) && !ignored.has(key)) {
        const hasUpdate2 = checkPropertyUpdate(key);
        if (fallback === null)
          shouldRestart || (shouldRestart = hasUpdate2);
      }
    }
    return [hasUpdate, shouldRestart];
  }
}, __name2(_a2, "EffectScope"), _a2);
var _a3;
var ForkScope = (_a3 = class extends EffectScope {
  constructor(parent, runtime, config3, error) {
    super(parent, config3);
    __publicField(this, "dispose");
    this.runtime = runtime;
    this.dispose = defineProperty(parent.scope.collect(`fork <${parent.runtime.name}>`, () => {
      this.uid = null;
      this.reset();
      const result = remove(runtime.disposables, this.dispose);
      if (remove(runtime.children, this) && !runtime.children.length) {
        parent.registry.delete(runtime.plugin);
      }
      this.context.emit("internal/fork", this);
      return result;
    }), Context.static, runtime);
    runtime.children.push(this);
    runtime.disposables.push(this.dispose);
    this.context.emit("internal/fork", this);
    if (runtime.isReusable) {
      this.setupInject();
    }
    this.init(error);
  }
  start() {
    if (super.start())
      return true;
    for (const fork of this.runtime.forkables) {
      this.ensure(async () => fork(this.context, this._config));
    }
  }
  update(config3, forced) {
    const oldConfig = this.config;
    const state = this.runtime.isForkable ? this : this.runtime;
    if (state.config !== oldConfig)
      return;
    const resolved = resolveConfig(this.runtime.plugin, config3);
    const [hasUpdate, shouldRestart] = state.checkUpdate(resolved, forced);
    this.context.emit("internal/before-update", this, config3);
    this.config = resolved;
    state.config = resolved;
    if (hasUpdate) {
      this.context.emit("internal/update", this, oldConfig);
    }
    if (shouldRestart)
      state.restart();
  }
}, __name2(_a3, "ForkScope"), _a3);
var _a4;
var MainScope = (_a4 = class extends EffectScope {
  constructor(registry2, plugin, config3, error) {
    super(registry2[Context.current], config3);
    __publicField(this, "runtime", this);
    __publicField(this, "schema");
    __publicField(this, "name");
    __publicField(this, "using", []);
    __publicField(this, "inject", /* @__PURE__ */ new Set());
    __publicField(this, "forkables", []);
    __publicField(this, "children", []);
    __publicField(this, "isReusable", false);
    __publicField(this, "isReactive", false);
    __publicField(this, "apply", (context, config3) => {
      if (typeof this.plugin !== "function") {
        return this.plugin.apply(context, config3);
      } else if (isConstructor(this.plugin)) {
        const instance = new this.plugin(context, config3);
        const name = instance[Context.expose];
        if (name) {
          context[name] = instance;
        }
        if (instance["fork"]) {
          this.forkables.push(instance["fork"].bind(instance));
        }
      } else {
        return this.plugin(context, config3);
      }
    });
    this.plugin = plugin;
    registry2.set(plugin, this);
    if (!plugin) {
      this.name = "root";
      this.isActive = true;
    } else {
      this.setup();
      this.init(error);
    }
  }
  get isForkable() {
    return this.forkables.length > 0;
  }
  fork(parent, config3, error) {
    return new ForkScope(parent, this, config3, error);
  }
  dispose() {
    this.uid = null;
    this.reset();
    this.context.emit("internal/runtime", this);
    return true;
  }
  setup() {
    const { name } = this.plugin;
    if (name && name !== "apply")
      this.name = name;
    this.schema = this.plugin["Config"] || this.plugin["schema"];
    const inject2 = this.plugin["using"] || this.plugin["inject"] || [];
    if (Array.isArray(inject2)) {
      this.using = inject2;
      this.inject = new Set(inject2);
    } else {
      this.using = inject2.required || [];
      this.inject = /* @__PURE__ */ new Set([...this.using, ...inject2.optional || []]);
    }
    this.isReusable = this.plugin["reusable"];
    this.isReactive = this.plugin["reactive"];
    this.context.emit("internal/runtime", this);
    if (this.isReusable) {
      this.forkables.push(this.apply);
    } else {
      super.setupInject();
    }
  }
  reset() {
    super.reset();
    for (const fork of this.children) {
      fork.reset();
    }
  }
  start() {
    if (super.start())
      return true;
    if (!this.isReusable && this.plugin) {
      this.ensure(async () => this.apply(this.context, this._config));
    }
    for (const fork of this.children) {
      fork.start();
    }
  }
  update(config3, forced) {
    if (this.isForkable) {
      this.context.emit("internal/warning", new Error(`attempting to update forkable plugin "${this.plugin.name}", which may lead to unexpected behavior`));
    }
    const oldConfig = this.config;
    const resolved = resolveConfig(this.runtime.plugin || getConstructor(this.context), config3);
    const [hasUpdate, shouldRestart] = this.checkUpdate(resolved, forced);
    const state = this.children.find((fork) => fork.config === oldConfig);
    this.config = resolved;
    if (state) {
      this.context.emit("internal/before-update", state, config3);
      state.config = resolved;
      if (hasUpdate) {
        this.context.emit("internal/update", state, oldConfig);
      }
    }
    if (shouldRestart)
      this.restart();
  }
}, __name2(_a4, "MainScope"), _a4);
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
__name2(isApplicable, "isApplicable");
var _a5;
var Registry = (_a5 = class {
  constructor(root2, config3) {
    __publicField(this, "_counter", 0);
    __publicField(this, "_internal", /* @__PURE__ */ new Map());
    this.root = root2;
    defineProperty(this, Context.current, root2);
    root2.scope = new MainScope(this, null, config3);
    root2.scope.runtime.isReactive = true;
  }
  get counter() {
    return ++this._counter;
  }
  get size() {
    return this._internal.size;
  }
  resolve(plugin) {
    if (plugin === null)
      return plugin;
    if (typeof plugin === "function")
      return plugin;
    if (isApplicable(plugin))
      return plugin.apply;
    throw new Error('invalid plugin, expect function or object with an "apply" method');
  }
  get(plugin) {
    return this._internal.get(this.resolve(plugin));
  }
  has(plugin) {
    return this._internal.has(this.resolve(plugin));
  }
  set(plugin, state) {
    return this._internal.set(this.resolve(plugin), state);
  }
  delete(plugin) {
    plugin = this.resolve(plugin);
    const runtime = this.get(plugin);
    if (!runtime)
      return false;
    this._internal.delete(plugin);
    return runtime.dispose();
  }
  keys() {
    return this._internal.keys();
  }
  values() {
    return this._internal.values();
  }
  entries() {
    return this._internal.entries();
  }
  forEach(callback) {
    return this._internal.forEach(callback);
  }
  using(inject2, callback) {
    return this.plugin({ inject: inject2, apply: callback, name: callback.name });
  }
  plugin(plugin, config3) {
    this.resolve(plugin);
    const context = this[Context.current];
    if (context.scope.uid === null) {
      context.emit("internal/warning", new Error("try to plugin on a disposed scope"));
      return;
    }
    let error;
    try {
      config3 = resolveConfig(plugin, config3);
    } catch (reason) {
      context.emit("internal/warning", reason);
      error = reason;
      config3 = null;
    }
    let runtime = this.get(plugin);
    if (runtime) {
      if (!runtime.isForkable) {
        context.emit("internal/warning", new Error(`duplicate plugin detected: ${plugin.name}`));
      }
      return runtime.fork(context, config3, error);
    }
    runtime = new MainScope(this, plugin, config3, error);
    return runtime.fork(context, config3, error);
  }
  dispose(plugin) {
    return this.delete(plugin);
  }
}, __name2(_a5, "Registry"), _a5);
var _a6;
var Context = (_a6 = class {
  static ensureInternal() {
    const ctx = this.prototype || this;
    if (Object.prototype.hasOwnProperty.call(ctx, _a6.internal)) {
      return ctx[_a6.internal];
    }
    const parent = _a6.ensureInternal.call(Object.getPrototypeOf(this));
    return ctx[_a6.internal] = Object.create(parent);
  }
  /** @deprecated */
  static mixin(name, options) {
    const internal = _a6.ensureInternal.call(this);
    if (!Array.isArray(options)) {
      options = [...options.accessors || [], ...options.methods || []];
    }
    for (const key of options) {
      internal[key] = { type: "mixin", service: name };
    }
  }
  /** @deprecated */
  static service(name, options = {}) {
    const internal = this.ensureInternal();
    if (name in internal)
      return;
    const key = typeof name === "symbol" ? name : Symbol(name);
    internal[name] = { type: "service", key };
    if (isConstructor(options)) {
      internal[name]["prototype"] = options.prototype;
    }
    this.mixin(name, options);
  }
  constructor(config3) {
    const self = new Proxy(this, _a6.handler);
    config3 = resolveConfig(getConstructor(this), config3);
    self[_a6.shadow] = /* @__PURE__ */ Object.create(null);
    self.root = self;
    self.realms = /* @__PURE__ */ Object.create(null);
    self.mixin("scope", ["config", "runtime", "collect", "accept", "decline"]);
    self.mixin("registry", ["using", "plugin", "dispose"]);
    self.mixin("lifecycle", ["on", "once", "off", "after", "parallel", "emit", "serial", "bail", "start", "stop"]);
    self.provide("registry", new Registry(self, config3), true);
    self.provide("lifecycle", new Lifecycle(self), true);
    const attach = __name2((internal) => {
      var _a8;
      if (!internal)
        return;
      attach(Object.getPrototypeOf(internal));
      for (const key of [...Object.getOwnPropertyNames(internal), ...Object.getOwnPropertySymbols(internal)]) {
        const constructor = (_a8 = internal[key]["prototype"]) == null ? void 0 : _a8.constructor;
        if (!constructor)
          continue;
        const name = constructor[_a6.expose];
        self[key] = new constructor(self, name ? config3 == null ? void 0 : config3[name] : config3);
      }
    }, "attach");
    attach(this[_a6.internal]);
    return self;
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `Context <${this.name}>`;
  }
  get name() {
    let runtime = this.runtime;
    while (runtime && !runtime.name) {
      runtime = runtime.parent.runtime;
    }
    return runtime == null ? void 0 : runtime.name;
  }
  get events() {
    return this.lifecycle;
  }
  /** @deprecated */
  get state() {
    return this.scope;
  }
  get(name) {
    const internal = this[_a6.internal][name];
    if ((internal == null ? void 0 : internal.type) !== "service")
      return;
    const key = this[_a6.shadow][name] || internal.key;
    const value = this.root[key];
    if (!value || typeof value !== "object")
      return value;
    if (isUnproxyable(value)) {
      defineProperty(value, _a6.current, this);
      return value;
    }
    return new Proxy(value, {
      get: (target, name2, receiver) => {
        if (name2 === _a6.current)
          return this;
        return Reflect.get(target, name2, receiver);
      }
    });
  }
  provide(name, value, builtin) {
    const internal = _a6.ensureInternal.call(this);
    const key = Symbol(name);
    internal[name] = { type: "service", key, builtin };
    this[key] = value;
  }
  mixin(name, mixins) {
    return _a6.mixin.call(this, name, mixins);
  }
  extend(meta = {}) {
    return Object.assign(Object.create(this), meta);
  }
  isolate(names, label) {
    var _a8, _b;
    const self = this.extend();
    self[_a6.shadow] = Object.create(this[_a6.shadow]);
    for (const name of names) {
      self[_a6.shadow][name] = label ? (_b = (_a8 = this.realms)[label] ?? (_a8[label] = /* @__PURE__ */ Object.create(null)))[name] ?? (_b[name] = Symbol(name)) : Symbol(name);
    }
    return self;
  }
}, __name2(_a6, "Context"), __publicField(_a6, "config", Symbol.for("cordis.config")), __publicField(_a6, "events", Symbol.for("cordis.events")), __publicField(_a6, "static", Symbol.for("cordis.static")), __publicField(_a6, "filter", Symbol.for("cordis.filter")), __publicField(_a6, "source", Symbol.for("cordis.source")), __publicField(_a6, "expose", Symbol.for("cordis.expose")), __publicField(_a6, "shadow", Symbol.for("cordis.shadow")), __publicField(_a6, "current", Symbol.for("cordis.current")), __publicField(_a6, "internal", Symbol.for("cordis.internal")), __publicField(_a6, "handler", {
  get(target, name, ctx) {
    if (typeof name !== "string")
      return Reflect.get(target, name, ctx);
    const checkInject = __name2((name2) => {
      if (Reflect.has(target, name2))
        return;
      if (["prototype", "then", "registry", "lifecycle"].includes(name2))
        return;
      if (!ctx.runtime.plugin)
        return;
      let parent = ctx;
      while (parent.runtime.plugin) {
        if (parent.runtime.inject.has(name2))
          return;
        parent = parent.scope.parent;
      }
      ctx.emit("internal/warning", new Error(`property ${name2} is not registered, declare it as \`inject\` to suppress this warning`));
    }, "checkInject");
    const internal = ctx[_a6.internal][name];
    if (!internal) {
      checkInject(name);
      return Reflect.get(target, name, ctx);
    }
    if (internal.type === "mixin") {
      const service = ctx[internal.service];
      if (isNullable(service))
        return service;
      const value = Reflect.get(service, name);
      if (typeof value !== "function")
        return value;
      return value.bind(service);
    } else if (internal.type === "service") {
      if (!internal.builtin)
        checkInject(name);
      return ctx.get(name);
    }
  },
  set(target, name, value, ctx) {
    if (typeof name !== "string")
      return Reflect.set(target, name, value, ctx);
    const internal = ctx[_a6.internal][name];
    if (!internal)
      return Reflect.set(target, name, value, ctx);
    if (internal.type === "mixin") {
      return Reflect.set(ctx[internal.service], name, value);
    }
    const key = ctx[_a6.shadow][name] || internal.key;
    const oldValue = ctx.root[key];
    if (oldValue === value)
      return true;
    const self = /* @__PURE__ */ Object.create(null);
    self[_a6.filter] = (ctx2) => {
      return ctx[_a6.shadow][name] === ctx2[_a6.shadow][name];
    };
    if (value && oldValue) {
      throw new Error(`service ${name} has been registered`);
    }
    if (isUnproxyable(value)) {
      ctx.emit("internal/warning", new Error(`service ${name} is an unproxyable object, which may lead to unexpected behavior`));
    }
    ctx.root.emit(self, "internal/before-service", name, value);
    ctx.root[key] = value;
    if (value && typeof value === "object") {
      defineProperty(value, _a6.source, ctx);
    }
    ctx.root.emit(self, "internal/service", name, oldValue);
    return true;
  }
}), _a6);
Context.prototype[Context.internal] = /* @__PURE__ */ Object.create(null);
var _a7;
var Service = (_a7 = class {
  constructor(ctx, name, immediate) {
    this.ctx = ctx;
    ctx.root.provide(name);
    defineProperty(this, Context.current, ctx);
    if (immediate) {
      this[Context.expose] = name;
    }
    ctx.on("ready", async () => {
      await Promise.resolve();
      await this.start();
      if (!immediate)
        ctx[name] = this;
    });
    ctx.on("dispose", async () => {
      ctx[name] = void 0;
      await this.stop();
    });
  }
  start() {
  }
  stop() {
  }
  get caller() {
    return this[Context.current];
  }
}, __name2(_a7, "Service"), _a7);

// node_modules/@koishijs/client/client/activity.ts
var activities = reactive({});
function getActivityId(path) {
  return path.split("/").find(Boolean) ?? "";
}
var Activity = class {
  constructor(ctx, options) {
    this.ctx = ctx;
    this.options = options;
    __publicField(this, "id");
    __publicField(this, "_disposables", []);
    options.order ?? (options.order = 0);
    options.position ?? (options.position = "top");
    Object.assign(this, omit(options, ["icon", "name", "desc", "disabled"]));
    const { path, id = getActivityId(path), component } = options;
    this._disposables.push(router.addRoute({ path, name: id, component, meta: { activity: this } }));
    this.id ?? (this.id = id);
    this.handleUpdate();
    this.authority ?? (this.authority = 0);
    this.fields ?? (this.fields = []);
    activities[this.id] = this;
  }
  handleUpdate() {
    const { redirect } = router.currentRoute.value.query;
    if (typeof redirect === "string") {
      const location2 = router.resolve(redirect);
      if (location2.matched.length) {
        router.replace(location2);
      }
    }
  }
  get icon() {
    return toValue2(this.options.icon ?? "activity:default");
  }
  get name() {
    return toValue2(this.options.name ?? this.id);
  }
  get desc() {
    return toValue2(this.options.desc);
  }
  disabled() {
    var _a8, _b;
    if (root.bail("activity", this))
      return true;
    if (!this.fields.every((key) => store[key]))
      return true;
    if (this.when && !this.when())
      return true;
    if ((_b = (_a8 = this.options).disabled) == null ? void 0 : _b.call(_a8))
      return true;
  }
  dispose() {
    var _a8;
    this._disposables.forEach((dispose) => dispose());
    const current = router.currentRoute.value;
    if (((_a8 = current == null ? void 0 : current.meta) == null ? void 0 : _a8.activity) === this) {
      router.push({
        path: "/",
        query: { redirect: current.fullPath }
      });
    }
    return delete activities[this.id];
  }
};

// node_modules/@koishijs/client/client/config.ts
var useStorage = (key, version, fallback) => {
  const initial = fallback ? fallback() : {};
  initial["__version__"] = version;
  const storage = useLocalStorage("koishi.console." + key, initial);
  if (storage.value["__version__"] !== version) {
    storage.value = initial;
  }
  return storage;
};
function provideStorage(factory) {
  useStorage = factory;
}
function createStorage(key, version, fallback) {
  const storage = useLocalStorage("koishi.console." + key, {});
  const initial = fallback ? fallback() : {};
  if (storage.value.version !== version) {
    storage.value = { version, data: initial };
  } else if (!Array.isArray(storage.value.data)) {
    storage.value.data = { ...initial, ...storage.value.data };
  }
  return reactive(storage.value["data"]);
}
var config = useStorage("config", void 0, () => ({
  theme: {
    mode: "auto",
    dark: "default-dark",
    light: "default-light"
  },
  locale: "zh-CN"
}));
var preferDark = usePreferredDark();
var mode = computed(() => {
  const mode3 = config.value.theme.mode;
  if (mode3 !== "auto")
    return mode3;
  return preferDark.value ? "dark" : "light";
});
var useConfig = () => config;
var useColorMode = () => mode;
watchEffect(() => {
  const root2 = window.document.querySelector("html");
  root2.setAttribute("theme", config.value.theme[mode.value]);
  if (mode.value === "dark") {
    root2.classList.add("dark");
  } else {
    root2.classList.remove("dark");
  }
}, { flush: "post" });

// node_modules/@koishijs/client/client/loader.ts
function defineExtension(callback) {
  return callback;
}
function unwrapExports(module) {
  return (module == null ? void 0 : module.default) || module;
}
var loaders = {
  async [`.css`](ctx, url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
      ctx.on("dispose", () => {
        document.head.removeChild(link);
      });
    });
  },
  async [``](ctx, url) {
    const exports = await import(
      /* @vite-ignore */
      url
    );
    ctx.plugin(unwrapExports(exports));
  }
};
var extensions = reactive({});
var initTask = new Promise((resolve) => {
  watch(() => store.entry, async (newValue, oldValue) => {
    newValue || (newValue = {});
    for (const key in extensions) {
      if (newValue[key])
        continue;
      extensions[key].scope.dispose();
      delete extensions[key];
    }
    await Promise.all(Object.entries(newValue).map(([key, { files, paths }]) => {
      if (extensions[key])
        return;
      const scope = root.plugin(() => {
      });
      scope.ctx.extension = extensions[key] = { done: false, scope, paths };
      const task = Promise.all(files.map((url) => {
        for (const ext in loaders) {
          if (!url.endsWith(ext))
            continue;
          return loaders[ext](scope.ctx, url);
        }
      }));
      task.finally(() => extensions[key].done = true);
    }));
    if (!oldValue) {
      resolve();
      if (!root.events.isActive)
        root.start();
    }
  }, { deep: true });
});

// node_modules/@koishijs/client/client/context.ts
var Service2 = Service;
var config2 = useConfig();
var mode2 = useColorMode();
function useContext() {
  const parent = inject("cordis");
  const fork = parent.plugin(() => {
  });
  onBeforeUnmount(() => fork.dispose());
  return fork.ctx;
}
function insert(list, item) {
  markRaw(item);
  const index = list.findIndex((a) => a.order < item.order);
  if (index >= 0) {
    list.splice(index, 0, item);
  } else {
    list.push(item);
  }
}
var Internal = class {
  constructor() {
    __publicField(this, "extensions", extensions);
    __publicField(this, "activities", activities);
    __publicField(this, "routeCache", routeCache);
    __publicField(this, "scope", shallowReactive({}));
    __publicField(this, "menus", reactive({}));
    __publicField(this, "actions", reactive({}));
    __publicField(this, "views", reactive({}));
    __publicField(this, "themes", reactive({}));
    __publicField(this, "settings", reactive({}));
    __publicField(this, "activeMenus", reactive([]));
  }
  createScope(scope = this.scope, prefix = "") {
    return new Proxy({}, {
      get: (target, key) => {
        if (typeof key === "symbol")
          return target[key];
        key = prefix + key;
        if (key in scope)
          return toValue(scope[key]);
        const _prefix = key + ".";
        if (Object.keys(scope).some((k) => k.startsWith(_prefix))) {
          return this.createScope(scope, key + ".");
        }
      }
    });
  }
};
function useMenu(id) {
  const ctx = useContext();
  return (event, value) => {
    ctx.define(id, value);
    event.preventDefault();
    const { clientX, clientY } = event;
    ctx.internal.activeMenus.splice(0, Infinity, { id, styles: { left: clientX + "px", top: clientY + "px" } });
  };
}
var routeCache = reactive({});
var Context4 = class _Context extends Context {
  constructor() {
    super();
    __publicField(this, "app");
    __publicField(this, "extension");
    __publicField(this, "internal", new Internal());
    this.app = createApp(defineComponent({
      setup() {
        return () => [
          h(resolveComponent("k-slot"), { name: "root", single: true }),
          h(resolveComponent("k-slot"), { name: "global" })
        ];
      }
    }));
    this.app.provide("cordis", this);
  }
  wrapComponent(component) {
    if (!component)
      return;
    const caller = this[_Context.current] || this;
    return defineComponent((props, { slots }) => {
      provide("cordis", caller);
      return () => h(component, props, slots);
    });
  }
  /** @deprecated */
  addView(options) {
    return this.slot(options);
  }
  /** @deprecated */
  addPage(options) {
    return this.page(options);
  }
  slot(options) {
    var _a8, _b;
    options.order ?? (options.order = 0);
    options.component = this.wrapComponent(options.component);
    if (options.when)
      options.disabled = () => !options.when();
    const list = (_a8 = this.internal.views)[_b = options.type] || (_a8[_b] = []);
    insert(list, options);
    return this.scope.collect("view", () => remove(list, options));
  }
  page(options) {
    options.component = this.wrapComponent(options.component);
    const activity = new Activity(this, options);
    return this.scope.collect("page", () => activity.dispose());
  }
  schema(extension) {
    src_default.extensions.add(extension);
    extension.component = this.wrapComponent(extension.component);
    return this.scope.collect("schema", () => src_default.extensions.delete(extension));
  }
  action(id, options) {
    markRaw(options);
    this.internal.actions[id] = options;
    return this.scope.collect("actions", () => delete this.internal.actions[id]);
  }
  menu(id, items) {
    var _a8;
    const list = (_a8 = this.internal.menus)[id] || (_a8[id] = []);
    items.forEach((item) => insert(list, item));
    return this.scope.collect("menus", () => {
      items.forEach((item) => remove(list, item));
      return true;
    });
  }
  define(key, value) {
    this.internal.scope[key] = value;
    return this.scope.collect("activate", () => delete this.internal.scope[key]);
  }
  settings(options) {
    var _a8, _b;
    markRaw(options);
    options.order ?? (options.order = 0);
    options.component = this.wrapComponent(options.component);
    const list = (_a8 = this.internal.settings)[_b = options.id] || (_a8[_b] = []);
    insert(list, options);
    if (options.schema) {
      try {
        options.schema(config2.value, { autofix: true });
      } catch (error) {
        console.error(error);
      }
    }
    return this.scope.collect("settings", () => remove(list, options));
  }
  theme(options) {
    markRaw(options);
    this.internal.themes[options.id] = options;
    for (const [type, component] of Object.entries(options.components || {})) {
      this.slot({
        type,
        disabled: () => config2.value.theme[mode2.value] !== options.id,
        component
      });
    }
    return this.scope.collect("view", () => delete this.internal.themes[options.id]);
  }
};
markRaw(Context.prototype);
markRaw(EffectScope.prototype);

// node_modules/@koishijs/client/client/components/link.ts
var KActivityLink = defineComponent({
  props: {
    id: String
  },
  setup(props, { slots }) {
    const ctx = useContext();
    return () => {
      const activity = ctx.internal.activities[props.id];
      return h(RouterLink, {
        to: ctx.internal.routeCache[activity == null ? void 0 : activity.id] || (activity == null ? void 0 : activity.path.replace(/:.+/, ""))
      }, {
        default: () => {
          var _a8;
          return ((_a8 = slots.default) == null ? void 0 : _a8.call(slots)) ?? (activity == null ? void 0 : activity.name);
        }
      });
    };
  }
});
function link_default(app) {
  app.component("k-activity-link", KActivityLink);
}

// node_modules/@koishijs/client/client/components/slot.ts
var KSlot = defineComponent({
  props: {
    name: String,
    data: Object,
    single: Boolean
  },
  setup(props, { slots }) {
    const ctx = useContext();
    return () => {
      var _a8, _b, _c;
      const internal = props.single ? [] : [...((_a8 = slots.default) == null ? void 0 : _a8.call(slots)) || []].filter((node) => node.type === KSlotItem).map((node) => {
        var _a9;
        return { node, order: ((_a9 = node.props) == null ? void 0 : _a9.order) || 0 };
      });
      const external = [...ctx.internal.views[props.name] || []].filter((item) => {
        var _a9;
        return !((_a9 = item.disabled) == null ? void 0 : _a9.call(item));
      }).map((item) => ({
        node: h(item.component, { data: props.data, ...props.data }, slots),
        order: item.order,
        layer: 1
      }));
      const children = [...internal, ...external].sort((a, b) => b.order - a.order);
      if (props.single) {
        return ((_b = children[0]) == null ? void 0 : _b.node) || ((_c = slots.default) == null ? void 0 : _c.call(slots));
      }
      return children.map((item) => item.node);
    };
  }
});
var KSlotItem = defineComponent({
  props: {
    order: Number
  },
  setup(props, { slots }) {
    return () => {
      var _a8;
      return (_a8 = slots.default) == null ? void 0 : _a8.call(slots);
    };
  }
});
function defineSlotComponent(name) {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      return () => h(KSlot, { name, data: attrs, single: true }, slots);
    }
  });
}
var slot_default = (app) => {
  app.component("k-slot", KSlot);
  app.component("k-slot-item", KSlotItem);
  app.component("k-layout", defineSlotComponent("layout"));
  app.component("k-status", defineSlotComponent("status"));
};

// node_modules/@koishijs/client/client/components/index.ts
import "C:/Users/29115/dev/ks/node_modules/element-plus/dist/index.css";
var loading = ElLoading.service;
var message = ElMessage;
var messageBox = ElMessageBox;
src_default.extensions.add({
  type: "any",
  role: "dynamic",
  component: Dynamic
});
function components_default(app) {
  app.use(installer);
  app.component("k-markdown", src_default2);
  app.use(common_default);
  app.use(client_default);
  app.use(icons_exports);
  app.use(layout_default);
  app.use(link_default);
  app.use(slot_default);
}

// node_modules/@koishijs/client/client/index.ts
import Overlay from "C:/Users/29115/dev/ks/node_modules/@koishijs/client/client/components/chat/overlay.vue";

// node_modules/@satorijs/protocol/lib/index.mjs
var lib_exports2 = {};
__export(lib_exports2, {
  Channel: () => Channel,
  Methods: () => Methods,
  Opcode: () => Opcode,
  Status: () => Status,
  WebSocket: () => WebSocket
});
var __defProp3 = Object.defineProperty;
var __name3 = (target, value) => __defProp3(target, "name", { value, configurable: true });
function Field2(name) {
  return { name };
}
__name3(Field2, "Field");
function Method(name, fields) {
  return { name, fields: fields.map(Field2) };
}
__name3(Method, "Method");
var Methods = {
  "channel.get": Method("getChannel", ["channel_id", "guild_id"]),
  "channel.list": Method("getChannelList", ["guild_id", "next"]),
  "channel.create": Method("createChannel", ["guild_id", "data"]),
  "channel.update": Method("updateChannel", ["channel_id", "data"]),
  "channel.delete": Method("deleteChannel", ["channel_id"]),
  "channel.mute": Method("muteChannel", ["channel_id", "guild_id", "enable"]),
  "message.create": Method("createMessage", ["channel_id", "content"]),
  "message.update": Method("editMessage", ["channel_id", "message_id", "content"]),
  "message.delete": Method("deleteMessage", ["channel_id", "message_id"]),
  "message.get": Method("getMessage", ["channel_id", "message_id"]),
  "message.list": Method("getMessageList", ["channel_id", "next"]),
  "reaction.create": Method("createReaction", ["channel_id", "message_id", "emoji"]),
  "reaction.delete": Method("deleteReaction", ["channel_id", "message_id", "emoji", "user_id"]),
  "reaction.clear": Method("clearReaction", ["channel_id", "message_id", "emoji"]),
  "reaction.list": Method("getReactionList", ["channel_id", "message_id", "emoji", "next"]),
  "guild.get": Method("getGuild", ["guild_id"]),
  "guild.list": Method("getGuildList", ["next"]),
  "guild.member.get": Method("getGuildMember", ["guild_id", "user_id"]),
  "guild.member.list": Method("getGuildMemberList", ["guild_id", "next"]),
  "guild.member.kick": Method("kickGuildMember", ["guild_id", "user_id", "permanent"]),
  "guild.member.mute": Method("muteGuildMember", ["guild_id", "user_id", "duration", "reason"]),
  "guild.member.role.set": Method("setGuildMemberRole", ["guild_id", "user_id", "role_id"]),
  "guild.member.role.unset": Method("unsetGuildMemberRole", ["guild_id", "user_id", "role_id"]),
  "guild.role.list": Method("getGuildRoleList", ["guild_id", "next"]),
  "guild.role.create": Method("createGuildRole", ["guild_id", "data"]),
  "guild.role.update": Method("updateGuildRole", ["guild_id", "role_id", "data"]),
  "guild.role.delete": Method("deleteGuildRole", ["guild_id", "role_id"]),
  "login.get": Method("getLogin", []),
  "user.get": Method("getUser", ["user_id"]),
  "user.channel.create": Method("createDirectChannel", ["user_id", "guild_id"]),
  "friend.list": Method("getFriendList", ["next"]),
  "friend.delete": Method("deleteFriend", ["user_id"]),
  "friend.approve": Method("handleFriendRequest", ["message_id", "approve", "comment"]),
  "guild.approve": Method("handleGuildRequest", ["message_id", "approve", "comment"]),
  "guild.member.approve": Method("handleGuildMemberRequest", ["message_id", "approve", "comment"])
};
var Channel;
((Channel2) => {
  let Type;
  ((Type2) => {
    Type2[Type2["TEXT"] = 0] = "TEXT";
    Type2[Type2["DIRECT"] = 1] = "DIRECT";
    Type2[Type2["VOICE"] = 2] = "VOICE";
    Type2[Type2["CATEGORY"] = 3] = "CATEGORY";
  })(Type = Channel2.Type || (Channel2.Type = {}));
})(Channel || (Channel = {}));
var Status = ((Status2) => {
  Status2[Status2["OFFLINE"] = 0] = "OFFLINE";
  Status2[Status2["ONLINE"] = 1] = "ONLINE";
  Status2[Status2["CONNECT"] = 2] = "CONNECT";
  Status2[Status2["DISCONNECT"] = 3] = "DISCONNECT";
  Status2[Status2["RECONNECT"] = 4] = "RECONNECT";
  return Status2;
})(Status || {});
var Opcode = ((Opcode2) => {
  Opcode2[Opcode2["EVENT"] = 0] = "EVENT";
  Opcode2[Opcode2["PING"] = 1] = "PING";
  Opcode2[Opcode2["PONG"] = 2] = "PONG";
  Opcode2[Opcode2["IDENTIFY"] = 3] = "IDENTIFY";
  Opcode2[Opcode2["READY"] = 4] = "READY";
  return Opcode2;
})(Opcode || {});
var WebSocket;
((WebSocket2) => {
  WebSocket2.CONNECTING = 0;
  WebSocket2.OPEN = 1;
  WebSocket2.CLOSING = 2;
  WebSocket2.CLOSED = 3;
})(WebSocket || (WebSocket = {}));

// node_modules/@koishijs/client/client/utils.ts
var Card2;
((Card3) => {
  function create(render, fields = []) {
    return defineComponent({
      render: () => fields.every((key) => store[key]) ? render() : null
    });
  }
  Card3.create = create;
  function numeric({ type, icon, fields, title, content }) {
    if (!type) {
      return defineComponent(() => () => {
        if (!fields.every((key) => store[key]))
          return;
        return h(resolveComponent("k-numeric"), { icon, title }, () => content(store));
      });
    }
    return defineComponent(() => () => {
      if (!fields.every((key) => store[key]))
        return;
      let value = content(store);
      if (isNullable(value))
        return;
      if (type === "size") {
        if (value >= (1 << 20) * 1e3) {
          value = (value / (1 << 30)).toFixed(1) + " GB";
        } else if (value >= (1 << 10) * 1e3) {
          value = (value / (1 << 20)).toFixed(1) + " MB";
        } else {
          value = (value / (1 << 10)).toFixed(1) + " KB";
        }
      }
      return h(resolveComponent("k-numeric"), { icon, title }, () => [value]);
    });
  }
  Card3.numeric = numeric;
})(Card2 || (Card2 = {}));

// node_modules/@koishijs/client/client/index.ts
var client_default2 = components_default;
var root = new Context4();
var router = createRouter({
  history: createWebHistory(global.uiPath),
  linkActiveClass: "active",
  routes: []
});
router.afterEach((route) => {
  var _a8;
  const { name, fullPath } = router.currentRoute.value;
  routeCache[name] = fullPath;
  if (route.meta.activity) {
    document.title = `${route.meta.activity.name} | ${((_a8 = global.messages) == null ? void 0 : _a8.title) || "Koishi 控制台"}`;
  }
});
var i18n = createI18n({
  legacy: false,
  fallbackLocale: "zh-CN"
});
watchEffect(() => {
  i18n.global.locale.value = config.value.locale;
});
root.app.use(components_default);
root.app.use(i18n);
root.app.use(router);
root.slot({
  type: "global",
  component: Overlay
});
root.on("activity", (data) => !data);
router.beforeEach(async (to, from) => {
  if (to.matched.length)
    return;
  if (from === START_LOCATION_NORMALIZED) {
    await initTask;
    to = router.resolve(to);
    if (to.matched.length)
      return to;
  }
  return {
    path: "/",
    query: { redirect: to.fullPath }
  };
});
export {
  Activity,
  Card2 as Card,
  ChatImage,
  ChatInput,
  Context4 as Context,
  DatetimeFormat,
  I18nD,
  I18nInjectionKey,
  I18nN,
  I18nT,
  IconArrowDown,
  IconArrowUp,
  IconBranch,
  IconClose,
  IconCollapse,
  IconDelete,
  IconEllipsis,
  IconExpand,
  IconExternal,
  IconEye,
  IconEyeSlash,
  IconInsertAfter,
  IconInsertBefore,
  IconInvalid,
  IconRedo,
  IconReset,
  IconSquareCheck,
  IconSquareEmpty,
  IconUndo,
  KSlot,
  MessageContent,
  NumberFormat,
  Primitive,
  lib_exports2 as Satori,
  lib_default as Schema,
  src_default as SchemaBase,
  Service2 as Service,
  Time,
  Translation,
  lib_exports2 as Universal,
  VERSION,
  VirtualList,
  activities,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  camelCase,
  camelize,
  capitalize,
  castToVueI18n,
  clone,
  config,
  connect,
  contain,
  createI18n,
  createStorage,
  deduplicate,
  deepEqual,
  client_default2 as default,
  defineExtension,
  defineProperty,
  difference,
  extensions,
  filterKeys,
  form,
  global,
  hyphenate,
  i18n,
  icons_exports as icons,
  initTask,
  intersection,
  is,
  isNullable,
  isPlainObject,
  loading,
  makeArray,
  mapValues,
  message,
  messageBox,
  noop,
  omit,
  paramCase,
  pick,
  provideStorage,
  receive,
  remove,
  root,
  routeCache,
  router,
  sanitize,
  send,
  snakeCase,
  socket,
  store,
  trimSlash,
  uncapitalize,
  union,
  unwrapExports,
  useColorMode,
  useConfig,
  useContext,
  useI18n,
  useI18nText,
  useMenu,
  useStorage,
  vTDirective,
  mapValues as valueMap
};
//# sourceMappingURL=@koishijs_client.js.map
