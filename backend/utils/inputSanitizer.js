//! THIS code is purely made with AI and needs reviewing

const xssLib = require("xss");
const sanitizeHtml = require("sanitize-html");

function escapeHtmlFallback(str) {
  return String(str).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}

function escapeWithXss(str) {
  if (!str && str !== "") return str;
  // Prefer filterXSS with empty whitelist to escape everything
  if (xssLib && typeof xssLib.filterXSS === "function") {
    return xssLib.filterXSS(String(str), { whiteList: {} });
  }
  if (typeof xssLib === "function") {
    return xssLib(String(str));
  }
  return escapeHtmlFallback(String(str));
}

function stripWithSanitizeHtml(str) {
  if (str === undefined || str === null) return str;
  return sanitizeHtml(String(str), { allowedTags: [], allowedAttributes: {} });
}

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepSanitize(value, options = { mode: "escape" }) {
  const { mode } = options; // mode: 'escape' | 'strip'
  const sanitizeString =
    mode === "strip" ? stripWithSanitizeHtml : escapeWithXss;

  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepSanitize(v, options));
  }
  if (isPlainObject(value)) {
    const out = {};
    for (const k of Object.keys(value)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype")
        continue;
      out[k] = deepSanitize(value[k], options);
    }
    return out;
  }
  return value; // numbers, booleans, null, etc.
}

//* Middleware implementation

function sanitizeInputs(options = { mode: "escape" }) {
  return (req, res, next) => {
    try {
      if (req.body) {
        req.body = deepSanitize(req.body, { mode: options.mode });
      }
      if (req.params) {
        req.params = deepSanitize(req.params, { mode: options.mode });
      }
    } catch (err) {
      console.warn("sanitizeInputs middleware failed:", err);
    }
    next();
  };
}

module.exports = sanitizeInputs;
