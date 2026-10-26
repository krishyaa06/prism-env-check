const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { parse, check, generateExample, mask } = require("../src");
const ex = path.join(__dirname, "../examples");
const bin = path.join(__dirname, "../bin/envcheck.js");

test("parse dotenv", () => {
  const r = parse('export A=1\nB="two words" # note\nC=\'x#y\'\nD=val # @type=int\n# @optional\nE=\nF="multi\nline"\nbad line');
  assert.deepEqual(r.slice(0, 6).map((e) => [e.key, e.value]), [["A", "1"], ["B", "two words"], ["C", "x#y"], ["D", "val"], ["E", ""], ["F", "multi\nline"]]);
  assert.equal(r[1].comment, "note"); assert.equal(r[3].meta.type, "int"); assert.equal(r[4].meta.required, false);
  assert.equal(r[6].error, "Not a KEY=value line");
});
test("check demo", () => {
  const r = check(parse(fs.readFileSync(path.join(ex, "broken.env"), "utf8")), parse(fs.readFileSync(path.join(ex, ".env.example"), "utf8")));
  const codes = Object.fromEntries(r.issues.map((i) => [i.key + ":" + i.code, i.level]));
  assert.equal(codes["PORT:type"], "error"); assert.equal(codes["NODE_ENV:type"], "error");
  assert.equal(codes["JWT_SECRET:min"], "error"); assert.equal(codes["JWT_SECRET:placeholder"], "warn");
  assert.equal(codes["OPENAI_API_KEY:pattern"], "error"); assert.equal(codes["STRIPE_KEY:extra"], "warn");
  assert.ok(!("OPENAI_MODEL:missing" in codes)); assert.ok(!("DEBUG:missing" in codes));
  assert.equal(r.ok, 2);
});
test("valid env passes", () => {
  const r = check(parse("PORT=8080\nURL=https://x.dev"), parse("PORT= # @type=port\nURL= # @type=url"));
  assert.equal(r.issues.length, 0);
});
test("generateExample blanks secrets", () => {
  const g = generateExample("PORT=3000\nOPENAI_API_KEY=sk-abc\n# db\nDATABASE_URL=postgres://u:p@h/db\nDEBUG=true");
  assert.match(g, /# @type=port\nPORT=3000/); assert.match(g, /OPENAI_API_KEY=\n/); assert.match(g, /DATABASE_URL=\n/); assert.match(g, /DEBUG=true/);
  assert.equal(mask("sk-1234567890"), "sk-••••••••90");
});
test("cli", () => {
  assert.equal(spawnSync("node", [bin, "-e", path.join(ex, "broken.env"), "-x", path.join(ex, ".env.example")]).status, 1);
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "envc-"));
  fs.writeFileSync(path.join(d, ".env"), "PORT=1\n"); fs.writeFileSync(path.join(d, ".env.example"), "PORT= # @type=port\n");
  assert.equal(spawnSync("node", [bin], { cwd: d }).status, 0);
  fs.rmSync(path.join(d, ".env.example"));
  assert.equal(spawnSync("node", [bin, "--gen"], { cwd: d }).status, 0);
  assert.ok(fs.existsSync(path.join(d, ".env.example")));
  assert.equal(spawnSync("node", [bin, "-e", "nope"], { cwd: d }).status, 2);
});
