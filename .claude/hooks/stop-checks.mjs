// Claude Code Stop hook: before Claude ends a turn with code changes, lint the changed
// files and run the unit tests. On failure it exits with code 2, which sends Claude back
// to fix the problem (exit code 1 would let it stop anyway).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEST_COMMAND = "npm test";
const MAX_RETRIES = 3; // stop sending Claude back after this many failed attempts in one session

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd, args) => spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
const git = (...args) => run("git", args).stdout ?? "";
const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

// Changed = everything that differs from where this branch left main, committed or not.
const base = git("merge-base", "HEAD", "origin/main").trim();
const diff = base ? git("diff", base) : git("diff", "HEAD");
const tracked = (base ? git("diff", "--name-only", base) : git("diff", "--name-only", "HEAD")).split("\n");
const untracked = git("ls-files", "--others", "--exclude-standard").split("\n");
const code = [...new Set([...tracked, ...untracked])].filter(
  (f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f) && existsSync(join(root, f)),
);
if (code.length === 0) process.exit(0);

// Skip when nothing changed since the last passing run.
const stateFile = join(tmpdir(), `claude-stop-checks-${hash(root)}.json`);
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : {};
const key = hash(diff + untracked.map((f) => (f && existsSync(join(root, f)) ? f + statSync(join(root, f)).mtimeMs : "")).join());
if (state.passed === key) process.exit(0);

const failures = [];
const lint = run("npx", ["eslint", ...code.map((f) => JSON.stringify(f))]);
if (lint.status !== 0) failures.push(["Lint (npx eslint <changed files>)", lint]);
const test = run(TEST_COMMAND, []);
if (test.status !== 0) failures.push([`Tests (${TEST_COMMAND})`, test]);

const session = input.session_id || "unknown";
if (failures.length === 0) {
  writeFileSync(stateFile, JSON.stringify({ passed: key }));
  process.exit(0);
}

const tries = (state.retries?.[session] ?? 0) + 1;
writeFileSync(stateFile, JSON.stringify({ retries: { [session]: tries } }));
if (tries > MAX_RETRIES) process.exit(0);

const tail = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-60).join("\n");
console.error(
  `Checks failed (attempt ${tries} of ${MAX_RETRIES}). Fix them before finishing, or explain why they cannot pass.\n\n` +
    failures.map(([name, r]) => `## ${name}\n${tail(r)}`).join("\n\n"),
);
process.exit(2);
