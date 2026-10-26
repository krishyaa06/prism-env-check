"use strict";
const fs = require("node:fs");

/** Parse dotenv text → [{key, value, line, comment, meta}] (supports export, quotes, multiline "..."). */
function parse(text) {
  const out = []; const lines = String(text).replace(/\r\n?/g, "\n").split("\n"); let pending = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], t = raw.trim();
    if (!t) { pending = []; continue; }
    if (t.startsWith("#")) { pending.push(t.replace(/^#+\s?/, "")); continue; }
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(t);
    if (!m) { out.push({ key: null, line: i + 1, raw, error: "Not a KEY=value line" }); pending = []; continue; }
    let v = m[2], inline = "";
    const q = v[0];
    if (q === '"' || q === "'" || q === "`") {
      let end = v.indexOf(q, 1), j = i;
      while (end === -1 && q === '"' && j + 1 < lines.length) { v += "\n" + lines[++j]; end = v.indexOf(q, 1); }
      i = j;
      if (end === -1) { out.push({ key: m[1], line: i + 1, raw, error: "Unclosed quote" }); pending = []; continue; }
      inline = v.slice(end + 1).replace(/^\s*#\s?/, "").trim();
      v = v.slice(1, end); if (q === '"') v = v.replace(/\\n/g, "\n");
    } else { const h = v.startsWith("#") ? 0 : v.search(/\s#/); if (h >= 0) { inline = v.slice(h).replace(/^\s*#\s?/, "").trim(); v = v.slice(0, h); } v = v.trim(); }
    const comment = [...pending, inline].filter(Boolean).join(" ");
    out.push({ key: m[1], value: v, line: i + 1, comment, meta: parseMeta(comment) }); pending = [];
  }
  return out;
}
/** Annotations: @optional @type=url  @enum=a|b  @min=1 @max=10 @pattern=^sk-  or shorthand words "url", "number", "optional". */
function parseMeta(comment) {
  const meta = { required: true, type: null };
  for (const m of String(comment).matchAll(/@(\w+)(?:[=:](\S+))?/g)) {
    const [, k, v] = m;
    if (k === "optional") meta.required = false; else if (k === "required") meta.required = true;
    else if (k === "type") meta.type = v; else if (k === "enum") { meta.type = "enum"; meta.enum = v.split("|"); }
    else if (k === "min" || k === "max") meta[k] = +v; else if (k === "pattern") meta.pattern = v; else if (k === "secret") meta.secret = true;
    else if (TYPES[k]) meta.type = k;
  }
  return meta;
}
const TYPES = {
  string: () => true,
  number: (v) => v !== "" && !isNaN(Number(v)),
  int: (v) => /^-?\d+$/.test(v),
  port: (v) => /^\d+$/.test(v) && +v > 0 && +v < 65536,
  boolean: (v) => /^(true|false|1|0|yes|no|on|off)$/i.test(v),
  url: (v) => { try { const u = new URL(v); return !!u.protocol && !!u.host; } catch { return false; } },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  json: (v) => { try { JSON.parse(v); return true; } catch { return false; } },
  enum: (v, m) => m.enum.includes(v),
};
const PLACEHOLDER = /^(changeme|change[-_]me|todo|xxx+|your[-_ ].*|<.*>|\.\.\.|replace[-_ ]?me|secret|password|example)$/i;

function check(env, example, { strict = false } = {}) {
  const issues = [], envMap = new Map(), exMap = new Map();
  for (const e of env) { if (e.error) issues.push({ level: "error", key: e.key, line: e.line, code: "syntax", msg: e.error }); else { if (envMap.has(e.key)) issues.push({ level: "warn", key: e.key, line: e.line, code: "duplicate", msg: `Duplicate key (line ${envMap.get(e.key).line} is overridden)` }); envMap.set(e.key, e); } }
  for (const e of example) if (!e.error) exMap.set(e.key, e);
  for (const [key, ex] of exMap) {
    const m = ex.meta, got = envMap.get(key);
    if (!got) { if (m.required) issues.push({ level: "error", key, code: "missing", msg: "Missing (defined in example)", hint: ex.value ? `e.g. ${key}=${ex.value}` : ex.comment }); continue; }
    const v = got.value;
    if (v === "") { if (m.required) issues.push({ level: "error", key, line: got.line, code: "empty", msg: "Empty value" }); continue; }
    if (PLACEHOLDER.test(v) || (ex.value && v === ex.value && /x{4,}|your|change|<|example/i.test(v))) issues.push({ level: "warn", key, line: got.line, code: "placeholder", msg: `Still a placeholder: "${v}"` });
    if (m.type && TYPES[m.type] && !TYPES[m.type](v, m)) issues.push({ level: "error", key, line: got.line, code: "type", msg: m.type === "enum" ? `Must be one of ${m.enum.join(" | ")}` : `Not a valid ${m.type}`, value: v });
    if (m.min != null && (TYPES.number(v) ? +v < m.min : v.length < m.min)) issues.push({ level: "error", key, line: got.line, code: "min", msg: `Below min ${m.min}` });
    if (m.max != null && (TYPES.number(v) ? +v > m.max : v.length > m.max)) issues.push({ level: "error", key, line: got.line, code: "max", msg: `Above max ${m.max}` });
    if (m.pattern && !new RegExp(m.pattern).test(v)) issues.push({ level: "error", key, line: got.line, code: "pattern", msg: `Doesn't match /${m.pattern}/` });
  }
  for (const [key, e] of envMap) if (!exMap.has(key)) issues.push({ level: strict ? "error" : "warn", key, line: e.line, code: "extra", msg: "Not in example (undocumented)" });
  return { issues, total: exMap.size, ok: [...exMap.keys()].filter((k) => envMap.has(k) && !issues.some((i) => i.key === k && i.level === "error")).length };
}
const SECRETY = /(KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|PRIVATE|CREDENTIAL|AUTH|DSN|DATABASE_URL|_URI)$/i;
/** .env → .env.example: blank out secrets, keep safe defaults, keep comments. */
function generateExample(text) {
  return parse(text).filter((e) => !e.error).map((e) => {
    const guess = TYPES.port(e.value) && /PORT/i.test(e.key) ? "port" : TYPES.boolean(e.value) ? "boolean" : TYPES.url(e.value) ? "url" : TYPES.int(e.value) ? "int" : null;
    const secret = SECRETY.test(e.key);
    const tags = [guess && `@type=${guess}`, secret && "@secret"].filter(Boolean).join(" ");
    const head = [e.comment && !e.comment.startsWith("@") ? `# ${e.comment.replace(/@\S+/g, "").trim()}` : "", tags ? `# ${tags}` : ""].filter((s) => s && s !== "#").join("\n");
    return `${head ? head + "\n" : ""}${e.key}=${secret ? "" : /\s|#/.test(e.value) ? JSON.stringify(e.value) : e.value}`;
  }).join("\n\n") + "\n";
}
const mask = (v) => !v ? "" : v.length <= 6 ? "•".repeat(v.length) : v.slice(0, 3) + "•".repeat(Math.min(12, v.length - 5)) + v.slice(-2);
const readEnv = (f) => parse(fs.readFileSync(f, "utf8"));
module.exports = { parse, parseMeta, TYPES, check, generateExample, mask, readEnv, SECRETY };
