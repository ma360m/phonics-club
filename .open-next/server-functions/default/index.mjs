globalThis.monorepoPackagePath = "";globalThis.openNextDebug = false;globalThis.openNextVersion = "4.1.0";globalThis.nextVersion = "15.5.23";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod3) => function __require2() {
  return mod3 || (0, cb[__getOwnPropNames(cb)[0]])((mod3 = { exports: {} }).exports, mod3), mod3.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod3, secondTarget) => (__copyProps(target, mod3, "default"), secondTarget && __copyProps(secondTarget, mod3, "default"));
var __toESM = (mod3, isNodeMode, target) => (target = mod3 != null ? __create(__getProtoOf(mod3)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod3 || !mod3.__esModule ? __defProp(target, "default", { value: mod3, enumerable: true }) : target,
  mod3
));
var __toCommonJS = (mod3) => __copyProps(__defProp({}, "__esModule", { value: true }), mod3);

// node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var IgnorableError, FatalError;
var init_error = __esm({
  "node_modules/@opennextjs/aws/dist/utils/error.js"() {
    IgnorableError = class extends Error {
      __openNextInternal = true;
      canIgnore = true;
      logLevel = 0;
      constructor(message) {
        super(message);
        this.name = "IgnorableError";
      }
    };
    FatalError = class extends Error {
      __openNextInternal = true;
      canIgnore = false;
      logLevel = 2;
      constructor(message) {
        super(message);
        this.name = "FatalError";
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var parseHeaders, convertHeader;
var init_util = __esm({
  "node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
    parseHeaders = (headers) => {
      const result = {};
      if (!headers) {
        return result;
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value === void 0) {
          continue;
        }
        const keyLower = key.toLowerCase();
        if (keyLower === "location" && Array.isArray(value)) {
          if (value.length === 1 || value[0] === value[1]) {
            result[keyLower] = value[0];
          } else {
            warn("Multiple different values for Location header found. Using the last one");
            result[keyLower] = value[value.length - 1];
          }
          continue;
        }
        result[keyLower] = convertHeader(value);
      }
      return result;
    };
    convertHeader = (header) => {
      if (typeof header === "string") {
        return header;
      }
      if (Array.isArray(header)) {
        return header.join(",");
      }
      return String(header);
    };
  }
});

// node-built-in-modules:node:module
var node_module_exports = {};
import * as node_module_star from "node:module";
var init_node_module = __esm({
  "node-built-in-modules:node:module"() {
    __reExport(node_module_exports, node_module_star);
  }
});

// node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream as ReadableStream2 } from "node:stream/web";
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream2({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream2({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js
var cloudflare_node_exports = {};
__export(cloudflare_node_exports, {
  default: () => cloudflare_node_default
});
import { Writable } from "node:stream";
var NULL_BODY_STATUSES2, handler, cloudflare_node_default;
var init_cloudflare_node = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js"() {
    NULL_BODY_STATUSES2 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
    handler = async (handler3, converter2) => async (request, env, ctx, abortSignal) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const url = new URL(request.url);
      const { promise: promiseResponse, resolve: resolveResponse } = Promise.withResolvers();
      const streamCreator = {
        writeHeaders(prelude) {
          const { statusCode, cookies, headers } = prelude;
          const responseHeaders = new Headers(headers);
          for (const cookie of cookies) {
            responseHeaders.append("Set-Cookie", cookie);
          }
          if (url.hostname === "localhost") {
            responseHeaders.set("Content-Encoding", "identity");
          }
          if (NULL_BODY_STATUSES2.has(statusCode)) {
            const response2 = new Response(null, {
              status: statusCode,
              headers: responseHeaders
            });
            resolveResponse(response2);
            return new Writable({
              write(chunk, encoding, callback) {
                callback();
              }
            });
          }
          let controller;
          const readable = new ReadableStream({
            start(c) {
              controller = c;
            }
          });
          const response = new Response(readable, {
            status: statusCode,
            headers: responseHeaders
          });
          resolveResponse(response);
          return new Writable({
            write(chunk, encoding, callback) {
              try {
                controller.enqueue(chunk);
              } catch (e) {
                return callback(e);
              }
              callback();
            },
            final(callback) {
              controller.close();
              callback();
            },
            destroy(error2, callback) {
              if (error2) {
                controller.error(error2);
              } else {
                try {
                  controller.close();
                } catch {
                }
              }
              callback(error2);
            }
          });
        },
        // This is for passing along the original abort signal from the initial Request you retrieve in your worker
        // Ensures that the response we pass to NextServer is aborted if the request is aborted
        // By doing this `request.signal.onabort` will work in route handlers
        abortSignal,
        // There is no need to retain the chunks that were pushed to the response stream.
        retainChunks: false
      };
      ctx.waitUntil(handler3(internalEvent, {
        streamCreator,
        waitUntil: ctx.waitUntil.bind(ctx)
      }));
      return promiseResponse;
    };
    cloudflare_node_default = {
      wrapper: handler,
      name: "cloudflare-node",
      supportStreaming: true
    };
  }
});

// node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var dummyTagCache, dummy_default;
var init_dummy = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js"() {
    dummyTagCache = {
      name: "dummy",
      mode: "original",
      getByPath: async () => {
        return [];
      },
      getByTag: async () => {
        return [];
      },
      getLastModified: async (_, lastModified) => {
        return lastModified ?? Date.now();
      },
      writeTags: async () => {
        return;
      },
      isStale: async (_path) => {
        return false;
      }
    };
    dummy_default = dummyTagCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js
var dummy_exports2 = {};
__export(dummy_exports2, {
  default: () => dummy_default2
});
var dummyQueue, dummy_default2;
var init_dummy2 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js"() {
    init_error();
    dummyQueue = {
      name: "dummy",
      send: async () => {
        throw new FatalError("Dummy queue is not implemented");
      }
    };
    dummy_default2 = dummyQueue;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js
var dummy_exports3 = {};
__export(dummy_exports3, {
  default: () => dummy_default3
});
var dummyIncrementalCache, dummy_default3;
var init_dummy3 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js"() {
    init_error();
    dummyIncrementalCache = {
      name: "dummy",
      get: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      set: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      delete: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      }
    };
    dummy_default3 = dummyIncrementalCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports4 = {};
__export(dummy_exports4, {
  default: () => dummy_default4
});
var resolver, dummy_default4;
var init_dummy4 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default4 = resolver;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          const cur = responseHeaders[key];
          if (cur === void 0) {
            responseHeaders[key] = value;
          } else if (Array.isArray(cur)) {
            cur.push(value);
          } else {
            responseHeaders[key] = [cur, value];
          }
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js
var dummy_exports5 = {};
__export(dummy_exports5, {
  default: () => dummy_default5
});
var dummy_default5;
var init_dummy5 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js"() {
    dummy_default5 = {
      name: "dummy",
      invalidatePaths: (_) => {
        return Promise.resolve();
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/adapters/util.js
function setNodeEnv() {
  const processEnv = process.env;
  processEnv.NODE_ENV = process.env.NODE_ENV ?? "production";
}
function generateUniqueId() {
  return Math.random().toString(36).slice(2, 8);
}

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
import { AsyncLocalStorage } from "node:async_hooks";

// node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";
var SET_COOKIE_HEADER = "set-cookie";
var CANNOT_BE_USED = "This cannot be used in OpenNext";
var OpenNextNodeResponse = class extends Transform {
  fixHeadersFn;
  onEnd;
  streamCreator;
  initialHeaders;
  statusCode;
  statusMessage = "";
  headers = {};
  headersSent = false;
  _chunks = [];
  headersAlreadyFixed = false;
  _cookies = [];
  responseStream;
  bodyLength = 0;
  // To comply with the ServerResponse interface :
  strictContentLength = false;
  assignSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  detachSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  // We might have to revisit those 3 in the future
  writeContinue(_callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeEarlyHints(_hints, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeProcessing() {
    throw new Error(CANNOT_BE_USED);
  }
  /**
   * This is a dummy request object to comply with the ServerResponse interface
   * It will never be defined
   */
  req;
  chunkedEncoding = false;
  shouldKeepAlive = true;
  useChunkedEncodingByDefault = true;
  sendDate = false;
  connection = null;
  socket = null;
  setTimeout(_msecs, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  addTrailers(_headers) {
    throw new Error(CANNOT_BE_USED);
  }
  constructor(fixHeadersFn, onEnd, streamCreator, initialHeaders, statusCode) {
    super();
    this.fixHeadersFn = fixHeadersFn;
    this.onEnd = onEnd;
    this.streamCreator = streamCreator;
    this.initialHeaders = initialHeaders;
    if (statusCode && Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
      this.statusCode = statusCode;
    }
    streamCreator?.abortSignal?.addEventListener("abort", () => {
      this.destroy();
    });
  }
  // Necessary for next 12
  // We might have to implement all the methods here
  get originalResponse() {
    return this;
  }
  get finished() {
    return this.responseStream ? this.responseStream?.writableFinished : this.writableFinished;
  }
  setHeader(name, value) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      if (Array.isArray(value)) {
        this._cookies = value;
      } else {
        this._cookies = [value];
      }
    }
    this.headers[key] = value;
    return this;
  }
  removeHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      this._cookies = [];
    } else {
      delete this.headers[key];
    }
    return this;
  }
  hasHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      return this._cookies.length > 0;
    }
    return this.headers[key] !== void 0;
  }
  getHeaders() {
    return this.headers;
  }
  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }
  getHeaderNames() {
    return Object.keys(this.headers);
  }
  // Only used directly in next@14+
  flushHeaders() {
    this.headersSent = true;
    const mergeHeadersPriority = globalThis.__openNextAls?.getStore()?.mergeHeadersPriority ?? "middleware";
    if (this.initialHeaders) {
      this.headers = mergeHeadersPriority === "middleware" ? {
        ...this.headers,
        ...this.initialHeaders
      } : {
        ...this.initialHeaders,
        ...this.headers
      };
      const initialCookies = parseSetCookieHeader(this.initialHeaders[SET_COOKIE_HEADER]?.toString());
      this._cookies = mergeHeadersPriority === "middleware" ? [...this._cookies, ...initialCookies] : [...initialCookies, ...this._cookies];
    }
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    const parsedHeaders = parseHeaders(this.headers);
    delete parsedHeaders[SET_COOKIE_HEADER];
    if (this.streamCreator) {
      this.responseStream = this.streamCreator?.writeHeaders({
        statusCode: this.statusCode ?? 200,
        cookies: this._cookies,
        headers: parsedHeaders
      });
      this.pipe(this.responseStream);
    }
  }
  appendHeader(name, value) {
    const key = name.toLowerCase();
    if (!this.hasHeader(key)) {
      return this.setHeader(key, value);
    }
    const existingHeader = this.getHeader(key);
    const toAppend = Array.isArray(value) ? value : [value];
    const newValue = Array.isArray(existingHeader) ? [...existingHeader, ...toAppend] : [existingHeader, ...toAppend];
    return this.setHeader(key, newValue);
  }
  writeHead(statusCode, statusMessage, headers) {
    let _headers = headers;
    let _statusMessage;
    if (typeof statusMessage === "string") {
      _statusMessage = statusMessage;
    } else {
      _headers = statusMessage;
    }
    const finalHeaders = this.headers;
    if (_headers) {
      if (Array.isArray(_headers)) {
        for (let i = 0; i < _headers.length; i += 2) {
          finalHeaders[_headers[i]] = _headers[i + 1];
        }
      } else {
        for (const key of Object.keys(_headers)) {
          finalHeaders[key] = _headers[key];
        }
      }
    }
    this.statusCode = statusCode;
    if (headers) {
      this.headers = finalHeaders;
    }
    this.flushHeaders();
    return this;
  }
  /**
   * OpenNext specific method
   */
  fixHeaders(headers) {
    if (this.headersAlreadyFixed) {
      return;
    }
    this.fixHeadersFn(headers);
    this.headersAlreadyFixed = true;
  }
  getFixedHeaders() {
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    return this.headers;
  }
  getBody() {
    return Buffer.concat(this._chunks);
  }
  _internalWrite(chunk, encoding) {
    const buffer = encoding === "buffer" ? chunk : Buffer.from(chunk, encoding);
    this.bodyLength += buffer.length;
    if (this.streamCreator?.retainChunks !== false) {
      this._chunks.push(buffer);
    }
    this.push(buffer);
    this.streamCreator?.onWrite?.();
  }
  _transform(chunk, encoding, callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    this._internalWrite(chunk, encoding);
    callback();
  }
  _flush(callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    globalThis.__openNextAls?.getStore()?.pendingPromiseRunner.add(this.onEnd(this.headers));
    this.streamCreator?.onFinish?.(this.bodyLength);
    if (this.bodyLength === 0 && // We use an env variable here because not all aws account have the same behavior
    // On some aws accounts the response will hang if the body is empty
    // We are modifying the response body here, this is not a good practice
    process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
      debug('Force writing "SOMETHING" to the response body');
      this.push("SOMETHING");
    }
    callback();
  }
  /**
   * New method in Node 18.15+
   * There are probably not used right now in Next.js, but better be safe than sorry
   */
  setHeaders(headers) {
    headers.forEach((value, key) => {
      this.setHeader(key, Array.isArray(value) ? value : value.toString());
    });
    return this;
  }
  /**
   * Next specific methods
   * On earlier versions of next.js, those methods are mandatory to make everything work
   */
  get sent() {
    return this.finished || this.headersSent;
  }
  getHeaderValues(name) {
    const values = this.getHeader(name);
    if (values === void 0)
      return void 0;
    return (Array.isArray(values) ? values : [values]).map((value) => value.toString());
  }
  send() {
    for (const chunk of this._chunks) {
      this.write(chunk);
    }
    this.end();
  }
  body(value) {
    this.write(value);
    return this;
  }
  onClose(callback) {
    this.on("close", callback);
  }
  redirect(destination, statusCode) {
    this.setHeader("Location", destination);
    this.statusCode = statusCode;
    if (statusCode === 308) {
      this.setHeader("Refresh", `0;url=${destination}`);
    }
    return this;
  }
  // For some reason, next returns the 500 error page with some cache-control headers
  // We need to fix that
  fixHeadersForError() {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    if (this.statusCode === 404 || this.statusCode === 500) {
      this.headers["cache-control"] = "private, no-cache, no-store, max-age=0, must-revalidate";
    }
  }
};

