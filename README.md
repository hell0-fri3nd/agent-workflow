# agent-workflow

My personal workflow: the prompts I type day to day, turned into reusable agent skills. Instead of re-explaining how I want something done, I ask for it and the agent loads the matching skill.

Skills follow the open [Agent Skills](https://agentskills.io/specification) format, so the same `SKILL.md` files work in Claude Code, Codex, Cline, OpenCode, Cursor, GitHub Copilot and Gemini CLI.

## Skills

| Skill | Use when |
|-------|----------|
| `commit` | Committing changes or writing commit messages |
| `system-version` | Deciding and applying the next version of a Next.js frontend |

This list grows whenever a prompt becomes a habit. See [Turning a prompt into a skill](#turning-a-prompt-into-a-skill).

## Install into a project

Run this in the root of the project where you want the skills. It installs every skill in this repo into that project only; nothing is installed globally.

```bash
npx skills add hell0-fri3nd/agent-workflow --skill '*'
```

This uses the open-source [`skills`](https://github.com/vercel-labs/skills) installer, which needs Node 22 or newer. It asks which agent tools you use (skip the question with `-a claude-code -a codex ...`), then creates:

```
your-project/
  .agents/skills/<skill>/SKILL.md   # Codex, Cline, OpenCode, Cursor, Copilot, Gemini CLI
  .claude/skills/<skill>/           # Claude Code
  skills-lock.json                  # what was installed, used by update
```

Useful options:

```bash
npx skills add hell0-fri3nd/agent-workflow --list                                 # see every skill
npx skills add hell0-fri3nd/agent-workflow --skill '*' -a claude-code -a codex -y  # just these tools, no prompts
npx skills add hell0-fri3nd/agent-workflow --skill '*' --copy                     # real copies instead of symlinks
npx skills update                                                 # pull newer versions
npx skills remove commit                                          # uninstall one
```

Use `--copy` if you will commit the installed skills to the project. By default `.claude/skills/` holds symlinks with absolute paths, and those break for anyone who clones the repo.

Avoid the installer's `--all` flag: it also targets every agent tool it knows, which adds around 50 hidden folders (`.windsurf/`, `.roo/`, `.kiro/` ...) to your project.

## Use a skill

Ask for the task in plain words ("commit my changes") and the agent loads the matching skill by itself. To call one explicitly:

| Tool | Call a skill | List skills |
|------|--------------|-------------|
| Claude Code | `/commit` | `/skills` |
| Codex | `$commit` | `/skills` |
| Copilot CLI | `/commit` in your prompt | `/skills list` |
| Cline, Cursor | type `/`, pick the skill | Skills panel |
| OpenCode, Gemini CLI | ask in plain words; the agent loads it | `/skills list` (Gemini) |

## Claude Code plugin (alternative)

Claude Code can also load this repo as a plugin instead of copying files. To limit it to one project:

```bash
claude plugin marketplace add hell0-fri3nd/agent-workflow --scope project
claude plugin install agent-workflow@agent-workflow --scope project
```

This records the plugin in the project's `.claude/settings.json` instead of creating skill folders. Every skill comes with it, called as `/agent-workflow:commit` and so on.

## Layout

```
.agents/skills/
  <skill-name>/
    SKILL.md            # the skill; extra reference files or scripts go beside it
.claude-plugin/
  marketplace.json      # Claude Code plugin + marketplace ("skills": "./.agents/skills/")
scripts/skills.mjs      # validate skills before pushing
templates/skill-template/
  SKILL.md              # copy this to start a new skill (not loaded as a skill)
```

`.agents/skills/` is the single source of truth. Don't keep hand-edited copies anywhere else in this repo.

## Turning a prompt into a skill

A prompt is worth converting when you've typed it, or a version of it, three or more times, or when you keep adding the same corrections ("no, split the commits", "don't push").

1. **Collect the prompt.** Paste the prompt you use, plus the corrections you usually have to add afterwards. Those corrections are the most valuable part.
2. **Name the action.** Copy `templates/skill-template/` to `.agents/skills/<skill-name>/`. Name it after what you'd ask for: `commit`, `review-pr`, `write-tests`. Set `name` to exactly the folder name: lowercase letters, digits and single hyphens, 64 characters max. Some tools, Copilot in VS Code for example, silently skip a skill whose name breaks these rules.
3. **Write the trigger, not the summary.** `description` says *when* to use the skill: the words you'd normally type, starting "Use when...", in 1024 characters or fewer. Agents read only the description to decide whether to load the skill, so a description that summarizes the steps gets followed instead of the skill.
4. **Write the body from the prompt.** Turn the prompt into steps, and turn each habitual correction into an explicit rule. Use only the spec's frontmatter fields: `name`, `description`, and optionally `license`, `compatibility`, `metadata`, `allowed-tools`.
5. **Check it changes something.** Give an agent a realistic task once without the skill and once with it. Keep only the rules that fix what went wrong without it.
6. Run `node scripts/skills.mjs validate`, bump `version` in `.claude-plugin/marketplace.json`, then commit and push. Every skill in `.agents/skills/` ships automatically; there is no list to update.

## License

[MIT](LICENSE). Fork it, copy the skills, adapt them to your own workflow.
