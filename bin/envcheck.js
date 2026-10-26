#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const { check, generateExample, readEnv, parse, mask, SECRETY } = require("../src");
const { c, header, plural, table } = require("../src/ui");
const pkg = require("../package.json");

const HELP = `${header("envcheck", "validate .env against .env.example")}

${c.bold("Usage")}
  envcheck                         check .env against .env.example
  envcheck -e .env.local -x .env.example
  envcheck --gen                   create .env.example from .env (secrets blanked)
  envcheck --show                  print .env with secrets masked

${c.bold("Options")}
  -e, --env <file>       env file          (default: .env)
  -x, --example <file>   example / schema  (default: .env.example)
      --process          check process.env instead of a file (CI / Docker)
      --strict           undocumented keys are errors
      --json             machine-readable output
  -o, --out <file>       with --gen: write here (default: .env.example)
  -v, --version / -h, --help

${c.bold("Schema")} — annotate keys in .env.example with comments:
  ${c.gray("# @type=url")}               ${c.gray("# @type=port")}      ${c.gray("# @enum=dev|prod")}
  ${c.gray("PORT=3000 # @type=port")}    ${c.gray("# @optional")}       ${c.gray("# @pattern=^sk-")}  ${c.gray("# @min=32")}`;

let a;
try { a = parseArgs({ allowPositionals: true, options: { env: { type: "string", short: "e", default: ".env" }, example: { type: "string", short: "x", default: ".env.example" }, process: { type: "boolean" }, strict: { type: "boolean" }, json: { type: "boolean" }, gen: { type: "boolean" }, show: { type: "boolean" }, out: { type: "string", short: "o" }, force: { type: "boolean" }, version: { type: "boolean", short: "v" }, help: { type: "boolean", short: "h" } } }); }
catch (e) { console.error(c.red(`✖ ${e.message}`)); process.exit(2); }
const o = a.values;
if (o.help) { console.log(HELP); process.exit(0); }
if (o.version) { console.log(pkg.version); process.exit(0); }
const need = (f) => { if (!fs.existsSync(f)) { console.error(c.red(`✖ ${f} not found`)); process.exit(2); } };

if (o.gen) {
  need(o.env); const out = o.out || o.example;
  const txt = generateExample(fs.readFileSync(o.env, "utf8"));
  if (out === "-") { process.stdout.write(txt); process.exit(0); }
  if (fs.existsSync(out) && !o.force) { console.error(c.yellow(`⚠ ${out} exists — use --force to overwrite or -o - to print`)); process.exit(1); }
  fs.writeFileSync(out, txt); console.log(`${c.green("✔")} Wrote ${c.bold(out)} (${plural(parse(txt).length, "key")}, secrets blanked)`); process.exit(0);
}
if (o.show) {
  need(o.env);
  console.log(header("envcheck", o.env));
  console.log("\n" + table(readEnv(o.env).filter((e) => !e.error).map((e) => [c.bold(e.key), SECRETY.test(e.key) ? c.dim(mask(e.value)) : c.cyan(e.value.replace(/\n/g, "⏎"))]), { head: ["KEY", "VALUE"] }));
  process.exit(0);
}

need(o.example);
const env = o.process ? Object.entries(process.env).map(([key, value], i) => ({ key, value, line: 0 })) : (need(o.env), readEnv(o.env));
const example = readEnv(o.example);
const r = check(env, example, { strict: o.strict });
if (o.process) r.issues = r.issues.filter((i) => i.code !== "extra");
const errors = r.issues.filter((i) => i.level === "error");
if (o.json) { console.log(JSON.stringify(r, null, 2)); process.exit(errors.length ? 1 : 0); }

console.log(header("envcheck", `${o.process ? "process.env" : o.env} ↔ ${o.example}`));
if (!r.issues.length) { console.log(`\n${c.green("✔")} All ${plural(r.total, "variable")} present and valid`); process.exit(0); }
console.log();
const ICON = { error: c.red("✖"), warn: c.yellow("⚠") };
for (const i of r.issues.sort((x, y) => (x.level === "error" ? 0 : 1) - (y.level === "error" ? 0 : 1)))
  console.log(`  ${ICON[i.level]} ${c.bold(i.key || "?").padEnd(28)} ${i.level === "error" ? c.red(i.msg) : c.yellow(i.msg)}${i.line ? c.dim(`  :${i.line}`) : ""}${i.hint ? `\n    ${c.gray("  " + i.hint)}` : ""}`);
const warns = r.issues.length - errors.length;
console.log(`\n${c.green(`${r.ok}/${r.total} ok`)} · ${errors.length ? c.red(plural(errors.length, "error")) : c.green("0 errors")} · ${c.yellow(plural(warns, "warning"))}`);
process.exit(errors.length ? 1 : 0);