// node_modules/@opennextjs/aws/dist/http/request.js
import http from "node:http";
var IncomingMessage = class extends http.IncomingMessage {
  constructor({ method, url, headers, body, remoteAddress }) {
    super({
      encrypted: true,
      readable: false,
      remoteAddress,
      address: () => ({ port: 443 }),
      end: Function.prototype,
      destroy: Function.prototype
    });
    if (body) {
      headers["content-length"] ??= String(Buffer.byteLength(body));
    }
    Object.assign(this, {
      ip: remoteAddress,
      complete: true,
      httpVersion: "1.1",
      httpVersionMajor: "1",
      httpVersionMinor: "1",
      method,
      headers,
      body,
      url
    });
    this._read = () => {
      this.push(body);
      this.push(null);
    };
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();

// node_modules/@opennextjs/aws/dist/utils/requestCache.js
var RequestCache = class {
  _caches = /* @__PURE__ */ new Map();
  /**
   * Returns the Map registered under `key`.
   * If no Map exists yet for that key, a new empty Map is created, stored, and returned.
   * Repeated calls with the same key always return the **same** Map instance.
   */
  getOrCreate(key) {
    let cache = this._caches.get(key);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      this._caches.set(key, cache);
    }
    return cache;
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set(),
    requestCache: new RequestCache()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": {}, "webpack": null, "eslint": { "ignoreDuringBuilds": false }, "typescript": { "ignoreBuildErrors": false, "tsconfigPath": "tsconfig.json" }, "typedRoutes": false, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.mjs", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [16, 32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 60, "formats": ["image/webp"], "maximumResponseBody": 5e7, "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "attachment", "remotePatterns": [{ "protocol": "https", "hostname": "res.cloudinary.com" }, { "protocol": "https", "hostname": "**.supabase.co" }], "unoptimized": false }, "devIndicators": { "position": "bottom-left" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "amp": { "canonicalBase": "" }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "excludeDefaultMomentLocales": true, "serverRuntimeConfig": {}, "publicRuntimeConfig": {}, "reactProductionProfiling": false, "reactStrictMode": null, "reactMaxHeadersLength": 6e3, "httpAgentOptions": { "keepAlive": true }, "logging": {}, "compiler": {}, "expireTime": 31536e3, "staticPageGenerationTimeout": 60, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "outputFileTracingRoot": "C:\\Users\\DELL\\Downloads\\education-ecommerce-ui", "experimental": { "useSkewCookie": false, "cacheLife": { "default": { "stale": 300, "revalidate": 900, "expire": 4294967294 }, "seconds": { "stale": 30, "revalidate": 1, "expire": 60 }, "minutes": { "stale": 300, "revalidate": 60, "expire": 3600 }, "hours": { "stale": 300, "revalidate": 3600, "expire": 86400 }, "days": { "stale": 300, "revalidate": 86400, "expire": 604800 }, "weeks": { "stale": 300, "revalidate": 604800, "expire": 2592e3 }, "max": { "stale": 300, "revalidate": 2592e3, "expire": 4294967294 } }, "cacheHandlers": {}, "cssChunking": true, "multiZoneDraftMode": false, "appNavFailHandling": false, "prerenderEarlyExit": true, "serverMinification": true, "serverSourceMaps": false, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "clientSegmentCache": false, "clientParamParsing": false, "dynamicOnHover": false, "preloadEntriesOnStart": true, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "middlewarePrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 15, "memoryBasedWorkersCount": false, "imgOptConcurrency": null, "imgOptTimeoutInSeconds": 7, "imgOptMaxInputPixels": 268402689, "imgOptSequentialRead": null, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "typedEnv": false, "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "authInterrupts": false, "webpackMemoryOptimizations": false, "optimizeServerReact": true, "viewTransition": false, "routerBFCache": false, "removeUncaughtErrorAndRejectionListeners": false, "validateRSCRequestHeaders": false, "staleTimes": { "dynamic": 0, "static": 300 }, "serverComponentsHmrCache": true, "staticGenerationMaxConcurrency": 8, "staticGenerationMinPagesPerWorker": 25, "cacheComponents": false, "inlineCss": false, "useCache": false, "globalNotFound": false, "devtoolSegmentExplorer": true, "browserDebugInfoInTerminal": false, "optimizeRouterScrolling": false, "middlewareClientMaxBodySize": 10485760, "serverActions": { "bodySizeLimit": "50mb" }, "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "effect", "@effect/schema", "@effect/platform", "@effect/platform-node", "@effect/platform-browser", "@effect/platform-bun", "@effect/sql", "@effect/sql-mssql", "@effect/sql-mysql2", "@effect/sql-pg", "@effect/sql-sqlite-node", "@effect/sql-sqlite-bun", "@effect/sql-sqlite-wasm", "@effect/sql-sqlite-react-native", "@effect/rpc", "@effect/rpc-http", "@effect/typeclass", "@effect/experimental", "@effect/opentelemetry", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight", "bundlePagesRouterDependencies": false, "configFileName": "next.config.mjs", "turbopack": { "root": "C:\\Users\\DELL\\Downloads\\education-ecommerce-ui" }, "_originalRedirects": [{ "source": "/home", "destination": "/", "permanent": true }, { "source": "/home/:path*", "destination": "/", "permanent": true }, { "source": "/phonics-club", "destination": "/", "permanent": true }, { "source": "/phonics-club.html", "destination": "/", "permanent": true }, { "source": "/main", "destination": "/", "permanent": true }, { "source": "/main.html", "destination": "/", "permanent": true }, { "source": "/sample-page", "destination": "/", "permanent": true }, { "source": "/sample-page.html", "destination": "/", "permanent": true }, { "source": "/about-us", "destination": "/about", "permanent": true }, { "source": "/about-us.html", "destination": "/about", "permanent": true }, { "source": "/our-team", "destination": "/about", "permanent": true }, { "source": "/our-team.html", "destination": "/about", "permanent": true }, { "source": "/team", "destination": "/about", "permanent": true }, { "source": "/team.html", "destination": "/about", "permanent": true }, { "source": "/history", "destination": "/about", "permanent": true }, { "source": "/history.html", "destination": "/about", "permanent": true }, { "source": "/what-we-do", "destination": "/consultancy", "permanent": true }, { "source": "/what-we-do.html", "destination": "/consultancy", "permanent": true }, { "source": "/services", "destination": "/consultancy", "permanent": true }, { "source": "/services.html", "destination": "/consultancy", "permanent": true }, { "source": "/our-services", "destination": "/consultancy", "permanent": true }, { "source": "/our-services.html", "destination": "/consultancy", "permanent": true }, { "source": "/contact-us", "destination": "/contact", "permanent": true }, { "source": "/contact-us.html", "destination": "/contact", "permanent": true }, { "source": "/faq", "destination": "/faqs", "permanent": true }, { "source": "/faq.html", "destination": "/faqs", "permanent": true }, { "source": "/privacy-policy", "destination": "/privacy", "permanent": true }, { "source": "/privacy-policy.html", "destination": "/privacy", "permanent": true }, { "source": "/privacy-policy-of-phonicsclub-app", "destination": "/privacy", "permanent": true }, { "source": "/privacy-policy-of-phonicsclub-app.html", "destination": "/privacy", "permanent": true }, { "source": "/terms-and-conditions", "destination": "/terms", "permanent": true }, { "source": "/terms-and-conditions.html", "destination": "/terms", "permanent": true }, { "source": "/refund-policy", "destination": "/refunds", "permanent": true }, { "source": "/refund-policy.html", "destination": "/refunds", "permanent": true }, { "source": "/shipping-policy", "destination": "/shipping", "permanent": true }, { "source": "/shipping-policy.html", "destination": "/shipping", "permanent": true }, { "source": "/cookies-policy", "destination": "/cookies", "permanent": true }, { "source": "/cookies-policy.html", "destination": "/cookies", "permanent": true }, { "source": "/feedback", "destination": "/contact", "permanent": true }, { "source": "/feedback.html", "destination": "/contact", "permanent": true }, { "source": "/testimonials", "destination": "/about", "permanent": true }, { "source": "/testimonials.html", "destination": "/about", "permanent": true }, { "source": "/gallery", "destination": "/about", "permanent": true }, { "source": "/gallery.html", "destination": "/about", "permanent": true }, { "source": "/phonics-club-gallery", "destination": "/about", "permanent": true }, { "source": "/phonics-club-gallery.html", "destination": "/about", "permanent": true }, { "source": "/videos", "destination": "/blog/jolly-phonics-2017-training-video", "permanent": true }, { "source": "/videos.html", "destination": "/blog/jolly-phonics-2017-training-video", "permanent": true }, { "source": "/research-in-pakistan", "destination": "/research", "permanent": true }, { "source": "/research-in-pakistan.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-1", "destination": "/research", "permanent": true }, { "source": "/pilot-study-1.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-2", "destination": "/research", "permanent": true }, { "source": "/pilot-study-2.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-3", "destination": "/research", "permanent": true }, { "source": "/pilot-study-3.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-4", "destination": "/research", "permanent": true }, { "source": "/pilot-study-4.html", "destination": "/research", "permanent": true }, { "source": "/education-for-all", "destination": "/research", "permanent": true }, { "source": "/education-for-all.html", "destination": "/research", "permanent": true }, { "source": "/classroom-strategies", "destination": "/research", "permanent": true }, { "source": "/classroom-strategies.html", "destination": "/research", "permanent": true }, { "source": "/language-lab", "destination": "/research", "permanent": true }, { "source": "/language-lab.html", "destination": "/research", "permanent": true }, { "source": "/training-sessions-gallery", "destination": "/trainings", "permanent": true }, { "source": "/training-sessions-gallery.html", "destination": "/trainings", "permanent": true }, { "source": "/student-assessment-gallery", "destination": "/research", "permanent": true }, { "source": "/student-assessment-gallery.html", "destination": "/research", "permanent": true }, { "source": "/roshni-maktab-gallery", "destination": "/research", "permanent": true }, { "source": "/roshni-maktab-gallery.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-1-gallery", "destination": "/research", "permanent": true }, { "source": "/pilot-study-1-gallery.html", "destination": "/research", "permanent": true }, { "source": "/pilot-study-4-gallery", "destination": "/research", "permanent": true }, { "source": "/pilot-study-4-gallery.html", "destination": "/research", "permanent": true }, { "source": "/training", "destination": "/trainings", "permanent": true }, { "source": "/training/:path*", "destination": "/trainings", "permanent": true }, { "source": "/trainings-events", "destination": "/trainings", "permanent": true }, { "source": "/trainings-events/:path*", "destination": "/trainings", "permanent": true }, { "source": "/readers", "destination": "/trainings", "permanent": true }, { "source": "/readers/:path*", "destination": "/trainings", "permanent": true }, { "source": "/workshops", "destination": "/trainings", "permanent": true }, { "source": "/workshops.html", "destination": "/trainings", "permanent": true }, { "source": "/learn-english-through-jolly-phonics-workshop", "destination": "/trainings", "permanent": true }, { "source": "/learn-english-through-jolly-phonics-workshop.html", "destination": "/trainings", "permanent": true }, { "source": "/jolly-phonics-certified-trainers", "destination": "/certified-trainers", "permanent": true }, { "source": "/jolly-phonics-certified-trainers.html", "destination": "/certified-trainers", "permanent": true }, { "source": "/affiliation", "destination": "/consultancy", "permanent": true }, { "source": "/affiliation.html", "destination": "/consultancy", "permanent": true }, { "source": "/campus-affiliation", "destination": "/consultancy", "permanent": true }, { "source": "/campus-affiliation.html", "destination": "/consultancy", "permanent": true }, { "source": "/individual-affiliation", "destination": "/consultancy", "permanent": true }, { "source": "/individual-affiliation.html", "destination": "/consultancy", "permanent": true }, { "source": "/school-zone", "destination": "/consultancy", "permanent": true }, { "source": "/school-zone.html", "destination": "/consultancy", "permanent": true }, { "source": "/education-zone", "destination": "/consultancy", "permanent": true }, { "source": "/education-zone.html", "destination": "/consultancy", "permanent": true }, { "source": "/course", "destination": "/courses", "permanent": true }, { "source": "/course.html", "destination": "/courses", "permanent": true }, { "source": "/online-courses", "destination": "/courses", "permanent": true }, { "source": "/online-courses.html", "destination": "/courses", "permanent": true }, { "source": "/courses-online", "destination": "/courses", "permanent": true }, { "source": "/courses-online.html", "destination": "/courses", "permanent": true }, { "source": "/lp-courses", "destination": "/courses", "permanent": true }, { "source": "/lp-courses.html", "destination": "/courses", "permanent": true }, { "source": "/lp-become-a-teacher", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/lp-become-a-teacher.html", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/children-courses", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/children-courses.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/how-to-register-or-enroll-in-a-course", "destination": "/courses", "permanent": true }, { "source": "/how-to-register-or-enroll-in-a-course.html", "destination": "/courses", "permanent": true }, { "source": "/payment-method-details", "destination": "/courses", "permanent": true }, { "source": "/payment-method-details.html", "destination": "/courses", "permanent": true }, { "source": "/learn-page", "destination": "/dashboard/my-courses", "permanent": true }, { "source": "/learn-page.html", "destination": "/dashboard/my-courses", "permanent": true }, { "source": "/pre-k", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/pre-k.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/kindergarten-1", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/kindergarten-1.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/kindergarten-2", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/kindergarten-2.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k1-group1-stage1-lesson1", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k1-group1-stage1-lesson1.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k2-stage4-lesson1", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k2-stage4-lesson1.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k2-stage4-lesson2", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/k2-stage4-lesson2.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/letter-s", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/letter-s.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/sounds-in-a-park", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/sounds-in-a-park.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/course/jolly-phonics-intensive-course", "destination": "/courses/teaching-english-jolly-phonics", "permanent": true }, { "source": "/courses/jolly-phonics-intensive-course", "destination": "/courses/teaching-english-jolly-phonics", "permanent": true }, { "source": "/course/teaching-of-english-through-jolly-phonics", "destination": "/courses/teaching-english-jolly-phonics", "permanent": true }, { "source": "/courses/teaching-of-english-through-jolly-phonics", "destination": "/courses/teaching-english-jolly-phonics", "permanent": true }, { "source": "/course/teaching-of-english-through-jolly-phonics-free-version", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "permanent": true }, { "source": "/courses/teaching-of-english-through-jolly-phonics-free-version", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "permanent": true }, { "source": "/course/preschool-professional", "destination": "/courses/preschool-professional", "permanent": true }, { "source": "/course/pre-k-crash-course", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/courses/pre-k-crash-course", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/course/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/courses/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/course/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/courses/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/course/complete-course-3-years", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/courses/complete-course-3-years", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/course/ecce-and-montessori-course", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/courses/ecce-and-montessori-course", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/course/stem-and-steam-for-teachers", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/courses/stem-and-steam-for-teachers", "destination": "/courses?category=teacher-courses", "permanent": true }, { "source": "/courses/biology", "destination": "/courses", "permanent": true }, { "source": "/courses/informatic-course", "destination": "/courses", "permanent": true }, { "source": "/courses/swimming", "destination": "/courses", "permanent": true }, { "source": "/courses/tennis-practice", "destination": "/courses", "permanent": true }, { "source": "/our-shop", "destination": "/shop", "permanent": true }, { "source": "/our-shop/:path*", "destination": "/shop", "permanent": true }, { "source": "/shop-now", "destination": "/shop", "permanent": true }, { "source": "/shop-now/:path*", "destination": "/shop", "permanent": true }, { "source": "/school-shop", "destination": "/shop", "permanent": true }, { "source": "/school-shop.html", "destination": "/shop", "permanent": true }, { "source": "/product/jolly-phonics-blends-wheels", "destination": "/shop/blends-wheels-pack-of-10", "permanent": true }, { "source": "/product/jolly-phonics-blends-wheel-single-unit", "destination": "/shop/blends-wheels-single-unit", "permanent": true }, { "source": "/product/finger-phonics", "destination": "/shop/finger-phonics-books-1-7-set-hardback", "permanent": true }, { "source": "/product/finger-phonics-big-books", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-1", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-2", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-3", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-4", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-5", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-6", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-big-book-7", "destination": "/shop/finger-phonics-big-books-1-7-set", "permanent": true }, { "source": "/product/finger-phonics-book-1", "destination": "/shop/finger-phonics-book-1", "permanent": true }, { "source": "/product/finger-phonics-book-2", "destination": "/shop/finger-phonics-book-2", "permanent": true }, { "source": "/product/finger-phonics-book-3", "destination": "/shop/finger-phonics-book-3", "permanent": true }, { "source": "/product/finger-phonics-book-4", "destination": "/shop/finger-phonics-book-4", "permanent": true }, { "source": "/product/finger-phonics-book-5", "destination": "/shop/finger-phonics-book-5", "permanent": true }, { "source": "/product/finger-phonics-book-6", "destination": "/shop/finger-phonics-book-6", "permanent": true }, { "source": "/product/finger-phonics-book-7", "destination": "/shop/finger-phonics-book-7", "permanent": true }, { "source": "/product/jolly-phonics-teachers-book", "destination": "/shop/jolly-phonics-teachers-book-coloured", "permanent": true }, { "source": "/product/jolly-phonics-teachers-book-black-white-edition", "destination": "/shop/jolly-phonics-teachers-book-black-white", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-1", "destination": "/shop/jp-pupil-book-1-colour", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-2", "destination": "/shop/jp-pupil-book-2-colour", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-3", "destination": "/shop/jp-pupil-book-3-colour", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-1-black-white-edition", "destination": "/shop/jp-pupil-book-1-black-white", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-2-black-white-edition", "destination": "/shop/jp-pupil-book-2-black-white", "permanent": true }, { "source": "/product/jolly-phonics-workbooks", "destination": "/shop/jp-workbooks-set-1-7", "permanent": true }, { "source": "/product/jolly-phonics-workbook-1", "destination": "/shop/jp-workbook-1", "permanent": true }, { "source": "/product/jolly-phonics-workbook-2", "destination": "/shop/jp-workbook-2", "permanent": true }, { "source": "/product/jolly-phonics-workbook-3", "destination": "/shop/jp-workbook-3", "permanent": true }, { "source": "/product/jolly-phonics-workbook-4", "destination": "/shop/jp-workbook-4", "permanent": true }, { "source": "/product/jolly-phonics-workbook-5", "destination": "/shop/jp-workbook-5", "permanent": true }, { "source": "/product/jolly-phonics-workbook-6", "destination": "/shop/jp-workbook-6", "permanent": true }, { "source": "/product/jolly-phonics-workbook-7", "destination": "/shop/jp-workbook-7", "permanent": true }, { "source": "/product/jolly-phonics-activity-books", "destination": "/shop/jolly-phonics-activity-books-1-7-complete-set-new", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-1", "destination": "/shop/jolly-phonics-activity-book-1", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-2", "destination": "/shop/jolly-phonics-activity-book-2", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-3", "destination": "/shop/jolly-phonics-activity-book-3-new", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-4", "destination": "/shop/jolly-phonics-activity-book-4-new", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-5", "destination": "/shop/jolly-phonics-activity-book-5-new", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-6", "destination": "/shop/jolly-phonics-activity-book-6-new", "permanent": true }, { "source": "/product/jolly-phonics-activity-book-7", "destination": "/shop/jolly-phonics-activity-book-7-new", "permanent": true }, { "source": "/product/the-phonics-handbook", "destination": "/shop/the-phonics-handbook", "permanent": true }, { "source": "/product/jolly-phonics-handbook", "destination": "/shop/the-phonics-handbook", "permanent": true }, { "source": "/product/jolly-phonics-word-book", "destination": "/shop/word-book", "permanent": true }, { "source": "/product/my-word-book", "destination": "/shop/word-book", "permanent": true }, { "source": "/product/jolly-songs-book-and-cd", "destination": "/shop/jolly-songs", "permanent": true }, { "source": "/product/jolly-songs-big-book-and-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-wall-frieze", "destination": "/shop/wall-frieze-pack-of-7-strips", "permanent": true }, { "source": "/product/jolly-phonics-wall-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "permanent": true }, { "source": "/product/jolly-phonics-letter-sound-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "permanent": true }, { "source": "/product/jolly-phonics-tricky-words-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "permanent": true }, { "source": "/product/jolly-phonics-tricky-words-wall-flowers", "destination": "/shop/jolly-phonics-tricky-word-wall-flowers", "permanent": true }, { "source": "/product/jolly-phonics-alternative-spelling-and-alphabet-posters", "destination": "/shop/jp-alternative-spelling-alphabet-posters", "permanent": true }, { "source": "/product/jolly-phonics-cards", "destination": "/shop/jolly-phonics-cards-set-of-4-boxes", "permanent": true }, { "source": "/product/jolly-phonics-letter-sound-strips", "destination": "/shop/letter-sound-strips-pack-of-30", "permanent": true }, { "source": "/product/jolly-phonics-letter-sound-strip", "destination": "/shop/letter-sound-strip-single-unit", "permanent": true }, { "source": "/product/jolly-phonics-picture-flash-cards", "destination": "/shop/picture-flash-cards", "permanent": true }, { "source": "/product/jolly-phonics-reading-assessment", "destination": "/shop/reading-assessment", "permanent": true }, { "source": "/product/jolly-phonics-read-and-see-pack-1", "destination": "/shop/read-and-see-pack-1-12-titles", "permanent": true }, { "source": "/product/jolly-phonics-read-and-see-pack-2", "destination": "/shop/read-and-see-pack-2-12-titles", "permanent": true }, { "source": "/product/jolly-phonics-bumper-book", "destination": "/shop/bumper-book", "permanent": true }, { "source": "/product/jolly-phonics-starter-kit-with-dvd-extended", "destination": "/shop/starter-kit-revised-no-dvd", "permanent": true }, { "source": "/product/jolly-phonics-classroom-kit", "destination": "/shop/jolly-phonics-classroom-kit", "permanent": true }, { "source": "/product/jolly-phonics-classroom-kit-plus", "destination": "/shop/jolly-phonics-classroom-kit", "permanent": true }, { "source": "/product/phonics-class-set", "destination": "/shop/phonics-class-set", "permanent": true }, { "source": "/product/jolly-stories", "destination": "/shop/jolly-stories", "permanent": true }, { "source": "/product/jolly-plays", "destination": "/shop/jolly-plays", "permanent": true }, { "source": "/product/my-first-letter-sounds", "destination": "/shop/my-first-letter-sounds", "permanent": true }, { "source": "/product/jolly-dictionary", "destination": "/shop/jolly-dictionary", "permanent": true }, { "source": "/product/grammar-songs-book-and-cd", "destination": "/shop/grammar-songs-book-and-cd", "permanent": true }, { "source": "/product/grammar-1-workbooks", "destination": "/shop/grammar-1-workbooks-set-1-6", "permanent": true }, { "source": "/product/grammar-1-workbook-3", "destination": "/shop/grammar-1-workbooks-set-1-6", "permanent": true }, { "source": "/product/grammar-1-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1", "permanent": true }, { "source": "/product/grammar-2-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2", "permanent": true }, { "source": "/product/grammar-3-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3", "permanent": true }, { "source": "/product/grammar-4-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4", "permanent": true }, { "source": "/product/grammar-5-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5", "permanent": true }, { "source": "/product/grammar-6-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6", "permanent": true }, { "source": "/product/grammar-1-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/grammar-2-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/grammar-3-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/grammar-4-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/grammar-5-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/grammar-6-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-comprehension-and-creative-writing-teachers-book1", "destination": "/shop/jolly-literacy-comprehension-creative-writing-teachers-book-1", "permanent": true }, { "source": "/product/jolly-literacycomprehension-pupil-book-1", "destination": "/shop/jolly-literacy-comprehension-pupil-book-1", "permanent": true }, { "source": "/product/jolly-literacy-creative-writing-workbook-1", "destination": "/shop/jolly-literacy-creative-writing-workbook-1", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-and-punctuation-pupils-book1", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-2-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-3-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-4-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-5-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-6-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-1-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-2-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-3-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-4-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-5-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-6-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation", "permanent": true }, { "source": "/product/jolly-phonics-readers-nonfiction-red-level-pack-of-6", "destination": "/shop/level-1-non-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-general-fiction-red-level-pack-of-6", "destination": "/shop/level-1-general-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-inky-friends-red-level-pack-of-6", "destination": "/shop/level-1-inky-and-friends-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-nonfiction-yellow-level-pack-of-6", "destination": "/shop/level-2-non-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-general-fiction-yellow-level-pack-of-6", "destination": "/shop/level-2-general-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-inky-friends-yellow-level-pack-of-6", "destination": "/shop/level-2-inky-and-friends-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-nonfiction-green-level-pack-of-6", "destination": "/shop/level-3-non-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-general-fiction-green-level-pack-of-6", "destination": "/shop/level-3-general-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-inky-friends-green-level-pack-of-6", "destination": "/shop/level-3-inky-and-friends-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-nonfiction-blue-level-pack-of-6", "destination": "/shop/level-4-non-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-general-fiction-blue-level-pack-of-6", "destination": "/shop/level-4-general-fiction-pack-of-6", "permanent": true }, { "source": "/product/jolly-phonics-readers-inky-friends-blue-level-pack-of-6", "destination": "/shop/level-4-inky-and-friends-pack-of-6", "permanent": true }, { "source": "/product/jolly-readers-inky-friends-level-1-complete-18", "destination": "/shop/level-1-red-readers-complete-set-pack-of-18", "permanent": true }, { "source": "/product/jolly-readers-level-2-complete-set-pack-of-18", "destination": "/shop/level-2-yellow-readers-complete-set", "permanent": true }, { "source": "/product/jolly-readers-level-3-complete-set-pack-of-18", "destination": "/shop/level-3-green-readers-complete-set", "permanent": true }, { "source": "/product/jolly-readers-level-4-complete-set-pack-of-18", "destination": "/shop/level-4-blue-readers-complete-set", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-1-pack-of-3", "destination": "/shop/orange-level-readers-set-1-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-2-pack-of-3", "destination": "/shop/orange-level-readers-set-2-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-3-pack-of-3", "destination": "/shop/orange-level-readers-set-3-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-4-pack-of-3", "destination": "/shop/orange-level-readers-set-4-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-5-pack-of-3", "destination": "/shop/orange-level-readers-set-5-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-6-pack-of-3", "destination": "/shop/orange-level-readers-set-6-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-set-7-pack-of-3", "destination": "/shop/orange-level-readers-set-7-pack-of-3", "permanent": true }, { "source": "/product/jolly-phonics-readers-orange-level-complete-set-pack-of-21", "destination": "/shop/orange-level-complete-set-pack-of-21", "permanent": true }, { "source": "/product/little-word-books", "destination": "/shop/little-word-books-complete-set-14-books", "permanent": true }, { "source": "/product/little-word-books-3", "destination": "/shop/little-word-books-complete-set-14-books", "permanent": true }, { "source": "/product/our-world-readers", "destination": "/shop/our-world-purple-readers-complete-set", "permanent": true }, { "source": "/product/our-world-readers-blue-level-4", "destination": "/shop/our-world-blue-readers-complete-set", "permanent": true }, { "source": "/product/our-world-readers-green-level-3", "destination": "/shop/our-world-green-readers-complete-set", "permanent": true }, { "source": "/product/jolly-phonics-our-world-readers-yellow-level-2-6-books", "destination": "/shop/our-world-yellow-readers-complete-set", "permanent": true }, { "source": "/product/jolly-phonics-our-world-readers-red-level-1-6-books", "destination": "/shop/our-world-red-readers-complete-set", "permanent": true }, { "source": "/product/folktales-readers-level-1-complete-set-6-books", "destination": "/shop/level-1-folk-tale-readers-pack-of-6", "permanent": true }, { "source": "/product/folktales-readers-level-2-complete-set-6-books", "destination": "/shop/level-2-folk-tale-readers-pack-of-6", "permanent": true }, { "source": "/product/folktales-readers-level-3-complete-set-6-books", "destination": "/shop/level-3-folk-tale-readers-pack-of-6", "permanent": true }, { "source": "/product/folktales-readers-level-4-complete-set-6-books", "destination": "/shop/level-4-folk-tale-readers-pack-of-6", "permanent": true }, { "source": "/product/folktales-readers-level-5-complete-set-6-books", "destination": "/shop/level-5-folk-tale-readers-pack-of-6", "permanent": true }, { "source": "/product/fun-phonics", "destination": "/shop/fun-phonics-pack", "permanent": true }, { "source": "/product/fun-phonics-pack-2", "destination": "/shop/fun-phonics-pack-2", "permanent": true }, { "source": "/product/fun-phonics-pack-1-edition-2025", "destination": "/shop/fun-phonics-pack-edition-2025", "permanent": true }, { "source": "/product/fun-phonics-yellow-readers-pack-of-three", "destination": "/shop/fun-phonics-yellow-readers-pack-of-three", "permanent": true }, { "source": "/product/fun-phonics-orange-readers-pack-of-three", "destination": "/shop/fun-phonics-orange-readers-pack-of-three", "permanent": true }, { "source": "/product/sounds-like-fun-dvd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-for-the-whiteboard", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-for-the-whiteboard-site-license-in-print-letters", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-games-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-games-cd-site-licence", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-dvd-pal", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-resources-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-puppets", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-tricky-word-hat", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-magnetic-letters", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-extra", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-extra-personal-edition", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/my-jolly-phonics-home-kit", "destination": "/shop?collection=jolly-learning&category=kits", "permanent": true }, { "source": "/product/the-grammar-1-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/the-grammar-2-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/the-grammar-3-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/the-grammar-4-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/the-grammar-5-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/the-grammar-6-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/jolly-grammar-big-book-1", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/jolly-grammar-big-book-2", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/grammar-games-cd-single-user", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product/jolly-jingles-book-and-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product/jolly-phonics-pupil-book-teachers-book", "destination": "/shop?collection=jolly-learning&category=pupil-books", "permanent": true }, { "source": "/product/fun-phonics-readers", "destination": "/shop?collection=phonics-club&category=readers", "permanent": true }, { "source": "/product/:slug.html", "destination": "/shop", "permanent": true }, { "source": "/product/:path*", "destination": "/shop", "permanent": true }, { "source": "/product-category/jolly-phonics/:path*", "destination": "/shop?collection=jolly-learning", "permanent": true }, { "source": "/product-category/jolly-grammar/:path*", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product-category/readers/:path*", "destination": "/trainings", "permanent": true }, { "source": "/product-category/school-packs/:path*", "destination": "/shop?collection=jolly-learning&category=kits", "permanent": true }, { "source": "/product-category/classroom-kits-and-sets", "destination": "/shop?collection=jolly-learning&category=kits", "permanent": true }, { "source": "/product-category/pupil-books-coloured", "destination": "/shop?collection=jolly-learning&category=pupil-books", "permanent": true }, { "source": "/product-category/pupil-books-black-and-white", "destination": "/shop?collection=jolly-learning&category=pupil-books", "permanent": true }, { "source": "/product-category/jolly-phonics/jolly-phonic-workbooks", "destination": "/shop?collection=jolly-learning&category=workbooks", "permanent": true }, { "source": "/product-category/jolly-phonics/jolly-phonics-activity-books-with-sticker-sheets", "destination": "/shop?collection=jolly-learning&category=activity-books", "permanent": true }, { "source": "/product-category/jolly-phonics/teachers-resource-materials", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product-category/teachers-resource-materials", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "permanent": true }, { "source": "/product-category/grammar-pupil-book", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "permanent": true }, { "source": "/product-category/grammar-teachers-book", "destination": "/shop?collection=jolly-learning&category=teachers-books", "permanent": true }, { "source": "/product-category/jolly-grammar/grammar-pupil-book", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "permanent": true }, { "source": "/product-category/jolly-grammar/grammar-teachers-book", "destination": "/shop?collection=jolly-learning&category=teachers-books", "permanent": true }, { "source": "/product-category/jolly-grammar/grammar-workbooks-set", "destination": "/shop?collection=jolly-learning&category=grammar-workbooks", "permanent": true }, { "source": "/product-category/jolly-grammar/jolly-literacy", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "permanent": true }, { "source": "/product-category/jolly-grammar/jolly-grammar-big-book", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product-category/jolly-grammar/the-grammar-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "permanent": true }, { "source": "/product-category/our-world-readers-2", "destination": "/trainings", "permanent": true }, { "source": "/product-category/jolly-dictionary", "destination": "/shop/jolly-dictionary", "permanent": true }, { "source": "/product-category/:path*", "destination": "/shop?collection=jolly-learning", "permanent": true }, { "source": "/noc", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/noc/:path*", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/noc-of-jolly-learning-books", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/noc-of-jolly-learning-books/:path*", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/noc-jolly-learning-books-pctb", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/noc-jolly-learning-books-pctb.html", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/free-resources", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/free-resources.html", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true }, { "source": "/login-register", "destination": "/auth/login", "permanent": true }, { "source": "/login-register/:path*", "destination": "/auth/login", "permanent": true }, { "source": "/login", "destination": "/auth/login", "permanent": true }, { "source": "/login.html", "destination": "/auth/login", "permanent": true }, { "source": "/register", "destination": "/auth/signup", "permanent": true }, { "source": "/register.html", "destination": "/auth/signup", "permanent": true }, { "source": "/my-account", "destination": "/dashboard", "permanent": true }, { "source": "/my-account/:path*", "destination": "/dashboard", "permanent": true }, { "source": "/lp-profile", "destination": "/dashboard", "permanent": true }, { "source": "/lp-profile.html", "destination": "/dashboard", "permanent": true }, { "source": "/dashboard.html", "destination": "/dashboard", "permanent": true }, { "source": "/student-registration", "destination": "/auth/signup", "permanent": true }, { "source": "/student-registration.html", "destination": "/auth/signup", "permanent": true }, { "source": "/instructor-registration", "destination": "/auth/signup", "permanent": true }, { "source": "/instructor-registration.html", "destination": "/auth/signup", "permanent": true }, { "source": "/password-reset", "destination": "/auth/forgot-password", "permanent": true }, { "source": "/password-reset.html", "destination": "/auth/forgot-password", "permanent": true }, { "source": "/lp-checkout", "destination": "/checkout", "permanent": true }, { "source": "/lp-checkout.html", "destination": "/checkout", "permanent": true }, { "source": "/wp-login.php", "destination": "/auth/login", "permanent": true }, { "source": "/wp-admin", "destination": "/auth/login", "permanent": true }, { "source": "/wp-admin/:path*", "destination": "/auth/login", "permanent": true }, { "source": "/blog-1", "destination": "/blog", "permanent": true }, { "source": "/blog-1.html", "destination": "/blog", "permanent": true }, { "source": "/blog-2", "destination": "/blog", "permanent": true }, { "source": "/blog-2.html", "destination": "/blog", "permanent": true }, { "source": "/blog-3", "destination": "/blog", "permanent": true }, { "source": "/blog-3.html", "destination": "/blog", "permanent": true }, { "source": "/blog-4", "destination": "/blog", "permanent": true }, { "source": "/blog-4.html", "destination": "/blog", "permanent": true }, { "source": "/teaching-children-to-read-or-a-fight-against-illiteracy", "destination": "/blog", "permanent": true }, { "source": "/teaching-children-to-read-or-a-fight-against-illiteracy.html", "destination": "/blog", "permanent": true }, { "source": "/teaching-of-urdu-as-a-second-language", "destination": "/blog", "permanent": true }, { "source": "/teaching-of-urdu-as-a-second-language.html", "destination": "/blog", "permanent": true }, { "source": "/learn-english-online", "destination": "/courses", "permanent": true }, { "source": "/learn-english-online.html", "destination": "/courses", "permanent": true }, { "source": "/reading-and-writing-through-synthetic-phonics", "destination": "/blog", "permanent": true }, { "source": "/reading-and-writing-through-synthetic-phonics.html", "destination": "/blog", "permanent": true }, { "source": "/reading-and-writing-problems", "destination": "/blog", "permanent": true }, { "source": "/reading-and-writing-problems.html", "destination": "/blog", "permanent": true }, { "source": "/category/workshop/:path*", "destination": "/trainings", "permanent": true }, { "source": "/category/:path*", "destination": "/blog", "permanent": true }, { "source": "/tag/:path*", "destination": "/blog", "permanent": true }, { "source": "/:year(\\d{4})/:month(\\d{1,2})/:day(\\d{1,2})/:slug", "destination": "/blog", "permanent": true }, { "source": "/:year(\\d{4})/:month(\\d{1,2})/:slug", "destination": "/blog", "permanent": true }, { "source": "/jumping-for-jolly", "destination": "/about", "permanent": true }, { "source": "/jumping-for-jolly.html", "destination": "/about", "permanent": true }, { "source": "/parents-corner", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/parents-corner.html", "destination": "/courses?category=children-courses", "permanent": true }, { "source": "/post-a-job", "destination": "/contact", "permanent": true }, { "source": "/post-a-job.html", "destination": "/contact", "permanent": true }, { "source": "/job-dashboard", "destination": "/contact", "permanent": true }, { "source": "/job-dashboard.html", "destination": "/contact", "permanent": true }, { "source": "/jobs", "destination": "/contact", "permanent": true }, { "source": "/jobs.html", "destination": "/contact", "permanent": true }, { "source": "/questions", "destination": "/faqs", "permanent": true }, { "source": "/questions.html", "destination": "/faqs", "permanent": true }, { "source": "/questions/:path*", "destination": "/faqs", "permanent": true }, { "source": "/forums/:path*", "destination": "/faqs", "permanent": true }, { "source": "/forum/:path*", "destination": "/faqs", "permanent": true }, { "source": "/", "destination": "/", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2" }] }, { "source": "/", "destination": "/", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "13" }] }, { "source": "/", "destination": "/contact", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "244" }] }, { "source": "/", "destination": "/", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "386" }] }, { "source": "/", "destination": "/contact", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "444" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "492" }] }, { "source": "/", "destination": "/trainings", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "550" }] }, { "source": "/", "destination": "/blog", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "612" }] }, { "source": "/", "destination": "/faqs", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "632" }] }, { "source": "/", "destination": "/faqs", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2824" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2838" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2852" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2861" }] }, { "source": "/", "destination": "/shop", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2871" }] }, { "source": "/", "destination": "/trainings", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2883" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2897" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2906" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2928" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2935" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2941" }] }, { "source": "/", "destination": "/consultancy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2956" }] }, { "source": "/", "destination": "/consultancy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2960" }] }, { "source": "/", "destination": "/consultancy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2973" }] }, { "source": "/", "destination": "/consultancy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2985" }] }, { "source": "/", "destination": "/trainings", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "2994" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3014" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3020" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3028" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3036" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3058" }] }, { "source": "/", "destination": "/trainings", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3107" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3120" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3123" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3127" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3133" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3138" }] }, { "source": "/", "destination": "/blog/jolly-phonics-2017-training-video", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3253" }] }, { "source": "/", "destination": "/consultancy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3265" }] }, { "source": "/", "destination": "/about", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3274" }] }, { "source": "/", "destination": "/contact", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3319" }] }, { "source": "/", "destination": "/research", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3374" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3400" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3413" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3739" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3760" }] }, { "source": "/", "destination": "/terms", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "3843" }] }, { "source": "/", "destination": "/blog/noc-jolly-learning-books-pctb", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "4016" }] }, { "source": "/", "destination": "/privacy", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "4391" }] }, { "source": "/", "destination": "/refunds", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "35649" }] }, { "source": "/", "destination": "/shop", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "35769" }] }, { "source": "/", "destination": "/certified-trainers", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "35868" }] }, { "source": "/", "destination": "/checkout", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37753" }] }, { "source": "/", "destination": "/dashboard", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37754" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37755" }] }, { "source": "/", "destination": "/courses?category=teacher-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37756" }] }, { "source": "/", "destination": "/terms", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37757" }] }, { "source": "/", "destination": "/dashboard", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37968" }] }, { "source": "/", "destination": "/auth/signup", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37969" }] }, { "source": "/", "destination": "/auth/signup", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "37970" }] }, { "source": "/", "destination": "/wishlist", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "39093" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "39726" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "39748" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "39754" }] }, { "source": "/", "destination": "/certified-trainers", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "40227" }] }, { "source": "/", "destination": "/certified-trainers", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "40228" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "40593" }] }, { "source": "/", "destination": "/auth/forgot-password", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "40594" }] }, { "source": "/", "destination": "/dashboard/my-courses", "permanent": true, "has": [{ "type": "query", "key": "page_id", "value": "40595" }] }, { "source": "/", "destination": "/courses/teaching-english-jolly-phonics", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "37938" }] }, { "source": "/", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "38375" }] }, { "source": "/", "destination": "/courses/preschool-professional", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "38554" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39801" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39802" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39803" }] }, { "source": "/", "destination": "/courses?category=children-courses", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39807" }] }, { "source": "/", "destination": "/blog", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "3641" }] }, { "source": "/", "destination": "/blog", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "3787" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "4337" }] }, { "source": "/", "destination": "/trainings", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "4380" }] }, { "source": "/", "destination": "/blog", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "35633" }] }, { "source": "/", "destination": "/blog", "permanent": true, "has": [{ "type": "query", "key": "p", "value": "35883" }] }, { "source": "/", "destination": "/shop", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "product" }] }, { "source": "/", "destination": "/courses", "permanent": true, "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }] }] };
var BuildId = "h1B5lt2WkyBkgb2MV5LPQ";
var HtmlPages = [];
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }, { "source": "/home", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/home(?:/)?$" }, { "source": "/home/:path*", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/home(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/phonics-club", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/phonics-club(?:/)?$" }, { "source": "/phonics-club.html", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/phonics-club\\.html(?:/)?$" }, { "source": "/main", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/main(?:/)?$" }, { "source": "/main.html", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/main\\.html(?:/)?$" }, { "source": "/sample-page", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/sample-page(?:/)?$" }, { "source": "/sample-page.html", "destination": "/", "statusCode": 308, "regex": "^(?!/_next)/sample-page\\.html(?:/)?$" }, { "source": "/about-us", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/about-us(?:/)?$" }, { "source": "/about-us.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/about-us\\.html(?:/)?$" }, { "source": "/our-team", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/our-team(?:/)?$" }, { "source": "/our-team.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/our-team\\.html(?:/)?$" }, { "source": "/team", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/team(?:/)?$" }, { "source": "/team.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/team\\.html(?:/)?$" }, { "source": "/history", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/history(?:/)?$" }, { "source": "/history.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/history\\.html(?:/)?$" }, { "source": "/what-we-do", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/what-we-do(?:/)?$" }, { "source": "/what-we-do.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/what-we-do\\.html(?:/)?$" }, { "source": "/services", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/services(?:/)?$" }, { "source": "/services.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/services\\.html(?:/)?$" }, { "source": "/our-services", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/our-services(?:/)?$" }, { "source": "/our-services.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/our-services\\.html(?:/)?$" }, { "source": "/contact-us", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/contact-us(?:/)?$" }, { "source": "/contact-us.html", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/contact-us\\.html(?:/)?$" }, { "source": "/faq", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/faq(?:/)?$" }, { "source": "/faq.html", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/faq\\.html(?:/)?$" }, { "source": "/privacy-policy", "destination": "/privacy", "statusCode": 308, "regex": "^(?!/_next)/privacy-policy(?:/)?$" }, { "source": "/privacy-policy.html", "destination": "/privacy", "statusCode": 308, "regex": "^(?!/_next)/privacy-policy\\.html(?:/)?$" }, { "source": "/privacy-policy-of-phonicsclub-app", "destination": "/privacy", "statusCode": 308, "regex": "^(?!/_next)/privacy-policy-of-phonicsclub-app(?:/)?$" }, { "source": "/privacy-policy-of-phonicsclub-app.html", "destination": "/privacy", "statusCode": 308, "regex": "^(?!/_next)/privacy-policy-of-phonicsclub-app\\.html(?:/)?$" }, { "source": "/terms-and-conditions", "destination": "/terms", "statusCode": 308, "regex": "^(?!/_next)/terms-and-conditions(?:/)?$" }, { "source": "/terms-and-conditions.html", "destination": "/terms", "statusCode": 308, "regex": "^(?!/_next)/terms-and-conditions\\.html(?:/)?$" }, { "source": "/refund-policy", "destination": "/refunds", "statusCode": 308, "regex": "^(?!/_next)/refund-policy(?:/)?$" }, { "source": "/refund-policy.html", "destination": "/refunds", "statusCode": 308, "regex": "^(?!/_next)/refund-policy\\.html(?:/)?$" }, { "source": "/shipping-policy", "destination": "/shipping", "statusCode": 308, "regex": "^(?!/_next)/shipping-policy(?:/)?$" }, { "source": "/shipping-policy.html", "destination": "/shipping", "statusCode": 308, "regex": "^(?!/_next)/shipping-policy\\.html(?:/)?$" }, { "source": "/cookies-policy", "destination": "/cookies", "statusCode": 308, "regex": "^(?!/_next)/cookies-policy(?:/)?$" }, { "source": "/cookies-policy.html", "destination": "/cookies", "statusCode": 308, "regex": "^(?!/_next)/cookies-policy\\.html(?:/)?$" }, { "source": "/feedback", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/feedback(?:/)?$" }, { "source": "/feedback.html", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/feedback\\.html(?:/)?$" }, { "source": "/testimonials", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/testimonials(?:/)?$" }, { "source": "/testimonials.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/testimonials\\.html(?:/)?$" }, { "source": "/gallery", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/gallery(?:/)?$" }, { "source": "/gallery.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/gallery\\.html(?:/)?$" }, { "source": "/phonics-club-gallery", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/phonics-club-gallery(?:/)?$" }, { "source": "/phonics-club-gallery.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/phonics-club-gallery\\.html(?:/)?$" }, { "source": "/videos", "destination": "/blog/jolly-phonics-2017-training-video", "statusCode": 308, "regex": "^(?!/_next)/videos(?:/)?$" }, { "source": "/videos.html", "destination": "/blog/jolly-phonics-2017-training-video", "statusCode": 308, "regex": "^(?!/_next)/videos\\.html(?:/)?$" }, { "source": "/research-in-pakistan", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/research-in-pakistan(?:/)?$" }, { "source": "/research-in-pakistan.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/research-in-pakistan\\.html(?:/)?$" }, { "source": "/pilot-study-1", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-1(?:/)?$" }, { "source": "/pilot-study-1.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-1\\.html(?:/)?$" }, { "source": "/pilot-study-2", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-2(?:/)?$" }, { "source": "/pilot-study-2.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-2\\.html(?:/)?$" }, { "source": "/pilot-study-3", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-3(?:/)?$" }, { "source": "/pilot-study-3.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-3\\.html(?:/)?$" }, { "source": "/pilot-study-4", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-4(?:/)?$" }, { "source": "/pilot-study-4.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-4\\.html(?:/)?$" }, { "source": "/education-for-all", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/education-for-all(?:/)?$" }, { "source": "/education-for-all.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/education-for-all\\.html(?:/)?$" }, { "source": "/classroom-strategies", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/classroom-strategies(?:/)?$" }, { "source": "/classroom-strategies.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/classroom-strategies\\.html(?:/)?$" }, { "source": "/language-lab", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/language-lab(?:/)?$" }, { "source": "/language-lab.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/language-lab\\.html(?:/)?$" }, { "source": "/training-sessions-gallery", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/training-sessions-gallery(?:/)?$" }, { "source": "/training-sessions-gallery.html", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/training-sessions-gallery\\.html(?:/)?$" }, { "source": "/student-assessment-gallery", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/student-assessment-gallery(?:/)?$" }, { "source": "/student-assessment-gallery.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/student-assessment-gallery\\.html(?:/)?$" }, { "source": "/roshni-maktab-gallery", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/roshni-maktab-gallery(?:/)?$" }, { "source": "/roshni-maktab-gallery.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/roshni-maktab-gallery\\.html(?:/)?$" }, { "source": "/pilot-study-1-gallery", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-1-gallery(?:/)?$" }, { "source": "/pilot-study-1-gallery.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-1-gallery\\.html(?:/)?$" }, { "source": "/pilot-study-4-gallery", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-4-gallery(?:/)?$" }, { "source": "/pilot-study-4-gallery.html", "destination": "/research", "statusCode": 308, "regex": "^(?!/_next)/pilot-study-4-gallery\\.html(?:/)?$" }, { "source": "/training", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/training(?:/)?$" }, { "source": "/training/:path*", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/training(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/trainings-events", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/trainings-events(?:/)?$" }, { "source": "/trainings-events/:path*", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/trainings-events(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/readers", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/readers(?:/)?$" }, { "source": "/readers/:path*", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/readers(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/workshops", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/workshops(?:/)?$" }, { "source": "/workshops.html", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/workshops\\.html(?:/)?$" }, { "source": "/learn-english-through-jolly-phonics-workshop", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/learn-english-through-jolly-phonics-workshop(?:/)?$" }, { "source": "/learn-english-through-jolly-phonics-workshop.html", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/learn-english-through-jolly-phonics-workshop\\.html(?:/)?$" }, { "source": "/jolly-phonics-certified-trainers", "destination": "/certified-trainers", "statusCode": 308, "regex": "^(?!/_next)/jolly-phonics-certified-trainers(?:/)?$" }, { "source": "/jolly-phonics-certified-trainers.html", "destination": "/certified-trainers", "statusCode": 308, "regex": "^(?!/_next)/jolly-phonics-certified-trainers\\.html(?:/)?$" }, { "source": "/affiliation", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/affiliation(?:/)?$" }, { "source": "/affiliation.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/affiliation\\.html(?:/)?$" }, { "source": "/campus-affiliation", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/campus-affiliation(?:/)?$" }, { "source": "/campus-affiliation.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/campus-affiliation\\.html(?:/)?$" }, { "source": "/individual-affiliation", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/individual-affiliation(?:/)?$" }, { "source": "/individual-affiliation.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/individual-affiliation\\.html(?:/)?$" }, { "source": "/school-zone", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/school-zone(?:/)?$" }, { "source": "/school-zone.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/school-zone\\.html(?:/)?$" }, { "source": "/education-zone", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/education-zone(?:/)?$" }, { "source": "/education-zone.html", "destination": "/consultancy", "statusCode": 308, "regex": "^(?!/_next)/education-zone\\.html(?:/)?$" }, { "source": "/course", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/course(?:/)?$" }, { "source": "/course.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/course\\.html(?:/)?$" }, { "source": "/online-courses", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/online-courses(?:/)?$" }, { "source": "/online-courses.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/online-courses\\.html(?:/)?$" }, { "source": "/courses-online", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses-online(?:/)?$" }, { "source": "/courses-online.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses-online\\.html(?:/)?$" }, { "source": "/lp-courses", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/lp-courses(?:/)?$" }, { "source": "/lp-courses.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/lp-courses\\.html(?:/)?$" }, { "source": "/lp-become-a-teacher", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/lp-become-a-teacher(?:/)?$" }, { "source": "/lp-become-a-teacher.html", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/lp-become-a-teacher\\.html(?:/)?$" }, { "source": "/children-courses", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/children-courses(?:/)?$" }, { "source": "/children-courses.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/children-courses\\.html(?:/)?$" }, { "source": "/how-to-register-or-enroll-in-a-course", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/how-to-register-or-enroll-in-a-course(?:/)?$" }, { "source": "/how-to-register-or-enroll-in-a-course.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/how-to-register-or-enroll-in-a-course\\.html(?:/)?$" }, { "source": "/payment-method-details", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/payment-method-details(?:/)?$" }, { "source": "/payment-method-details.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/payment-method-details\\.html(?:/)?$" }, { "source": "/learn-page", "destination": "/dashboard/my-courses", "statusCode": 308, "regex": "^(?!/_next)/learn-page(?:/)?$" }, { "source": "/learn-page.html", "destination": "/dashboard/my-courses", "statusCode": 308, "regex": "^(?!/_next)/learn-page\\.html(?:/)?$" }, { "source": "/pre-k", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/pre-k(?:/)?$" }, { "source": "/pre-k.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/pre-k\\.html(?:/)?$" }, { "source": "/kindergarten-1", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/kindergarten-1(?:/)?$" }, { "source": "/kindergarten-1.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/kindergarten-1\\.html(?:/)?$" }, { "source": "/kindergarten-2", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/kindergarten-2(?:/)?$" }, { "source": "/kindergarten-2.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/kindergarten-2\\.html(?:/)?$" }, { "source": "/k1-group1-stage1-lesson1", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k1-group1-stage1-lesson1(?:/)?$" }, { "source": "/k1-group1-stage1-lesson1.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k1-group1-stage1-lesson1\\.html(?:/)?$" }, { "source": "/k2-stage4-lesson1", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k2-stage4-lesson1(?:/)?$" }, { "source": "/k2-stage4-lesson1.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k2-stage4-lesson1\\.html(?:/)?$" }, { "source": "/k2-stage4-lesson2", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k2-stage4-lesson2(?:/)?$" }, { "source": "/k2-stage4-lesson2.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/k2-stage4-lesson2\\.html(?:/)?$" }, { "source": "/letter-s", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/letter-s(?:/)?$" }, { "source": "/letter-s.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/letter-s\\.html(?:/)?$" }, { "source": "/sounds-in-a-park", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/sounds-in-a-park(?:/)?$" }, { "source": "/sounds-in-a-park.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/sounds-in-a-park\\.html(?:/)?$" }, { "source": "/course/jolly-phonics-intensive-course", "destination": "/courses/teaching-english-jolly-phonics", "statusCode": 308, "regex": "^(?!/_next)/course/jolly-phonics-intensive-course(?:/)?$" }, { "source": "/courses/jolly-phonics-intensive-course", "destination": "/courses/teaching-english-jolly-phonics", "statusCode": 308, "regex": "^(?!/_next)/courses/jolly-phonics-intensive-course(?:/)?$" }, { "source": "/course/teaching-of-english-through-jolly-phonics", "destination": "/courses/teaching-english-jolly-phonics", "statusCode": 308, "regex": "^(?!/_next)/course/teaching-of-english-through-jolly-phonics(?:/)?$" }, { "source": "/courses/teaching-of-english-through-jolly-phonics", "destination": "/courses/teaching-english-jolly-phonics", "statusCode": 308, "regex": "^(?!/_next)/courses/teaching-of-english-through-jolly-phonics(?:/)?$" }, { "source": "/course/teaching-of-english-through-jolly-phonics-free-version", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "statusCode": 308, "regex": "^(?!/_next)/course/teaching-of-english-through-jolly-phonics-free-version(?:/)?$" }, { "source": "/courses/teaching-of-english-through-jolly-phonics-free-version", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "statusCode": 308, "regex": "^(?!/_next)/courses/teaching-of-english-through-jolly-phonics-free-version(?:/)?$" }, { "source": "/course/preschool-professional", "destination": "/courses/preschool-professional", "statusCode": 308, "regex": "^(?!/_next)/course/preschool-professional(?:/)?$" }, { "source": "/course/pre-k-crash-course", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/course/pre-k-crash-course(?:/)?$" }, { "source": "/courses/pre-k-crash-course", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/pre-k-crash-course(?:/)?$" }, { "source": "/course/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/course/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks(?:/)?$" }, { "source": "/courses/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks(?:/)?$" }, { "source": "/course/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/course/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks(?:/)?$" }, { "source": "/courses/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks(?:/)?$" }, { "source": "/course/complete-course-3-years", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/course/complete-course-3-years(?:/)?$" }, { "source": "/courses/complete-course-3-years", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/complete-course-3-years(?:/)?$" }, { "source": "/course/ecce-and-montessori-course", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/course/ecce-and-montessori-course(?:/)?$" }, { "source": "/courses/ecce-and-montessori-course", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/ecce-and-montessori-course(?:/)?$" }, { "source": "/course/stem-and-steam-for-teachers", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/course/stem-and-steam-for-teachers(?:/)?$" }, { "source": "/courses/stem-and-steam-for-teachers", "destination": "/courses?category=teacher-courses", "statusCode": 308, "regex": "^(?!/_next)/courses/stem-and-steam-for-teachers(?:/)?$" }, { "source": "/courses/biology", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses/biology(?:/)?$" }, { "source": "/courses/informatic-course", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses/informatic-course(?:/)?$" }, { "source": "/courses/swimming", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses/swimming(?:/)?$" }, { "source": "/courses/tennis-practice", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/courses/tennis-practice(?:/)?$" }, { "source": "/our-shop", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/our-shop(?:/)?$" }, { "source": "/our-shop/:path*", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/our-shop(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/shop-now", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/shop-now(?:/)?$" }, { "source": "/shop-now/:path*", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/shop-now(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/school-shop", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/school-shop(?:/)?$" }, { "source": "/school-shop.html", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/school-shop\\.html(?:/)?$" }, { "source": "/product/jolly-phonics-blends-wheels", "destination": "/shop/blends-wheels-pack-of-10", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-blends-wheels(?:/)?$" }, { "source": "/product/jolly-phonics-blends-wheel-single-unit", "destination": "/shop/blends-wheels-single-unit", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-blends-wheel-single-unit(?:/)?$" }, { "source": "/product/finger-phonics", "destination": "/shop/finger-phonics-books-1-7-set-hardback", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics(?:/)?$" }, { "source": "/product/finger-phonics-big-books", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-books(?:/)?$" }, { "source": "/product/finger-phonics-big-book-1", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-1(?:/)?$" }, { "source": "/product/finger-phonics-big-book-2", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-2(?:/)?$" }, { "source": "/product/finger-phonics-big-book-3", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-3(?:/)?$" }, { "source": "/product/finger-phonics-big-book-4", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-4(?:/)?$" }, { "source": "/product/finger-phonics-big-book-5", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-5(?:/)?$" }, { "source": "/product/finger-phonics-big-book-6", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-6(?:/)?$" }, { "source": "/product/finger-phonics-big-book-7", "destination": "/shop/finger-phonics-big-books-1-7-set", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-big-book-7(?:/)?$" }, { "source": "/product/finger-phonics-book-1", "destination": "/shop/finger-phonics-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-1(?:/)?$" }, { "source": "/product/finger-phonics-book-2", "destination": "/shop/finger-phonics-book-2", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-2(?:/)?$" }, { "source": "/product/finger-phonics-book-3", "destination": "/shop/finger-phonics-book-3", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-3(?:/)?$" }, { "source": "/product/finger-phonics-book-4", "destination": "/shop/finger-phonics-book-4", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-4(?:/)?$" }, { "source": "/product/finger-phonics-book-5", "destination": "/shop/finger-phonics-book-5", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-5(?:/)?$" }, { "source": "/product/finger-phonics-book-6", "destination": "/shop/finger-phonics-book-6", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-6(?:/)?$" }, { "source": "/product/finger-phonics-book-7", "destination": "/shop/finger-phonics-book-7", "statusCode": 308, "regex": "^(?!/_next)/product/finger-phonics-book-7(?:/)?$" }, { "source": "/product/jolly-phonics-teachers-book", "destination": "/shop/jolly-phonics-teachers-book-coloured", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-teachers-book(?:/)?$" }, { "source": "/product/jolly-phonics-teachers-book-black-white-edition", "destination": "/shop/jolly-phonics-teachers-book-black-white", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-teachers-book-black-white-edition(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-1", "destination": "/shop/jp-pupil-book-1-colour", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-1(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-2", "destination": "/shop/jp-pupil-book-2-colour", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-2(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-3", "destination": "/shop/jp-pupil-book-3-colour", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-3(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-1-black-white-edition", "destination": "/shop/jp-pupil-book-1-black-white", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-1-black-white-edition(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-2-black-white-edition", "destination": "/shop/jp-pupil-book-2-black-white", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-2-black-white-edition(?:/)?$" }, { "source": "/product/jolly-phonics-workbooks", "destination": "/shop/jp-workbooks-set-1-7", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbooks(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-1", "destination": "/shop/jp-workbook-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-1(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-2", "destination": "/shop/jp-workbook-2", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-2(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-3", "destination": "/shop/jp-workbook-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-3(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-4", "destination": "/shop/jp-workbook-4", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-4(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-5", "destination": "/shop/jp-workbook-5", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-5(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-6", "destination": "/shop/jp-workbook-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-6(?:/)?$" }, { "source": "/product/jolly-phonics-workbook-7", "destination": "/shop/jp-workbook-7", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-workbook-7(?:/)?$" }, { "source": "/product/jolly-phonics-activity-books", "destination": "/shop/jolly-phonics-activity-books-1-7-complete-set-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-books(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-1", "destination": "/shop/jolly-phonics-activity-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-1(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-2", "destination": "/shop/jolly-phonics-activity-book-2", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-2(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-3", "destination": "/shop/jolly-phonics-activity-book-3-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-3(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-4", "destination": "/shop/jolly-phonics-activity-book-4-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-4(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-5", "destination": "/shop/jolly-phonics-activity-book-5-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-5(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-6", "destination": "/shop/jolly-phonics-activity-book-6-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-6(?:/)?$" }, { "source": "/product/jolly-phonics-activity-book-7", "destination": "/shop/jolly-phonics-activity-book-7-new", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-activity-book-7(?:/)?$" }, { "source": "/product/the-phonics-handbook", "destination": "/shop/the-phonics-handbook", "statusCode": 308, "regex": "^(?!/_next)/product/the-phonics-handbook(?:/)?$" }, { "source": "/product/jolly-phonics-handbook", "destination": "/shop/the-phonics-handbook", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-handbook(?:/)?$" }, { "source": "/product/jolly-phonics-word-book", "destination": "/shop/word-book", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-word-book(?:/)?$" }, { "source": "/product/my-word-book", "destination": "/shop/word-book", "statusCode": 308, "regex": "^(?!/_next)/product/my-word-book(?:/)?$" }, { "source": "/product/jolly-songs-book-and-cd", "destination": "/shop/jolly-songs", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-songs-book-and-cd(?:/)?$" }, { "source": "/product/jolly-songs-big-book-and-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-songs-big-book-and-cd(?:/)?$" }, { "source": "/product/jolly-phonics-wall-frieze", "destination": "/shop/wall-frieze-pack-of-7-strips", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-wall-frieze(?:/)?$" }, { "source": "/product/jolly-phonics-wall-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-wall-poster(?:/)?$" }, { "source": "/product/jolly-phonics-letter-sound-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-letter-sound-poster(?:/)?$" }, { "source": "/product/jolly-phonics-tricky-words-poster", "destination": "/shop/letter-sound-poster-wall-chart-tricky-words-poster", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-tricky-words-poster(?:/)?$" }, { "source": "/product/jolly-phonics-tricky-words-wall-flowers", "destination": "/shop/jolly-phonics-tricky-word-wall-flowers", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-tricky-words-wall-flowers(?:/)?$" }, { "source": "/product/jolly-phonics-alternative-spelling-and-alphabet-posters", "destination": "/shop/jp-alternative-spelling-alphabet-posters", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-alternative-spelling-and-alphabet-posters(?:/)?$" }, { "source": "/product/jolly-phonics-cards", "destination": "/shop/jolly-phonics-cards-set-of-4-boxes", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-cards(?:/)?$" }, { "source": "/product/jolly-phonics-letter-sound-strips", "destination": "/shop/letter-sound-strips-pack-of-30", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-letter-sound-strips(?:/)?$" }, { "source": "/product/jolly-phonics-letter-sound-strip", "destination": "/shop/letter-sound-strip-single-unit", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-letter-sound-strip(?:/)?$" }, { "source": "/product/jolly-phonics-picture-flash-cards", "destination": "/shop/picture-flash-cards", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-picture-flash-cards(?:/)?$" }, { "source": "/product/jolly-phonics-reading-assessment", "destination": "/shop/reading-assessment", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-reading-assessment(?:/)?$" }, { "source": "/product/jolly-phonics-read-and-see-pack-1", "destination": "/shop/read-and-see-pack-1-12-titles", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-read-and-see-pack-1(?:/)?$" }, { "source": "/product/jolly-phonics-read-and-see-pack-2", "destination": "/shop/read-and-see-pack-2-12-titles", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-read-and-see-pack-2(?:/)?$" }, { "source": "/product/jolly-phonics-bumper-book", "destination": "/shop/bumper-book", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-bumper-book(?:/)?$" }, { "source": "/product/jolly-phonics-starter-kit-with-dvd-extended", "destination": "/shop/starter-kit-revised-no-dvd", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-starter-kit-with-dvd-extended(?:/)?$" }, { "source": "/product/jolly-phonics-classroom-kit", "destination": "/shop/jolly-phonics-classroom-kit", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-classroom-kit(?:/)?$" }, { "source": "/product/jolly-phonics-classroom-kit-plus", "destination": "/shop/jolly-phonics-classroom-kit", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-classroom-kit-plus(?:/)?$" }, { "source": "/product/phonics-class-set", "destination": "/shop/phonics-class-set", "statusCode": 308, "regex": "^(?!/_next)/product/phonics-class-set(?:/)?$" }, { "source": "/product/jolly-stories", "destination": "/shop/jolly-stories", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-stories(?:/)?$" }, { "source": "/product/jolly-plays", "destination": "/shop/jolly-plays", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-plays(?:/)?$" }, { "source": "/product/my-first-letter-sounds", "destination": "/shop/my-first-letter-sounds", "statusCode": 308, "regex": "^(?!/_next)/product/my-first-letter-sounds(?:/)?$" }, { "source": "/product/jolly-dictionary", "destination": "/shop/jolly-dictionary", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-dictionary(?:/)?$" }, { "source": "/product/grammar-songs-book-and-cd", "destination": "/shop/grammar-songs-book-and-cd", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-songs-book-and-cd(?:/)?$" }, { "source": "/product/grammar-1-workbooks", "destination": "/shop/grammar-1-workbooks-set-1-6", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-1-workbooks(?:/)?$" }, { "source": "/product/grammar-1-workbook-3", "destination": "/shop/grammar-1-workbooks-set-1-6", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-1-workbook-3(?:/)?$" }, { "source": "/product/grammar-1-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-1-pupil-book(?:/)?$" }, { "source": "/product/grammar-2-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-2-pupil-book(?:/)?$" }, { "source": "/product/grammar-3-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-3-pupil-book(?:/)?$" }, { "source": "/product/grammar-4-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-4-pupil-book(?:/)?$" }, { "source": "/product/grammar-5-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-5-pupil-book(?:/)?$" }, { "source": "/product/grammar-6-pupil-book", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-6-pupil-book(?:/)?$" }, { "source": "/product/grammar-1-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-1-teachers-book(?:/)?$" }, { "source": "/product/grammar-2-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-2-teachers-book(?:/)?$" }, { "source": "/product/grammar-3-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-3-teachers-book(?:/)?$" }, { "source": "/product/grammar-4-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-4-teachers-book(?:/)?$" }, { "source": "/product/grammar-5-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-5-teachers-book(?:/)?$" }, { "source": "/product/grammar-6-teachers-book", "destination": "/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-6-teachers-book(?:/)?$" }, { "source": "/product/jolly-literacy-comprehension-and-creative-writing-teachers-book1", "destination": "/shop/jolly-literacy-comprehension-creative-writing-teachers-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-comprehension-and-creative-writing-teachers-book1(?:/)?$" }, { "source": "/product/jolly-literacycomprehension-pupil-book-1", "destination": "/shop/jolly-literacy-comprehension-pupil-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacycomprehension-pupil-book-1(?:/)?$" }, { "source": "/product/jolly-literacy-creative-writing-workbook-1", "destination": "/shop/jolly-literacy-creative-writing-workbook-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-creative-writing-workbook-1(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-and-punctuation-pupils-book1", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-and-punctuation-pupils-book1(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-2-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-2-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-3-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-3-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-4-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-4-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-5-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-5-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-6-precursive-letters", "destination": "/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-6-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-1-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-1-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-2-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-2-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-3-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-3-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-4-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-4-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-5-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-5-precursive-letters(?:/)?$" }, { "source": "/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-6-precursive-letters", "destination": "/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-6-precursive-letters(?:/)?$" }, { "source": "/product/jolly-phonics-readers-nonfiction-red-level-pack-of-6", "destination": "/shop/level-1-non-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-nonfiction-red-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-general-fiction-red-level-pack-of-6", "destination": "/shop/level-1-general-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-general-fiction-red-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-inky-friends-red-level-pack-of-6", "destination": "/shop/level-1-inky-and-friends-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-inky-friends-red-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-nonfiction-yellow-level-pack-of-6", "destination": "/shop/level-2-non-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-nonfiction-yellow-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-general-fiction-yellow-level-pack-of-6", "destination": "/shop/level-2-general-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-general-fiction-yellow-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-inky-friends-yellow-level-pack-of-6", "destination": "/shop/level-2-inky-and-friends-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-inky-friends-yellow-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-nonfiction-green-level-pack-of-6", "destination": "/shop/level-3-non-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-nonfiction-green-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-general-fiction-green-level-pack-of-6", "destination": "/shop/level-3-general-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-general-fiction-green-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-inky-friends-green-level-pack-of-6", "destination": "/shop/level-3-inky-and-friends-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-inky-friends-green-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-nonfiction-blue-level-pack-of-6", "destination": "/shop/level-4-non-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-nonfiction-blue-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-general-fiction-blue-level-pack-of-6", "destination": "/shop/level-4-general-fiction-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-general-fiction-blue-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-phonics-readers-inky-friends-blue-level-pack-of-6", "destination": "/shop/level-4-inky-and-friends-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-inky-friends-blue-level-pack-of-6(?:/)?$" }, { "source": "/product/jolly-readers-inky-friends-level-1-complete-18", "destination": "/shop/level-1-red-readers-complete-set-pack-of-18", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-readers-inky-friends-level-1-complete-18(?:/)?$" }, { "source": "/product/jolly-readers-level-2-complete-set-pack-of-18", "destination": "/shop/level-2-yellow-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-readers-level-2-complete-set-pack-of-18(?:/)?$" }, { "source": "/product/jolly-readers-level-3-complete-set-pack-of-18", "destination": "/shop/level-3-green-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-readers-level-3-complete-set-pack-of-18(?:/)?$" }, { "source": "/product/jolly-readers-level-4-complete-set-pack-of-18", "destination": "/shop/level-4-blue-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-readers-level-4-complete-set-pack-of-18(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-1-pack-of-3", "destination": "/shop/orange-level-readers-set-1-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-1-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-2-pack-of-3", "destination": "/shop/orange-level-readers-set-2-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-2-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-3-pack-of-3", "destination": "/shop/orange-level-readers-set-3-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-3-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-4-pack-of-3", "destination": "/shop/orange-level-readers-set-4-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-4-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-5-pack-of-3", "destination": "/shop/orange-level-readers-set-5-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-5-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-6-pack-of-3", "destination": "/shop/orange-level-readers-set-6-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-6-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-set-7-pack-of-3", "destination": "/shop/orange-level-readers-set-7-pack-of-3", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-set-7-pack-of-3(?:/)?$" }, { "source": "/product/jolly-phonics-readers-orange-level-complete-set-pack-of-21", "destination": "/shop/orange-level-complete-set-pack-of-21", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-readers-orange-level-complete-set-pack-of-21(?:/)?$" }, { "source": "/product/little-word-books", "destination": "/shop/little-word-books-complete-set-14-books", "statusCode": 308, "regex": "^(?!/_next)/product/little-word-books(?:/)?$" }, { "source": "/product/little-word-books-3", "destination": "/shop/little-word-books-complete-set-14-books", "statusCode": 308, "regex": "^(?!/_next)/product/little-word-books-3(?:/)?$" }, { "source": "/product/our-world-readers", "destination": "/shop/our-world-purple-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/our-world-readers(?:/)?$" }, { "source": "/product/our-world-readers-blue-level-4", "destination": "/shop/our-world-blue-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/our-world-readers-blue-level-4(?:/)?$" }, { "source": "/product/our-world-readers-green-level-3", "destination": "/shop/our-world-green-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/our-world-readers-green-level-3(?:/)?$" }, { "source": "/product/jolly-phonics-our-world-readers-yellow-level-2-6-books", "destination": "/shop/our-world-yellow-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-our-world-readers-yellow-level-2-6-books(?:/)?$" }, { "source": "/product/jolly-phonics-our-world-readers-red-level-1-6-books", "destination": "/shop/our-world-red-readers-complete-set", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-our-world-readers-red-level-1-6-books(?:/)?$" }, { "source": "/product/folktales-readers-level-1-complete-set-6-books", "destination": "/shop/level-1-folk-tale-readers-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/folktales-readers-level-1-complete-set-6-books(?:/)?$" }, { "source": "/product/folktales-readers-level-2-complete-set-6-books", "destination": "/shop/level-2-folk-tale-readers-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/folktales-readers-level-2-complete-set-6-books(?:/)?$" }, { "source": "/product/folktales-readers-level-3-complete-set-6-books", "destination": "/shop/level-3-folk-tale-readers-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/folktales-readers-level-3-complete-set-6-books(?:/)?$" }, { "source": "/product/folktales-readers-level-4-complete-set-6-books", "destination": "/shop/level-4-folk-tale-readers-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/folktales-readers-level-4-complete-set-6-books(?:/)?$" }, { "source": "/product/folktales-readers-level-5-complete-set-6-books", "destination": "/shop/level-5-folk-tale-readers-pack-of-6", "statusCode": 308, "regex": "^(?!/_next)/product/folktales-readers-level-5-complete-set-6-books(?:/)?$" }, { "source": "/product/fun-phonics", "destination": "/shop/fun-phonics-pack", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics(?:/)?$" }, { "source": "/product/fun-phonics-pack-2", "destination": "/shop/fun-phonics-pack-2", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics-pack-2(?:/)?$" }, { "source": "/product/fun-phonics-pack-1-edition-2025", "destination": "/shop/fun-phonics-pack-edition-2025", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics-pack-1-edition-2025(?:/)?$" }, { "source": "/product/fun-phonics-yellow-readers-pack-of-three", "destination": "/shop/fun-phonics-yellow-readers-pack-of-three", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics-yellow-readers-pack-of-three(?:/)?$" }, { "source": "/product/fun-phonics-orange-readers-pack-of-three", "destination": "/shop/fun-phonics-orange-readers-pack-of-three", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics-orange-readers-pack-of-three(?:/)?$" }, { "source": "/product/sounds-like-fun-dvd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/sounds-like-fun-dvd(?:/)?$" }, { "source": "/product/jolly-phonics-for-the-whiteboard", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-for-the-whiteboard(?:/)?$" }, { "source": "/product/jolly-phonics-for-the-whiteboard-site-license-in-print-letters", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-for-the-whiteboard-site-license-in-print-letters(?:/)?$" }, { "source": "/product/jolly-phonics-games-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-games-cd(?:/)?$" }, { "source": "/product/jolly-phonics-games-cd-site-licence", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-games-cd-site-licence(?:/)?$" }, { "source": "/product/jolly-phonics-dvd-pal", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-dvd-pal(?:/)?$" }, { "source": "/product/jolly-phonics-resources-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-resources-cd(?:/)?$" }, { "source": "/product/jolly-phonics-puppets", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-puppets(?:/)?$" }, { "source": "/product/jolly-phonics-tricky-word-hat", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-tricky-word-hat(?:/)?$" }, { "source": "/product/jolly-phonics-magnetic-letters", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-magnetic-letters(?:/)?$" }, { "source": "/product/jolly-phonics-extra", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-extra(?:/)?$" }, { "source": "/product/jolly-phonics-extra-personal-edition", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-extra-personal-edition(?:/)?$" }, { "source": "/product/my-jolly-phonics-home-kit", "destination": "/shop?collection=jolly-learning&category=kits", "statusCode": 308, "regex": "^(?!/_next)/product/my-jolly-phonics-home-kit(?:/)?$" }, { "source": "/product/the-grammar-1-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-1-handbook(?:/)?$" }, { "source": "/product/the-grammar-2-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-2-handbook(?:/)?$" }, { "source": "/product/the-grammar-3-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-3-handbook(?:/)?$" }, { "source": "/product/the-grammar-4-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-4-handbook(?:/)?$" }, { "source": "/product/the-grammar-5-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-5-handbook(?:/)?$" }, { "source": "/product/the-grammar-6-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/the-grammar-6-handbook(?:/)?$" }, { "source": "/product/jolly-grammar-big-book-1", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-grammar-big-book-1(?:/)?$" }, { "source": "/product/jolly-grammar-big-book-2", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-grammar-big-book-2(?:/)?$" }, { "source": "/product/grammar-games-cd-single-user", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product/grammar-games-cd-single-user(?:/)?$" }, { "source": "/product/jolly-jingles-book-and-cd", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-jingles-book-and-cd(?:/)?$" }, { "source": "/product/jolly-phonics-pupil-book-teachers-book", "destination": "/shop?collection=jolly-learning&category=pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product/jolly-phonics-pupil-book-teachers-book(?:/)?$" }, { "source": "/product/fun-phonics-readers", "destination": "/shop?collection=phonics-club&category=readers", "statusCode": 308, "regex": "^(?!/_next)/product/fun-phonics-readers(?:/)?$" }, { "source": "/product/:slug.html", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/product(?:/([^/]+?))\\.html(?:/)?$" }, { "source": "/product/:path*", "destination": "/shop", "statusCode": 308, "regex": "^(?!/_next)/product(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/product-category/jolly-phonics/:path*", "destination": "/shop?collection=jolly-learning", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-phonics(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/product-category/jolly-grammar/:path*", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/product-category/readers/:path*", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/product-category/readers(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/product-category/school-packs/:path*", "destination": "/shop?collection=jolly-learning&category=kits", "statusCode": 308, "regex": "^(?!/_next)/product-category/school-packs(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/product-category/classroom-kits-and-sets", "destination": "/shop?collection=jolly-learning&category=kits", "statusCode": 308, "regex": "^(?!/_next)/product-category/classroom-kits-and-sets(?:/)?$" }, { "source": "/product-category/pupil-books-coloured", "destination": "/shop?collection=jolly-learning&category=pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/pupil-books-coloured(?:/)?$" }, { "source": "/product-category/pupil-books-black-and-white", "destination": "/shop?collection=jolly-learning&category=pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/pupil-books-black-and-white(?:/)?$" }, { "source": "/product-category/jolly-phonics/jolly-phonic-workbooks", "destination": "/shop?collection=jolly-learning&category=workbooks", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-phonics/jolly-phonic-workbooks(?:/)?$" }, { "source": "/product-category/jolly-phonics/jolly-phonics-activity-books-with-sticker-sheets", "destination": "/shop?collection=jolly-learning&category=activity-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-phonics/jolly-phonics-activity-books-with-sticker-sheets(?:/)?$" }, { "source": "/product-category/jolly-phonics/teachers-resource-materials", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-phonics/teachers-resource-materials(?:/)?$" }, { "source": "/product-category/teachers-resource-materials", "destination": "/shop?collection=jolly-learning&category=teacher-resources", "statusCode": 308, "regex": "^(?!/_next)/product-category/teachers-resource-materials(?:/)?$" }, { "source": "/product-category/grammar-pupil-book", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/grammar-pupil-book(?:/)?$" }, { "source": "/product-category/grammar-teachers-book", "destination": "/shop?collection=jolly-learning&category=teachers-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/grammar-teachers-book(?:/)?$" }, { "source": "/product-category/jolly-grammar/grammar-pupil-book", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/grammar-pupil-book(?:/)?$" }, { "source": "/product-category/jolly-grammar/grammar-teachers-book", "destination": "/shop?collection=jolly-learning&category=teachers-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/grammar-teachers-book(?:/)?$" }, { "source": "/product-category/jolly-grammar/grammar-workbooks-set", "destination": "/shop?collection=jolly-learning&category=grammar-workbooks", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/grammar-workbooks-set(?:/)?$" }, { "source": "/product-category/jolly-grammar/jolly-literacy", "destination": "/shop?collection=jolly-learning&category=grammar-pupil-books", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/jolly-literacy(?:/)?$" }, { "source": "/product-category/jolly-grammar/jolly-grammar-big-book", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/jolly-grammar-big-book(?:/)?$" }, { "source": "/product-category/jolly-grammar/the-grammar-handbook", "destination": "/shop?collection=jolly-learning&q=grammar", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-grammar/the-grammar-handbook(?:/)?$" }, { "source": "/product-category/our-world-readers-2", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/product-category/our-world-readers-2(?:/)?$" }, { "source": "/product-category/jolly-dictionary", "destination": "/shop/jolly-dictionary", "statusCode": 308, "regex": "^(?!/_next)/product-category/jolly-dictionary(?:/)?$" }, { "source": "/product-category/:path*", "destination": "/shop?collection=jolly-learning", "statusCode": 308, "regex": "^(?!/_next)/product-category(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/noc", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc(?:/)?$" }, { "source": "/noc/:path*", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/noc-of-jolly-learning-books", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc-of-jolly-learning-books(?:/)?$" }, { "source": "/noc-of-jolly-learning-books/:path*", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc-of-jolly-learning-books(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/noc-jolly-learning-books-pctb", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc-jolly-learning-books-pctb(?:/)?$" }, { "source": "/noc-jolly-learning-books-pctb.html", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/noc-jolly-learning-books-pctb\\.html(?:/)?$" }, { "source": "/free-resources", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/free-resources(?:/)?$" }, { "source": "/free-resources.html", "destination": "/blog/noc-jolly-learning-books-pctb", "statusCode": 308, "regex": "^(?!/_next)/free-resources\\.html(?:/)?$" }, { "source": "/login-register", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/login-register(?:/)?$" }, { "source": "/login-register/:path*", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/login-register(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/login", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/login(?:/)?$" }, { "source": "/login.html", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/login\\.html(?:/)?$" }, { "source": "/register", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/register(?:/)?$" }, { "source": "/register.html", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/register\\.html(?:/)?$" }, { "source": "/my-account", "destination": "/dashboard", "statusCode": 308, "regex": "^(?!/_next)/my-account(?:/)?$" }, { "source": "/my-account/:path*", "destination": "/dashboard", "statusCode": 308, "regex": "^(?!/_next)/my-account(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/lp-profile", "destination": "/dashboard", "statusCode": 308, "regex": "^(?!/_next)/lp-profile(?:/)?$" }, { "source": "/lp-profile.html", "destination": "/dashboard", "statusCode": 308, "regex": "^(?!/_next)/lp-profile\\.html(?:/)?$" }, { "source": "/dashboard.html", "destination": "/dashboard", "statusCode": 308, "regex": "^(?!/_next)/dashboard\\.html(?:/)?$" }, { "source": "/student-registration", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/student-registration(?:/)?$" }, { "source": "/student-registration.html", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/student-registration\\.html(?:/)?$" }, { "source": "/instructor-registration", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/instructor-registration(?:/)?$" }, { "source": "/instructor-registration.html", "destination": "/auth/signup", "statusCode": 308, "regex": "^(?!/_next)/instructor-registration\\.html(?:/)?$" }, { "source": "/password-reset", "destination": "/auth/forgot-password", "statusCode": 308, "regex": "^(?!/_next)/password-reset(?:/)?$" }, { "source": "/password-reset.html", "destination": "/auth/forgot-password", "statusCode": 308, "regex": "^(?!/_next)/password-reset\\.html(?:/)?$" }, { "source": "/lp-checkout", "destination": "/checkout", "statusCode": 308, "regex": "^(?!/_next)/lp-checkout(?:/)?$" }, { "source": "/lp-checkout.html", "destination": "/checkout", "statusCode": 308, "regex": "^(?!/_next)/lp-checkout\\.html(?:/)?$" }, { "source": "/wp-login.php", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/wp-login\\.php(?:/)?$" }, { "source": "/wp-admin", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/wp-admin(?:/)?$" }, { "source": "/wp-admin/:path*", "destination": "/auth/login", "statusCode": 308, "regex": "^(?!/_next)/wp-admin(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/blog-1", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-1(?:/)?$" }, { "source": "/blog-1.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-1\\.html(?:/)?$" }, { "source": "/blog-2", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-2(?:/)?$" }, { "source": "/blog-2.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-2\\.html(?:/)?$" }, { "source": "/blog-3", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-3(?:/)?$" }, { "source": "/blog-3.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-3\\.html(?:/)?$" }, { "source": "/blog-4", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-4(?:/)?$" }, { "source": "/blog-4.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/blog-4\\.html(?:/)?$" }, { "source": "/teaching-children-to-read-or-a-fight-against-illiteracy", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/teaching-children-to-read-or-a-fight-against-illiteracy(?:/)?$" }, { "source": "/teaching-children-to-read-or-a-fight-against-illiteracy.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/teaching-children-to-read-or-a-fight-against-illiteracy\\.html(?:/)?$" }, { "source": "/teaching-of-urdu-as-a-second-language", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/teaching-of-urdu-as-a-second-language(?:/)?$" }, { "source": "/teaching-of-urdu-as-a-second-language.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/teaching-of-urdu-as-a-second-language\\.html(?:/)?$" }, { "source": "/learn-english-online", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/learn-english-online(?:/)?$" }, { "source": "/learn-english-online.html", "destination": "/courses", "statusCode": 308, "regex": "^(?!/_next)/learn-english-online\\.html(?:/)?$" }, { "source": "/reading-and-writing-through-synthetic-phonics", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/reading-and-writing-through-synthetic-phonics(?:/)?$" }, { "source": "/reading-and-writing-through-synthetic-phonics.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/reading-and-writing-through-synthetic-phonics\\.html(?:/)?$" }, { "source": "/reading-and-writing-problems", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/reading-and-writing-problems(?:/)?$" }, { "source": "/reading-and-writing-problems.html", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/reading-and-writing-problems\\.html(?:/)?$" }, { "source": "/category/workshop/:path*", "destination": "/trainings", "statusCode": 308, "regex": "^(?!/_next)/category/workshop(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/category/:path*", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/category(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/tag/:path*", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)/tag(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/:year(\\d{4})/:month(\\d{1,2})/:day(\\d{1,2})/:slug", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)(?:/(\\d{4}))(?:/(\\d{1,2}))(?:/(\\d{1,2}))(?:/([^/]+?))(?:/)?$" }, { "source": "/:year(\\d{4})/:month(\\d{1,2})/:slug", "destination": "/blog", "statusCode": 308, "regex": "^(?!/_next)(?:/(\\d{4}))(?:/(\\d{1,2}))(?:/([^/]+?))(?:/)?$" }, { "source": "/jumping-for-jolly", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/jumping-for-jolly(?:/)?$" }, { "source": "/jumping-for-jolly.html", "destination": "/about", "statusCode": 308, "regex": "^(?!/_next)/jumping-for-jolly\\.html(?:/)?$" }, { "source": "/parents-corner", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/parents-corner(?:/)?$" }, { "source": "/parents-corner.html", "destination": "/courses?category=children-courses", "statusCode": 308, "regex": "^(?!/_next)/parents-corner\\.html(?:/)?$" }, { "source": "/post-a-job", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/post-a-job(?:/)?$" }, { "source": "/post-a-job.html", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/post-a-job\\.html(?:/)?$" }, { "source": "/job-dashboard", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/job-dashboard(?:/)?$" }, { "source": "/job-dashboard.html", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/job-dashboard\\.html(?:/)?$" }, { "source": "/jobs", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/jobs(?:/)?$" }, { "source": "/jobs.html", "destination": "/contact", "statusCode": 308, "regex": "^(?!/_next)/jobs\\.html(?:/)?$" }, { "source": "/questions", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/questions(?:/)?$" }, { "source": "/questions.html", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/questions\\.html(?:/)?$" }, { "source": "/questions/:path*", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/questions(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/forums/:path*", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/forums(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/forum/:path*", "destination": "/faqs", "statusCode": 308, "regex": "^(?!/_next)/forum(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$" }, { "source": "/", "destination": "/", "has": [{ "type": "query", "key": "page_id", "value": "2" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/", "has": [{ "type": "query", "key": "page_id", "value": "13" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/contact", "has": [{ "type": "query", "key": "page_id", "value": "244" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/", "has": [{ "type": "query", "key": "page_id", "value": "386" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/contact", "has": [{ "type": "query", "key": "page_id", "value": "444" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "page_id", "value": "492" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/trainings", "has": [{ "type": "query", "key": "page_id", "value": "550" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog", "has": [{ "type": "query", "key": "page_id", "value": "612" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/faqs", "has": [{ "type": "query", "key": "page_id", "value": "632" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/faqs", "has": [{ "type": "query", "key": "page_id", "value": "2824" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "2838" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "2852" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "2861" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/shop", "has": [{ "type": "query", "key": "page_id", "value": "2871" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/trainings", "has": [{ "type": "query", "key": "page_id", "value": "2883" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "2897" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "2906" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "2928" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "2935" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "2941" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/consultancy", "has": [{ "type": "query", "key": "page_id", "value": "2956" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/consultancy", "has": [{ "type": "query", "key": "page_id", "value": "2960" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/consultancy", "has": [{ "type": "query", "key": "page_id", "value": "2973" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/consultancy", "has": [{ "type": "query", "key": "page_id", "value": "2985" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/trainings", "has": [{ "type": "query", "key": "page_id", "value": "2994" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "3014" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3020" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "3028" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3036" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "3058" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/trainings", "has": [{ "type": "query", "key": "page_id", "value": "3107" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3120" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "3123" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3127" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3133" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3138" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog/jolly-phonics-2017-training-video", "has": [{ "type": "query", "key": "page_id", "value": "3253" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/consultancy", "has": [{ "type": "query", "key": "page_id", "value": "3265" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/about", "has": [{ "type": "query", "key": "page_id", "value": "3274" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/contact", "has": [{ "type": "query", "key": "page_id", "value": "3319" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/research", "has": [{ "type": "query", "key": "page_id", "value": "3374" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "3400" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "3413" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "3739" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "3760" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/terms", "has": [{ "type": "query", "key": "page_id", "value": "3843" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog/noc-jolly-learning-books-pctb", "has": [{ "type": "query", "key": "page_id", "value": "4016" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/privacy", "has": [{ "type": "query", "key": "page_id", "value": "4391" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/refunds", "has": [{ "type": "query", "key": "page_id", "value": "35649" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/shop", "has": [{ "type": "query", "key": "page_id", "value": "35769" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/certified-trainers", "has": [{ "type": "query", "key": "page_id", "value": "35868" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/checkout", "has": [{ "type": "query", "key": "page_id", "value": "37753" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/dashboard", "has": [{ "type": "query", "key": "page_id", "value": "37754" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "page_id", "value": "37755" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=teacher-courses", "has": [{ "type": "query", "key": "page_id", "value": "37756" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/terms", "has": [{ "type": "query", "key": "page_id", "value": "37757" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/dashboard", "has": [{ "type": "query", "key": "page_id", "value": "37968" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/auth/signup", "has": [{ "type": "query", "key": "page_id", "value": "37969" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/auth/signup", "has": [{ "type": "query", "key": "page_id", "value": "37970" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/wishlist", "has": [{ "type": "query", "key": "page_id", "value": "39093" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "page_id", "value": "39726" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "page_id", "value": "39748" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "page_id", "value": "39754" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/certified-trainers", "has": [{ "type": "query", "key": "page_id", "value": "40227" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/certified-trainers", "has": [{ "type": "query", "key": "page_id", "value": "40228" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "page_id", "value": "40593" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/auth/forgot-password", "has": [{ "type": "query", "key": "page_id", "value": "40594" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/dashboard/my-courses", "has": [{ "type": "query", "key": "page_id", "value": "40595" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses/teaching-english-jolly-phonics", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "37938" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses/teaching-english-through-jolly-phonics-free-version", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "38375" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses/preschool-professional", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "38554" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39801" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39802" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39803" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses?category=children-courses", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }, { "type": "query", "key": "p", "value": "39807" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog", "has": [{ "type": "query", "key": "p", "value": "3641" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog", "has": [{ "type": "query", "key": "p", "value": "3787" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "p", "value": "4337" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/trainings", "has": [{ "type": "query", "key": "p", "value": "4380" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog", "has": [{ "type": "query", "key": "p", "value": "35633" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/blog", "has": [{ "type": "query", "key": "p", "value": "35883" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/shop", "has": [{ "type": "query", "key": "post_type", "value": "product" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }, { "source": "/", "destination": "/courses", "has": [{ "type": "query", "key": "post_type", "value": "lp_course" }], "statusCode": 308, "regex": "^(?!/_next)/(?:/)?$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }, { "page": "/about", "regex": "^/about(?:/)?$", "routeKeys": {}, "namedRegex": "^/about(?:/)?$" }, { "page": "/account-deletion", "regex": "^/account\\-deletion(?:/)?$", "routeKeys": {}, "namedRegex": "^/account\\-deletion(?:/)?$" }, { "page": "/admin", "regex": "^/admin(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin(?:/)?$" }, { "page": "/admin/blog", "regex": "^/admin/blog(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/blog(?:/)?$" }, { "page": "/admin/blog/new", "regex": "^/admin/blog/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/blog/new(?:/)?$" }, { "page": "/admin/catalogs", "regex": "^/admin/catalogs(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/catalogs(?:/)?$" }, { "page": "/admin/certificates", "regex": "^/admin/certificates(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/certificates(?:/)?$" }, { "page": "/admin/content", "regex": "^/admin/content(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/content(?:/)?$" }, { "page": "/admin/coupons", "regex": "^/admin/coupons(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/coupons(?:/)?$" }, { "page": "/admin/course-cancellations", "regex": "^/admin/course\\-cancellations(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/course\\-cancellations(?:/)?$" }, { "page": "/admin/course-payments", "regex": "^/admin/course\\-payments(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/course\\-payments(?:/)?$" }, { "page": "/admin/courses", "regex": "^/admin/courses(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/courses(?:/)?$" }, { "page": "/admin/courses/new", "regex": "^/admin/courses/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/courses/new(?:/)?$" }, { "page": "/admin/customers", "regex": "^/admin/customers(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/customers(?:/)?$" }, { "page": "/admin/developer-mode", "regex": "^/admin/developer\\-mode(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/developer\\-mode(?:/)?$" }, { "page": "/admin/fast-invoices", "regex": "^/admin/fast\\-invoices(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/fast\\-invoices(?:/)?$" }, { "page": "/admin/fast-update", "regex": "^/admin/fast\\-update(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/fast\\-update(?:/)?$" }, { "page": "/admin/lms-reports", "regex": "^/admin/lms\\-reports(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/lms\\-reports(?:/)?$" }, { "page": "/admin/manual", "regex": "^/admin/manual(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/manual(?:/)?$" }, { "page": "/admin/newsletters", "regex": "^/admin/newsletters(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/newsletters(?:/)?$" }, { "page": "/admin/orders", "regex": "^/admin/orders(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/orders(?:/)?$" }, { "page": "/admin/orders/invoice-numbering", "regex": "^/admin/orders/invoice\\-numbering(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/orders/invoice\\-numbering(?:/)?$" }, { "page": "/admin/products", "regex": "^/admin/products(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/products(?:/)?$" }, { "page": "/admin/products/new", "regex": "^/admin/products/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/products/new(?:/)?$" }, { "page": "/admin/settings/appearance", "regex": "^/admin/settings/appearance(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/settings/appearance(?:/)?$" }, { "page": "/admin/settings/currency", "regex": "^/admin/settings/currency(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/settings/currency(?:/)?$" }, { "page": "/admin/settings/payment-methods", "regex": "^/admin/settings/payment\\-methods(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/settings/payment\\-methods(?:/)?$" }, { "page": "/admin/trainers", "regex": "^/admin/trainers(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/trainers(?:/)?$" }, { "page": "/admin/trainings", "regex": "^/admin/trainings(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/trainings(?:/)?$" }, { "page": "/admin/upload", "regex": "^/admin/upload(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/upload(?:/)?$" }, { "page": "/admin/users", "regex": "^/admin/users(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin/users(?:/)?$" }, { "page": "/auth/callback", "regex": "^/auth/callback(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/callback(?:/)?$" }, { "page": "/auth/forgot-password", "regex": "^/auth/forgot\\-password(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/forgot\\-password(?:/)?$" }, { "page": "/auth/login", "regex": "^/auth/login(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/login(?:/)?$" }, { "page": "/auth/reset-password", "regex": "^/auth/reset\\-password(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/reset\\-password(?:/)?$" }, { "page": "/auth/signup", "regex": "^/auth/signup(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/signup(?:/)?$" }, { "page": "/blog", "regex": "^/blog(?:/)?$", "routeKeys": {}, "namedRegex": "^/blog(?:/)?$" }, { "page": "/cart", "regex": "^/cart(?:/)?$", "routeKeys": {}, "namedRegex": "^/cart(?:/)?$" }, { "page": "/certified-trainers", "regex": "^/certified\\-trainers(?:/)?$", "routeKeys": {}, "namedRegex": "^/certified\\-trainers(?:/)?$" }, { "page": "/checkout", "regex": "^/checkout(?:/)?$", "routeKeys": {}, "namedRegex": "^/checkout(?:/)?$" }, { "page": "/checkout/success", "regex": "^/checkout/success(?:/)?$", "routeKeys": {}, "namedRegex": "^/checkout/success(?:/)?$" }, { "page": "/consultancy", "regex": "^/consultancy(?:/)?$", "routeKeys": {}, "namedRegex": "^/consultancy(?:/)?$" }, { "page": "/contact", "regex": "^/contact(?:/)?$", "routeKeys": {}, "namedRegex": "^/contact(?:/)?$" }, { "page": "/cookies", "regex": "^/cookies(?:/)?$", "routeKeys": {}, "namedRegex": "^/cookies(?:/)?$" }, { "page": "/courses", "regex": "^/courses(?:/)?$", "routeKeys": {}, "namedRegex": "^/courses(?:/)?$" }, { "page": "/dashboard", "regex": "^/dashboard(?:/)?$", "routeKeys": {}, "namedRegex": "^/dashboard(?:/)?$" }, { "page": "/dashboard/my-courses", "regex": "^/dashboard/my\\-courses(?:/)?$", "routeKeys": {}, "namedRegex": "^/dashboard/my\\-courses(?:/)?$" }, { "page": "/dashboard/profile", "regex": "^/dashboard/profile(?:/)?$", "routeKeys": {}, "namedRegex": "^/dashboard/profile(?:/)?$" }, { "page": "/faqs", "regex": "^/faqs(?:/)?$", "routeKeys": {}, "namedRegex": "^/faqs(?:/)?$" }, { "page": "/instructor", "regex": "^/instructor(?:/)?$", "routeKeys": {}, "namedRegex": "^/instructor(?:/)?$" }, { "page": "/manifest.webmanifest", "regex": "^/manifest\\.webmanifest(?:/)?$", "routeKeys": {}, "namedRegex": "^/manifest\\.webmanifest(?:/)?$" }, { "page": "/newsletter", "regex": "^/newsletter(?:/)?$", "routeKeys": {}, "namedRegex": "^/newsletter(?:/)?$" }, { "page": "/newsletters", "regex": "^/newsletters(?:/)?$", "routeKeys": {}, "namedRegex": "^/newsletters(?:/)?$" }, { "page": "/privacy", "regex": "^/privacy(?:/)?$", "routeKeys": {}, "namedRegex": "^/privacy(?:/)?$" }, { "page": "/refunds", "regex": "^/refunds(?:/)?$", "routeKeys": {}, "namedRegex": "^/refunds(?:/)?$" }, { "page": "/research", "regex": "^/research(?:/)?$", "routeKeys": {}, "namedRegex": "^/research(?:/)?$" }, { "page": "/robots.txt", "regex": "^/robots\\.txt(?:/)?$", "routeKeys": {}, "namedRegex": "^/robots\\.txt(?:/)?$" }, { "page": "/shipping", "regex": "^/shipping(?:/)?$", "routeKeys": {}, "namedRegex": "^/shipping(?:/)?$" }, { "page": "/shop", "regex": "^/shop(?:/)?$", "routeKeys": {}, "namedRegex": "^/shop(?:/)?$" }, { "page": "/sitemap.xml", "regex": "^/sitemap\\.xml(?:/)?$", "routeKeys": {}, "namedRegex": "^/sitemap\\.xml(?:/)?$" }, { "page": "/terms", "regex": "^/terms(?:/)?$", "routeKeys": {}, "namedRegex": "^/terms(?:/)?$" }, { "page": "/trainings", "regex": "^/trainings(?:/)?$", "routeKeys": {}, "namedRegex": "^/trainings(?:/)?$" }, { "page": "/wishlist", "regex": "^/wishlist(?:/)?$", "routeKeys": {}, "namedRegex": "^/wishlist(?:/)?$" }], "dynamic": [{ "page": "/admin/blog/[id]", "regex": "^/admin/blog/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/admin/blog/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/admin/courses/[id]", "regex": "^/admin/courses/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/admin/courses/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/admin/courses/[id]/builder", "regex": "^/admin/courses/([^/]+?)/builder(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/admin/courses/(?<nxtPid>[^/]+?)/builder(?:/)?$" }, { "page": "/admin/products/[id]", "regex": "^/admin/products/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/admin/products/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/admin/products/[productId]", "regex": "^/api/mobile/v1/admin/products/([^/]+?)(?:/)?$", "routeKeys": { "nxtPproductId": "nxtPproductId" }, "namedRegex": "^/api/mobile/v1/admin/products/(?<nxtPproductId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/admin/products/[productId]/inventory", "regex": "^/api/mobile/v1/admin/products/([^/]+?)/inventory(?:/)?$", "routeKeys": { "nxtPproductId": "nxtPproductId" }, "namedRegex": "^/api/mobile/v1/admin/products/(?<nxtPproductId>[^/]+?)/inventory(?:/)?$" }, { "page": "/api/mobile/v1/admin/products/[productId]/price", "regex": "^/api/mobile/v1/admin/products/([^/]+?)/price(?:/)?$", "routeKeys": { "nxtPproductId": "nxtPproductId" }, "namedRegex": "^/api/mobile/v1/admin/products/(?<nxtPproductId>[^/]+?)/price(?:/)?$" }, { "page": "/api/mobile/v1/admin/reviews/[reviewId]", "regex": "^/api/mobile/v1/admin/reviews/([^/]+?)(?:/)?$", "routeKeys": { "nxtPreviewId": "nxtPreviewId" }, "namedRegex": "^/api/mobile/v1/admin/reviews/(?<nxtPreviewId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/certificates/[certificateId]", "regex": "^/api/mobile/v1/certificates/([^/]+?)(?:/)?$", "routeKeys": { "nxtPcertificateId": "nxtPcertificateId" }, "namedRegex": "^/api/mobile/v1/certificates/(?<nxtPcertificateId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/certificates/[certificateId]/download", "regex": "^/api/mobile/v1/certificates/([^/]+?)/download(?:/)?$", "routeKeys": { "nxtPcertificateId": "nxtPcertificateId" }, "namedRegex": "^/api/mobile/v1/certificates/(?<nxtPcertificateId>[^/]+?)/download(?:/)?$" }, { "page": "/api/mobile/v1/children/[childId]", "regex": "^/api/mobile/v1/children/([^/]+?)(?:/)?$", "routeKeys": { "nxtPchildId": "nxtPchildId" }, "namedRegex": "^/api/mobile/v1/children/(?<nxtPchildId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/course-payments/[paymentId]", "regex": "^/api/mobile/v1/course\\-payments/([^/]+?)(?:/)?$", "routeKeys": { "nxtPpaymentId": "nxtPpaymentId" }, "namedRegex": "^/api/mobile/v1/course\\-payments/(?<nxtPpaymentId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/course-payments/[paymentId]/receipt", "regex": "^/api/mobile/v1/course\\-payments/([^/]+?)/receipt(?:/)?$", "routeKeys": { "nxtPpaymentId": "nxtPpaymentId" }, "namedRegex": "^/api/mobile/v1/course\\-payments/(?<nxtPpaymentId>[^/]+?)/receipt(?:/)?$" }, { "page": "/api/mobile/v1/devices/[deviceId]", "regex": "^/api/mobile/v1/devices/([^/]+?)(?:/)?$", "routeKeys": { "nxtPdeviceId": "nxtPdeviceId" }, "namedRegex": "^/api/mobile/v1/devices/(?<nxtPdeviceId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/learning/courses/[courseId]", "regex": "^/api/mobile/v1/learning/courses/([^/]+?)(?:/)?$", "routeKeys": { "nxtPcourseId": "nxtPcourseId" }, "namedRegex": "^/api/mobile/v1/learning/courses/(?<nxtPcourseId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/learning/lessons/[lessonId]/complete", "regex": "^/api/mobile/v1/learning/lessons/([^/]+?)/complete(?:/)?$", "routeKeys": { "nxtPlessonId": "nxtPlessonId" }, "namedRegex": "^/api/mobile/v1/learning/lessons/(?<nxtPlessonId>[^/]+?)/complete(?:/)?$" }, { "page": "/api/mobile/v1/learning/resources/[resourceId]/access", "regex": "^/api/mobile/v1/learning/resources/([^/]+?)/access(?:/)?$", "routeKeys": { "nxtPresourceId": "nxtPresourceId" }, "namedRegex": "^/api/mobile/v1/learning/resources/(?<nxtPresourceId>[^/]+?)/access(?:/)?$" }, { "page": "/api/mobile/v1/learning/sessions/[sessionId]/finish", "regex": "^/api/mobile/v1/learning/sessions/([^/]+?)/finish(?:/)?$", "routeKeys": { "nxtPsessionId": "nxtPsessionId" }, "namedRegex": "^/api/mobile/v1/learning/sessions/(?<nxtPsessionId>[^/]+?)/finish(?:/)?$" }, { "page": "/api/mobile/v1/learning/sessions/[sessionId]/heartbeat", "regex": "^/api/mobile/v1/learning/sessions/([^/]+?)/heartbeat(?:/)?$", "routeKeys": { "nxtPsessionId": "nxtPsessionId" }, "namedRegex": "^/api/mobile/v1/learning/sessions/(?<nxtPsessionId>[^/]+?)/heartbeat(?:/)?$" }, { "page": "/api/mobile/v1/orders/[orderId]", "regex": "^/api/mobile/v1/orders/([^/]+?)(?:/)?$", "routeKeys": { "nxtPorderId": "nxtPorderId" }, "namedRegex": "^/api/mobile/v1/orders/(?<nxtPorderId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/orders/[orderId]/invoice", "regex": "^/api/mobile/v1/orders/([^/]+?)/invoice(?:/)?$", "routeKeys": { "nxtPorderId": "nxtPorderId" }, "namedRegex": "^/api/mobile/v1/orders/(?<nxtPorderId>[^/]+?)/invoice(?:/)?$" }, { "page": "/api/mobile/v1/orders/[orderId]/receipt", "regex": "^/api/mobile/v1/orders/([^/]+?)/receipt(?:/)?$", "routeKeys": { "nxtPorderId": "nxtPorderId" }, "namedRegex": "^/api/mobile/v1/orders/(?<nxtPorderId>[^/]+?)/receipt(?:/)?$" }, { "page": "/api/mobile/v1/quizzes/[quizId]", "regex": "^/api/mobile/v1/quizzes/([^/]+?)(?:/)?$", "routeKeys": { "nxtPquizId": "nxtPquizId" }, "namedRegex": "^/api/mobile/v1/quizzes/(?<nxtPquizId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/quizzes/[quizId]/submit", "regex": "^/api/mobile/v1/quizzes/([^/]+?)/submit(?:/)?$", "routeKeys": { "nxtPquizId": "nxtPquizId" }, "namedRegex": "^/api/mobile/v1/quizzes/(?<nxtPquizId>[^/]+?)/submit(?:/)?$" }, { "page": "/api/mobile/v1/support/issues/[ticketId]", "regex": "^/api/mobile/v1/support/issues/([^/]+?)(?:/)?$", "routeKeys": { "nxtPticketId": "nxtPticketId" }, "namedRegex": "^/api/mobile/v1/support/issues/(?<nxtPticketId>[^/]+?)(?:/)?$" }, { "page": "/api/mobile/v1/support/issues/[ticketId]/reply", "regex": "^/api/mobile/v1/support/issues/([^/]+?)/reply(?:/)?$", "routeKeys": { "nxtPticketId": "nxtPticketId" }, "namedRegex": "^/api/mobile/v1/support/issues/(?<nxtPticketId>[^/]+?)/reply(?:/)?$" }, { "page": "/api/mobile/v1/trainings/[trainingId]/register", "regex": "^/api/mobile/v1/trainings/([^/]+?)/register(?:/)?$", "routeKeys": { "nxtPtrainingId": "nxtPtrainingId" }, "namedRegex": "^/api/mobile/v1/trainings/(?<nxtPtrainingId>[^/]+?)/register(?:/)?$" }, { "page": "/api/orders/[id]/invoice", "regex": "^/api/orders/([^/]+?)/invoice(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/orders/(?<nxtPid>[^/]+?)/invoice(?:/)?$" }, { "page": "/api/orders/[id]/receipt", "regex": "^/api/orders/([^/]+?)/receipt(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/orders/(?<nxtPid>[^/]+?)/receipt(?:/)?$" }, { "page": "/blog/[slug]", "regex": "^/blog/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/blog/(?<nxtPslug>[^/]+?)(?:/)?$" }, { "page": "/certificates/verify/[code]", "regex": "^/certificates/verify/([^/]+?)(?:/)?$", "routeKeys": { "nxtPcode": "nxtPcode" }, "namedRegex": "^/certificates/verify/(?<nxtPcode>[^/]+?)(?:/)?$" }, { "page": "/certified-trainers/[slug]", "regex": "^/certified\\-trainers/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/certified\\-trainers/(?<nxtPslug>[^/]+?)(?:/)?$" }, { "page": "/course/[id]/certificate", "regex": "^/course/([^/]+?)/certificate(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/course/(?<nxtPid>[^/]+?)/certificate(?:/)?$" }, { "page": "/course/[id]/learn", "regex": "^/course/([^/]+?)/learn(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/course/(?<nxtPid>[^/]+?)/learn(?:/)?$" }, { "page": "/course/[id]/quiz", "regex": "^/course/([^/]+?)/quiz(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/course/(?<nxtPid>[^/]+?)/quiz(?:/)?$" }, { "page": "/courses/[slug]", "regex": "^/courses/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/courses/(?<nxtPslug>[^/]+?)(?:/)?$" }, { "page": "/courses/[slug]/enroll", "regex": "^/courses/([^/]+?)/enroll(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/courses/(?<nxtPslug>[^/]+?)/enroll(?:/)?$" }, { "page": "/courses/[slug]/payment", "regex": "^/courses/([^/]+?)/payment(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/courses/(?<nxtPslug>[^/]+?)/payment(?:/)?$" }, { "page": "/fast-invoice/[token]", "regex": "^/fast\\-invoice/([^/]+?)(?:/)?$", "routeKeys": { "nxtPtoken": "nxtPtoken" }, "namedRegex": "^/fast\\-invoice/(?<nxtPtoken>[^/]+?)(?:/)?$" }, { "page": "/instructors/[slug]", "regex": "^/instructors/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/instructors/(?<nxtPslug>[^/]+?)(?:/)?$" }, { "page": "/newsletter/[slug]", "regex": "^/newsletter/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/newsletter/(?<nxtPslug>[^/]+?)(?:/)?$" }, { "page": "/shop/[slug]", "regex": "^/shop/([^/]+?)(?:/)?$", "routeKeys": { "nxtPslug": "nxtPslug" }, "namedRegex": "^/shop/(?<nxtPslug>[^/]+?)(?:/)?$" }], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var PrerenderManifest = { "version": 4, "routes": { "/manifest.webmanifest": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "application/manifest+json", "x-next-cache-tags": "_N_T_/layout,_N_T_/manifest.webmanifest/layout,_N_T_/manifest.webmanifest/route,_N_T_/manifest.webmanifest" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/manifest.webmanifest", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/robots.txt": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "text/plain", "x-next-cache-tags": "_N_T_/layout,_N_T_/robots.txt/layout,_N_T_/robots.txt/route,_N_T_/robots.txt" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/robots.txt", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "37bfeb3d41f8c622bb9c9d7b8b8d2153", "previewModeSigningKey": "db0f10b6fdc471f1b270b4f92adfb8e6b56a624976fecdd28010dea46adca32c", "previewModeEncryptionKey": "3863745ed5becb93e3404ec7f8e0bfefe691377a4e65a4bf6a46c6253408117f" } };
var MiddlewareManifest = { "version": 3, "middleware": { "/": { "files": ["server/edge-runtime-webpack.js", "server/middleware.js"], "name": "middleware", "page": "/", "matchers": [{ "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$", "originalSource": "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "h1B5lt2WkyBkgb2MV5LPQ", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "O6qx4EZnPlpgYoOvMjpj93QGM0s7FhLqhU3wHmR3Oeg=", "__NEXT_PREVIEW_MODE_ID": "37bfeb3d41f8c622bb9c9d7b8b8d2153", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "db0f10b6fdc471f1b270b4f92adfb8e6b56a624976fecdd28010dea46adca32c", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "3863745ed5becb93e3404ec7f8e0bfefe691377a4e65a4bf6a46c6253408117f" } } }, "functions": {}, "sortedMiddleware": ["/"] };
var AppPathRoutesManifest = { "/_not-found/page": "/_not-found", "/api/admin/coupons/export/route": "/api/admin/coupons/export", "/api/admin/blog/gallery/upload/route": "/api/admin/blog/gallery/upload", "/api/admin/course-expiry-reminders/route": "/api/admin/course-expiry-reminders", "/api/admin/course-payment-pending-reminders/route": "/api/admin/course-payment-pending-reminders", "/api/admin/customers/export/route": "/api/admin/customers/export", "/api/admin/orders/export/route": "/api/admin/orders/export", "/api/admin/products/import/route": "/api/admin/products/import", "/api/admin/products/export/route": "/api/admin/products/export", "/api/admin/products/status/route": "/api/admin/products/status", "/api/admin/products/upload-image/route": "/api/admin/products/upload-image", "/api/admin/site-media/upload/route": "/api/admin/site-media/upload", "/api/admin/students/export/route": "/api/admin/students/export", "/api/assistant/route": "/api/assistant", "/api/auth/me/route": "/api/auth/me", "/api/auth/session/route": "/api/auth/session", "/api/cart/items/route": "/api/cart/items", "/api/cart/count/route": "/api/cart/count", "/api/cart/guest/route": "/api/cart/guest", "/api/coupons/preview/route": "/api/coupons/preview", "/api/mobile/v1/account-deletion/request/route": "/api/mobile/v1/account-deletion/request", "/api/mobile/v1/account-deletion/restore/route": "/api/mobile/v1/account-deletion/restore", "/api/mobile/v1/admin/overview/route": "/api/mobile/v1/admin/overview", "/api/mobile/v1/account-deletion/status/route": "/api/mobile/v1/account-deletion/status", "/api/mobile/v1/admin/products/[productId]/inventory/route": "/api/mobile/v1/admin/products/[productId]/inventory", "/api/mobile/v1/admin/products/[productId]/price/route": "/api/mobile/v1/admin/products/[productId]/price", "/api/mobile/v1/admin/products/[productId]/route": "/api/mobile/v1/admin/products/[productId]", "/api/mobile/v1/admin/products/route": "/api/mobile/v1/admin/products", "/api/mobile/v1/admin/reviews/route": "/api/mobile/v1/admin/reviews", "/api/mobile/v1/admin/reviews/[reviewId]/route": "/api/mobile/v1/admin/reviews/[reviewId]", "/api/mobile/v1/certificates/[certificateId]/download/route": "/api/mobile/v1/certificates/[certificateId]/download", "/api/mobile/v1/auth/me/route": "/api/mobile/v1/auth/me", "/api/mobile/v1/certificates/route": "/api/mobile/v1/certificates", "/api/mobile/v1/certificates/[certificateId]/route": "/api/mobile/v1/certificates/[certificateId]", "/api/mobile/v1/children/[childId]/route": "/api/mobile/v1/children/[childId]", "/api/mobile/v1/children/route": "/api/mobile/v1/children", "/api/mobile/v1/config/route": "/api/mobile/v1/config", "/api/mobile/v1/course-payments/[paymentId]/receipt/route": "/api/mobile/v1/course-payments/[paymentId]/receipt", "/api/mobile/v1/course-payments/checkout/route": "/api/mobile/v1/course-payments/checkout", "/api/mobile/v1/course-payments/[paymentId]/route": "/api/mobile/v1/course-payments/[paymentId]", "/api/mobile/v1/course-payments/route": "/api/mobile/v1/course-payments", "/api/mobile/v1/devices/[deviceId]/route": "/api/mobile/v1/devices/[deviceId]", "/api/mobile/v1/devices/register/route": "/api/mobile/v1/devices/register", "/api/mobile/v1/learning/courses/[courseId]/route": "/api/mobile/v1/learning/courses/[courseId]", "/api/mobile/v1/learning/lessons/[lessonId]/complete/route": "/api/mobile/v1/learning/lessons/[lessonId]/complete", "/api/mobile/v1/learning/resources/[resourceId]/access/route": "/api/mobile/v1/learning/resources/[resourceId]/access", "/api/mobile/v1/learning/courses/route": "/api/mobile/v1/learning/courses", "/api/mobile/v1/learning/sessions/[sessionId]/finish/route": "/api/mobile/v1/learning/sessions/[sessionId]/finish", "/api/mobile/v1/newsletter/subscribe/route": "/api/mobile/v1/newsletter/subscribe", "/api/mobile/v1/learning/sessions/[sessionId]/heartbeat/route": "/api/mobile/v1/learning/sessions/[sessionId]/heartbeat", "/api/mobile/v1/learning/sessions/start/route": "/api/mobile/v1/learning/sessions/start", "/api/mobile/v1/newsletter/unsubscribe/route": "/api/mobile/v1/newsletter/unsubscribe", "/api/mobile/v1/orders/[orderId]/route": "/api/mobile/v1/orders/[orderId]", "/api/mobile/v1/orders/[orderId]/invoice/route": "/api/mobile/v1/orders/[orderId]/invoice", "/api/mobile/v1/orders/[orderId]/receipt/route": "/api/mobile/v1/orders/[orderId]/receipt", "/api/mobile/v1/orders/checkout/route": "/api/mobile/v1/orders/checkout", "/api/mobile/v1/quizzes/[quizId]/route": "/api/mobile/v1/quizzes/[quizId]", "/api/mobile/v1/orders/route": "/api/mobile/v1/orders", "/api/mobile/v1/reviews/route": "/api/mobile/v1/reviews", "/api/mobile/v1/quizzes/[quizId]/submit/route": "/api/mobile/v1/quizzes/[quizId]/submit", "/api/mobile/v1/support/issues/[ticketId]/reply/route": "/api/mobile/v1/support/issues/[ticketId]/reply", "/api/mobile/v1/support/issues/route": "/api/mobile/v1/support/issues", "/api/mobile/v1/support/issues/[ticketId]/route": "/api/mobile/v1/support/issues/[ticketId]", "/api/mobile/v1/trainings/[trainingId]/register/route": "/api/mobile/v1/trainings/[trainingId]/register", "/api/orders/[id]/invoice/route": "/api/orders/[id]/invoice", "/api/orders/[id]/receipt/route": "/api/orders/[id]/receipt", "/api/shop/catalogs/route": "/api/shop/catalogs", "/api/site/announcements/route": "/api/site/announcements", "/api/upload/route": "/api/upload", "/auth/callback/route": "/auth/callback", "/courses/[slug]/enroll/route": "/courses/[slug]/enroll", "/manifest.webmanifest/route": "/manifest.webmanifest", "/robots.txt/route": "/robots.txt", "/sitemap.xml/route": "/sitemap.xml", "/blog/[slug]/page": "/blog/[slug]", "/certificates/verify/[code]/page": "/certificates/verify/[code]", "/certified-trainers/[slug]/page": "/certified-trainers/[slug]", "/instructors/[slug]/page": "/instructors/[slug]", "/newsletter/[slug]/page": "/newsletter/[slug]", "/newsletter/page": "/newsletter", "/page": "/", "/shop/[slug]/page": "/shop/[slug]", "/account-deletion/page": "/account-deletion", "/about/page": "/about", "/auth/forgot-password/page": "/auth/forgot-password", "/auth/reset-password/page": "/auth/reset-password", "/auth/signup/page": "/auth/signup", "/auth/login/page": "/auth/login", "/cart/page": "/cart", "/checkout/page": "/checkout", "/checkout/success/page": "/checkout/success", "/consultancy/page": "/consultancy", "/cookies/page": "/cookies", "/certified-trainers/page": "/certified-trainers", "/blog/page": "/blog", "/course/[id]/quiz/page": "/course/[id]/quiz", "/contact/page": "/contact", "/course/[id]/learn/page": "/course/[id]/learn", "/courses/[slug]/page": "/courses/[slug]", "/courses/page": "/courses", "/dashboard/profile/page": "/dashboard/profile", "/course/[id]/certificate/page": "/course/[id]/certificate", "/fast-invoice/[token]/page": "/fast-invoice/[token]", "/courses/[slug]/payment/page": "/courses/[slug]/payment", "/dashboard/my-courses/page": "/dashboard/my-courses", "/faqs/page": "/faqs", "/dashboard/page": "/dashboard", "/privacy/page": "/privacy", "/instructor/page": "/instructor", "/newsletters/page": "/newsletters", "/research/page": "/research", "/refunds/page": "/refunds", "/shipping/page": "/shipping", "/shop/page": "/shop", "/terms/page": "/terms", "/wishlist/page": "/wishlist", "/trainings/page": "/trainings", "/admin/blog/[id]/page": "/admin/blog/[id]", "/admin/blog/page": "/admin/blog", "/admin/blog/new/page": "/admin/blog/new", "/admin/content/page": "/admin/content", "/admin/coupons/page": "/admin/coupons", "/admin/certificates/page": "/admin/certificates", "/admin/course-cancellations/page": "/admin/course-cancellations", "/admin/customers/page": "/admin/customers", "/admin/courses/[id]/builder/page": "/admin/courses/[id]/builder", "/admin/courses/new/page": "/admin/courses/new", "/admin/fast-update/page": "/admin/fast-update", "/admin/developer-mode/page": "/admin/developer-mode", "/admin/course-payments/page": "/admin/course-payments", "/admin/products/[id]/page": "/admin/products/[id]", "/admin/manual/page": "/admin/manual", "/admin/orders/invoice-numbering/page": "/admin/orders/invoice-numbering", "/admin/settings/appearance/page": "/admin/settings/appearance", "/admin/orders/page": "/admin/orders", "/admin/lms-reports/page": "/admin/lms-reports", "/admin/trainers/page": "/admin/trainers", "/admin/trainings/page": "/admin/trainings", "/admin/users/page": "/admin/users", "/admin/products/new/page": "/admin/products/new", "/admin/settings/currency/page": "/admin/settings/currency", "/admin/upload/page": "/admin/upload", "/admin/courses/page": "/admin/courses", "/admin/catalogs/page": "/admin/catalogs", "/admin/fast-invoices/page": "/admin/fast-invoices", "/admin/courses/[id]/page": "/admin/courses/[id]", "/admin/settings/payment-methods/page": "/admin/settings/payment-methods", "/admin/page": "/admin", "/admin/newsletters/page": "/admin/newsletters", "/admin/products/page": "/admin/products" };
var FunctionsConfigManifest = { "version": 1, "functions": {} };
var PagesManifest = { "/_error": "pages/_error.js", "/_app": "pages/_app.js", "/_document": "pages/_document.js" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.OPEN_NEXT_BUILD_ID = NextConfig.deploymentId ?? BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/patchAsyncStorage.js
var mod = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename = mod._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto from "node:crypto";
init_util();
init_logger();
import { ReadableStream as ReadableStream3 } from "node:stream/web";

// node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path2) {
  return NextConfig.i18n?.locales.includes(path2.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}

// node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
function constructNextUrl(baseUrl, path2) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path2}`, baseUrl);
  return url.href;
}
function convertRes(res) {
  const statusCode = res.statusCode || 200;
  const headers = parseHeaders(res.getFixedHeaders());
  const isBase64Encoded = isBinaryContentType(headers["content-type"]) || !!headers["content-encoding"];
  const body = new ReadableStream3({
    pull(controller) {
      if (!res._chunks || res._chunks.length === 0) {
        controller.close();
        return;
      }
      controller.enqueue(res._chunks.shift());
    }
  });
  return {
    type: "core",
    statusCode,
    headers,
    body,
    isBase64Encoded
  };
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function convertToQuery(querystring) {
  if (!querystring)
    return {};
  const query = new URLSearchParams(querystring);
  const queryObject = {};
  for (const key of query.keys()) {
    const queries = query.getAll(key);
    queryObject[key] = queries.length > 1 ? queries : queries[0];
  }
  return queryObject;
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function fixCacheHeaderForHtmlPages(internalEvent, headers) {
  if (internalEvent.rawPath === "/404" || internalEvent.rawPath === "/500") {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const localizedPath = localizePath(internalEvent);
  if (HtmlPages.includes(localizedPath) && !internalEvent.headers["x-middleware-prefetch"]) {
    headers[CommonHeaders.CACHE_CONTROL] = "public, max-age=0, s-maxage=31536000, must-revalidate";
  }
}
function fixSWRCacheHeader(headers) {
  let cacheControl = headers[CommonHeaders.CACHE_CONTROL];
  if (!cacheControl)
    return;
  if (Array.isArray(cacheControl)) {
    cacheControl = cacheControl.join(",");
  }
  if (typeof cacheControl !== "string")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = cacheControl.replace(/\bstale-while-revalidate(?!=)/, "stale-while-revalidate=2592000");
}
function addOpenNextHeader(headers) {
  if (NextConfig.poweredByHeader) {
    headers["X-OpenNext"] = "1";
  }
  if (globalThis.openNextDebug) {
    headers["X-OpenNext-Version"] = globalThis.openNextVersion;
  }
  if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
    headers["X-OpenNext-RequestId"] = globalThis.__openNextAls.getStore()?.requestId;
  }
}
async function revalidateIfRequired(host, rawPath, headers, req) {
  if (headers[CommonHeaders.NEXT_CACHE] === "STALE") {
    const internalMeta = req?.[Symbol.for("NextInternalRequestMeta")];
    const revalidateUrl = internalMeta?._nextDidRewrite ? rawPath.startsWith("/_next/data/") ? `/_next/data/${BuildId}${internalMeta?._nextRewroteUrl}.json` : internalMeta?._nextRewroteUrl : rawPath;
    try {
      const hash = (str) => crypto.createHash("md5").update(str).digest("hex");
      const lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
      const eTag = `${headers.etag ?? headers.ETag ?? ""}`;
      await globalThis.queue.send({
        MessageBody: { host, url: revalidateUrl, eTag, lastModified },
        MessageDeduplicationId: hash(`${rawPath}-${lastModified}-${eTag}`),
        MessageGroupId: generateMessageGroupId(rawPath)
      });
    } catch (e) {
      error(`Failed to revalidate stale page ${rawPath}`, e);
    }
  }
}
function fixISRHeaders(headers) {
  const sMaxAgeRegex = /s-maxage=(\d+)/;
  const match = headers[CommonHeaders.CACHE_CONTROL]?.match(sMaxAgeRegex);
  const sMaxAge = match ? Number.parseInt(match[1]) : void 0;
  if (!sMaxAge) {
    return;
  }
  if (headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const _lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
  if (headers[CommonHeaders.NEXT_CACHE] === "HIT" && _lastModified > 0) {
    debug("cache-control", headers[CommonHeaders.CACHE_CONTROL], _lastModified, Date.now());
    if (sMaxAge && sMaxAge !== 31536e3) {
      const age = Math.round((Date.now() - _lastModified) / 1e3);
      const remainingTtl = Math.max(sMaxAge - age, 1);
      headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=2592000`;
    }
  }
  if (headers[CommonHeaders.NEXT_CACHE] !== "STALE")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = "s-maxage=2, stale-while-revalidate=2592000";
}
function createServerResponse(routingResult, headers, responseStream) {
  const internalEvent = routingResult.internalEvent;
  return new OpenNextNodeResponse((_headers) => {
    fixCacheHeaderForHtmlPages(internalEvent, _headers);
    fixSWRCacheHeader(_headers);
    addOpenNextHeader(_headers);
    fixISRHeaders(_headers);
  }, async (_headers) => {
    await revalidateIfRequired(internalEvent.headers.host, internalEvent.rawPath, _headers);
    await invalidateCDNOnRequest(routingResult, _headers);
  }, responseStream, headers, routingResult.rewriteStatusCode);
}
async function invalidateCDNOnRequest(params, headers) {
  const { internalEvent, resolvedRoutes, initialURL } = params;
  const initialPath = new URL(initialURL).pathname;
  const isIsrRevalidation = internalEvent.headers["x-isr"] === "1";
  if (!isIsrRevalidation && headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    await globalThis.cdnInvalidationHandler.invalidatePaths([
      {
        initialPath,
        rawPath: internalEvent.rawPath,
        resolvedRoutes
      }
    ]);
  }
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_stream();

// node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path2) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path2));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;

// node_modules/@opennextjs/aws/dist/core/util.js
init_logger();
import NextServer from "next/dist/server/next-server.js";

// node_modules/@opennextjs/aws/dist/core/require-hooks.js
init_logger();
var mod2 = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename2 = mod2._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/util.js
var cacheHandlerPath = __require.resolve("./cache.cjs");
var composableCacheHandlerPath = __require.resolve("./composable-cache.cjs");
var nextServer = new NextServer.default({
  conf: {
    ...NextConfig,
    // Next.js compression should be disabled because of a bug in the bundled
    // `compression` package — https://github.com/vercel/next.js/issues/11669
    compress: false,
    // By default, Next.js uses local disk to store ISR cache. We will use
    // our own cache handler to store the cache on S3.
    //#override stableIncrementalCache
    cacheHandler: cacheHandlerPath,
    cacheMaxMemorySize: 0,
    // We need to disable memory cache
    //#endOverride
    experimental: {
      ...NextConfig.experimental,
      // This uses the request.headers.host as the URL
      // https://github.com/vercel/next.js/blob/canary/packages/next/src/server/next-server.ts#L1749-L1754
      //#override trustHostHeader
      trustHostHeader: true,
      //#endOverride
      //#override composableCache
      cacheHandlers: {
        default: composableCacheHandlerPath
      }
      //#endOverride
    }
  },
  customServer: false,
  dev: false,
  dir: __dirname
});
var routesLoaded = false;
globalThis.__next_route_preloader = async (stage) => {
  if (routesLoaded) {
    return;
  }
  const thisFunction = globalThis.fnName ? globalThis.openNextConfig.functions[globalThis.fnName] : globalThis.openNextConfig.default;
  const routePreloadingBehavior = thisFunction?.routePreloadingBehavior ?? "none";
  if (routePreloadingBehavior === "none") {
    routesLoaded = true;
    return;
  }
  if (!("unstable_preloadEntries" in nextServer)) {
    debug("The current version of Next.js does not support route preloading. Skipping route preloading.");
    routesLoaded = true;
    return;
  }
  if (stage === "waitUntil" && routePreloadingBehavior === "withWaitUntil") {
    const waitUntil = globalThis.__openNextAls.getStore()?.waitUntil;
    if (!waitUntil) {
      error("You've tried to use the 'withWaitUntil' route preloading behavior, but the 'waitUntil' function is not available.");
      routesLoaded = true;
      return;
    }
    debug("Preloading entries with waitUntil");
    waitUntil?.(nextServer.unstable_preloadEntries());
    routesLoaded = true;
  } else if (stage === "start" && routePreloadingBehavior === "onStart" || stage === "warmerEvent" && routePreloadingBehavior === "onWarmerEvent" || stage === "onDemand") {
    const startTimestamp = Date.now();
    debug("Preloading entries");
    await nextServer.unstable_preloadEntries();
    debug("Preloading entries took", Date.now() - startTimestamp, "ms");
    routesLoaded = true;
  }
};
var requestHandler = (metadata) => "getRequestHandlerWithMetadata" in nextServer ? nextServer.getRequestHandlerWithMetadata(metadata) : nextServer.getRequestHandler();

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
globalThis.__openNextAls = new AsyncLocalStorage();
async function openNextHandler(internalEvent, options) {
  const initialHeaders = internalEvent.headers;
  const requestId = globalThis.openNextConfig.middleware?.external ? internalEvent.headers[INTERNAL_EVENT_REQUEST_ID] : Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: initialHeaders["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    await globalThis.__next_route_preloader("waitUntil");
    if (initialHeaders["x-forwarded-host"]) {
      initialHeaders.host = initialHeaders["x-forwarded-host"];
    }
    debug("internalEvent", internalEvent);
    const internalHeaders = {
      initialPath: initialHeaders[INTERNAL_HEADER_INITIAL_URL] ?? internalEvent.rawPath,
      resolvedRoutes: initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES] ? JSON.parse(initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES]) : [],
      rewriteStatusCode: Number.parseInt(initialHeaders[INTERNAL_HEADER_REWRITE_STATUS_CODE])
    };
    let routingResult = {
      internalEvent,
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      initialURL: internalEvent.url,
      ...internalHeaders
    };
    const headers = "type" in routingResult ? routingResult.headers : routingResult.internalEvent.headers;
    const overwrittenResponseHeaders = {};
    for (const [rawKey, value] of Object.entries(headers)) {
      if (!rawKey.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        continue;
      }
      const key = rawKey.slice(MIDDLEWARE_HEADER_PREFIX_LEN);
      if (key !== "x-middleware-set-cookie") {
        overwrittenResponseHeaders[key] = value;
      }
      headers[key] = value;
      delete headers[rawKey];
    }
    if ("isExternalRewrite" in routingResult && routingResult.isExternalRewrite === true) {
      try {
        routingResult = await globalThis.proxyExternalRequest.proxy(routingResult.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        routingResult = {
          internalEvent: {
            type: "core",
            rawPath: "/500",
            method: "GET",
            headers: {},
            url: constructNextUrl(internalEvent.url, "/500"),
            query: {},
            cookies: {},
            remoteAddress: ""
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          isISR: false,
          origin: false,
          initialURL: internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if ("type" in routingResult) {
      if (options?.streamCreator) {
        const response = createServerResponse({
          internalEvent,
          isExternalRewrite: false,
          isISR: false,
          resolvedRoutes: [],
          origin: false,
          initialURL: internalEvent.url
        }, routingResult.headers, options.streamCreator);
        response.statusCode = routingResult.statusCode;
        response.flushHeaders();
        const [bodyToConsume, bodyToReturn] = routingResult.body.tee();
        for await (const chunk of bodyToConsume) {
          response.write(chunk);
        }
        response.end();
        routingResult.body = bodyToReturn;
      }
      return routingResult;
    }
    const preprocessedEvent = routingResult.internalEvent;
    debug("preprocessedEvent", preprocessedEvent);
    const { search, pathname, hash } = new URL(preprocessedEvent.url);
    const reqProps = {
      method: preprocessedEvent.method,
      url: `${pathname}${search}${hash}`,
      //WORKAROUND: We pass this header to the serverless function to mimic a prefetch request which will not trigger revalidation since we handle revalidation differently
      // There is 3 way we can handle revalidation:
      // 1. We could just let the revalidation go as normal, but due to race conditions the revalidation will be unreliable
      // 2. We could alter the lastModified time of our cache to make next believe that the cache is fresh, but this could cause issues with stale data since the cdn will cache the stale data as if it was fresh
      // 3. OUR CHOICE: We could pass a purpose prefetch header to the serverless function to make next believe that the request is a prefetch request and not trigger revalidation (This could potentially break in the future if next changes the behavior of prefetch requests)
      headers: {
        ...headers
      },
      body: preprocessedEvent.body,
      remoteAddress: preprocessedEvent.remoteAddress
    };
    const mergeHeadersPriority = globalThis.openNextConfig.dangerous?.headersAndCookiesPriority ? globalThis.openNextConfig.dangerous.headersAndCookiesPriority(preprocessedEvent) : "middleware";
    const store = globalThis.__openNextAls.getStore();
    if (store) {
      store.mergeHeadersPriority = mergeHeadersPriority;
    }
    const req = new IncomingMessage(reqProps);
    const res = createServerResponse(routingResult, overwrittenResponseHeaders, options?.streamCreator);
    await processRequest(req, res, routingResult);
    const { statusCode, headers: responseHeaders, isBase64Encoded, body } = convertRes(res);
    const internalResult = {
      type: internalEvent.type,
      statusCode,
      headers: responseHeaders,
      body,
      isBase64Encoded
    };
    return internalResult;
  });
}
async function processRequest(req, res, routingResult) {
  delete req.body;
  const initialURL = new URL(
    // We always assume that only the routing layer can set this header.
    routingResult.internalEvent.headers[INTERNAL_HEADER_INITIAL_URL] ?? routingResult.initialURL
  );
  let invokeStatus;
  if (routingResult.internalEvent.rawPath === "/500") {
    invokeStatus = 500;
  } else if (routingResult.internalEvent.rawPath === "/404") {
    invokeStatus = 404;
  }
  const requestMetadata = {
    isNextDataReq: routingResult.internalEvent.query.__nextDataReq === "1",
    initURL: routingResult.initialURL,
    initQuery: convertToQuery(initialURL.search),
    initProtocol: initialURL.protocol,
    defaultLocale: NextConfig.i18n?.defaultLocale,
    locale: routingResult.locale,
    middlewareInvoke: false,
    // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
    invokePath: routingResult.internalEvent.rawPath,
    invokeQuery: routingResult.internalEvent.query,
    // invokeStatus is only used for error pages
    invokeStatus
  };
  try {
    req.url = initialURL.pathname + convertToQueryString(routingResult.internalEvent.query);
    await requestHandler(requestMetadata)(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, requestMetadata);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function handleNoFallbackError(req, res, routingResult, metadata, index = 1) {
  if (index >= 5) {
    await tryRenderError("500", res, routingResult.internalEvent);
    return;
  }
  if (index >= routingResult.resolvedRoutes.length) {
    await tryRenderError("404", res, routingResult.internalEvent);
    return;
  }
  try {
    await requestHandler({
      ...routingResult,
      invokeOutput: routingResult.resolvedRoutes[index].route,
      ...metadata
    })(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, metadata, index + 1);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function tryRenderError(type, res, internalEvent) {
  try {
    const _req = new IncomingMessage({
      method: "GET",
      url: `/${type}`,
      headers: internalEvent.headers,
      body: internalEvent.body,
      remoteAddress: internalEvent.remoteAddress
    });
    const requestMetadata = {
      // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
      invokePath: type === "404" ? "/404" : "/500",
      invokeStatus: type === "404" ? 404 : 500,
      middlewareInvoke: false
    };
    await requestHandler(requestMetadata)(_req, res);
  } catch (e) {
    error("NextJS request failed.", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      message: "Server failed to respond.",
      details: e
    }, null, 2));
  }
}

// node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_node(), cloudflare_node_exports));
  return m_1.default;
}
async function resolveTagCache(tagCache) {
  if (typeof tagCache === "function") {
    return tagCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveQueue(queue) {
  if (typeof queue === "function") {
    return queue();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy2(), dummy_exports2));
  return m_1.default;
}
async function resolveIncrementalCache(incrementalCache) {
  if (typeof incrementalCache === "function") {
    return incrementalCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy3(), dummy_exports3));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy4(), dummy_exports4));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}
async function resolveCdnInvalidation(cdnInvalidation) {
  if (typeof cdnInvalidation === "function") {
    return cdnInvalidation();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy5(), dummy_exports5));
  return m_1.default;
}

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
async function createMainHandler() {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  const thisFunction = globalThis.fnName ? config.functions[globalThis.fnName] : config.default;
  globalThis.serverId = generateUniqueId();
  globalThis.openNextConfig = config;
  await globalThis.__next_route_preloader("start");
  globalThis.queue = await resolveQueue(thisFunction.override?.queue);
  globalThis.incrementalCache = await resolveIncrementalCache(thisFunction.override?.incrementalCache);
  globalThis.tagCache = await resolveTagCache(thisFunction.override?.tagCache);
  if (config.middleware?.external !== true) {
    globalThis.assetResolver = await resolveAssetResolver(globalThis.openNextConfig.middleware?.assetResolver);
  }
  globalThis.proxyExternalRequest = await resolveProxyRequest(thisFunction.override?.proxyExternalRequest);
  globalThis.cdnInvalidationHandler = await resolveCdnInvalidation(thisFunction.override?.cdnInvalidation);
  const converter2 = await resolveConverter(thisFunction.override?.converter);
  const { wrapper, name } = await resolveWrapper(thisFunction.override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(openNextHandler, converter2);
}

// node_modules/@opennextjs/aws/dist/adapters/server-adapter.js
setNodeEnv();
setNextjsServerWorkingDirectory();
globalThis.internalFetch = fetch;
var handler2 = await createMainHandler();
function setNextjsServerWorkingDirectory() {
  process.chdir(__dirname);
}
export {
  handler2 as handler
};
