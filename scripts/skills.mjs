#!/usr/bin/env node
// Validate every skill in .agents/skills against the Agent Skills spec
// (https://agentskills.io/specification). Some tools, Copilot in VS Code for
// example, silently skip a skill that breaks these rules.
//
//   node scripts/skills.mjs validate

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../.agents/skills");

// 1-64 chars, lowercase/digits/hyphens, no leading, trailing or double hyphen.
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

function validate() {
  let errors = 0;
  const fail = (skill, msg) => {
    console.error(`  ✗ ${skill}: ${msg}`);
    errors++;
  };
  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const { name: skill } of skills) {
    const before = errors;
    const file = join(SKILLS_DIR, skill, "SKILL.md");
    if (!existsSync(file)) { fail(skill, "missing SKILL.md"); continue; }
    const fm = frontmatter(readFileSync(file, "utf8"));
    if (!fm) { fail(skill, "missing --- frontmatter ---"); continue; }
    if (!fm.name) fail(skill, "missing name");
    else {
      if (fm.name !== skill) fail(skill, `name "${fm.name}" must match folder "${skill}"`);
      if (fm.name.length > 64 || !NAME_RE.test(fm.name)) fail(skill, "name must be 1-64 chars of a-z, 0-9 and single hyphens");
    }
    if (!fm.description) fail(skill, "missing description");
    else if (fm.description.length > 1024) fail(skill, `description is ${fm.description.length} chars (max 1024)`);
    if (errors === before) console.log(`  ✓ ${skill}`);
  }
  return errors;
}

if (process.argv[2] === "validate") {
  process.exit(validate() ? 1 : 0);
} else {
  console.error("usage: node scripts/skills.mjs validate");
  process.exit(2);
}
