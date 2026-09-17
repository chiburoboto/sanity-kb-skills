# sanity-kb-skills

**This skill has moved.** `sanity-kb-setup` now lives in [`robotostudio/team-memory`](https://github.com/robotostudio/team-memory/tree/main/skills/sanity-kb-setup), and fixes land there. This repo no longer holds the skill files, so installing from here finds nothing.

## Install the current version

```bash
npx skills add robotostudio/team-memory --skill sanity-kb-setup
```

`team-memory` holds several skills, so `--skill` picks this one. Add `-a codex cursor` to pick agents, or `-g` to install for every project.

Roboto teammates who use `roboto-mem` don't need the command. `roboto-mem sync` copies every skill in `team-memory` into `~/.claude/skills` at the next session start.

## What it does

`sanity-kb-setup` takes a Sanity project to a Sanity Context Knowledge Base that coding agents can read over MCP, and checks that what the Knowledge Base says is true. It plans from the repo, creates and builds with the Sanity CLI, reads the entries the build wrote, prints every disagreement as an A/B choice, resolves the picks, corrects the losing claims in the content, rebuilds, and connects the agent. The full description is in the skill's `SKILL.md` at the new location.

## The old copy

The last version kept here was 1.1.1. It is tagged [`v1.1.1`](https://github.com/chiburoboto/sanity-kb-skills/tree/v1.1.1) and has known bugs that 1.2.0 fixed: the delete commands lacked `--yes`, the check relied on Sanity's unreliable `openIssueCount`, and the token check only worked in bash.
