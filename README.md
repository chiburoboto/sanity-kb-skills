# sanity-kb-skills

One agent skill, `sanity-kb-setup`. It takes a Sanity project from nothing to a clean Sanity Context Knowledge Base that coding agents can read over MCP.

It follows the open [Agent Skills](https://agentskills.io/specification) format, so it works in Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and other agents that read `SKILL.md` folders.

## What a run looks like

You say "set up a Knowledge Base for this project". The agent then works through six stages and stops where a person has to decide.

1. **Plan.** It reads the repo and writes `kb-setup.md` and `kb-query.groq`. It covers the purpose, one GROQ query, the file sources and the expected outline. You approve the plan.
2. **Create.** It creates the Knowledge Base with the Sanity CLI, adds the sources and builds.
3. **Check.** When the build ends, it prints every conflict as a choice.
   ```
   1. Return window
      A. 14 days   ← the returns policy says this
      B. 28 days   (from the FAQ)
   ```
   You reply `1A 2A 3B`.
4. **Resolve.** It resolves your picks, which creates the standing instructions.
5. **Fix content.** It finds every copy of each losing claim in the dataset and corrects it, as drafts unless you ask for a direct publish. Then it refreshes, rebuilds and checks again.
6. **Connect.** It walks you through the MCP endpoint and the token, tests the endpoint, and writes the config for your agent.

When something is missing, `references/blocked.md` tells the agent how to get you past it. It covers a missing Sanity project, a login, an organisation at its Knowledge Base limit, an organisation token, 401 and 403 errors, and more.

## Install

Any agent, with Vercel's [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add <owner>/sanity-kb-skills
```

Add `-a codex cursor` to pick agents, or `-g` to install for every project.

Claude Code, as a plugin:

```
/plugin marketplace add <owner>/sanity-kb-skills
/plugin install sanity-kb-setup@sanity-kb-skills
```

By hand, copy `skills/sanity-kb-setup/` into the folder your agent reads.

| Agent | Project folder | User folder |
|---|---|---|
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Codex | `.agents/skills` | `~/.agents/skills` |
| Cursor | `.cursor/skills` or `.agents/skills` | `~/.cursor/skills` |
| GitHub Copilot | `.github/skills` or `.agents/skills` | `~/.copilot/skills` |
| Gemini CLI | `.gemini/skills` or `.agents/skills` | `~/.gemini/skills` |

For claude.ai, zip the `sanity-kb-setup` folder and upload it under Settings, then Features, then Skills.

## Requirements

- Node 18 or later.
- A Sanity project with the `sanity` package installed, recent enough that `npx sanity context --help` works.
- `npx sanity login`. Stages 1 to 5 use that login and need no token.
- Context and Knowledge Bases turned on for the organisation. It is an opt-in beta.
- For stage 6, an organisation API token with Context Viewer permission. You create it and keep it in an environment variable. The agent never sees it.

## How the skill is laid out

`SKILL.md` is a short router. It holds the stage table, five facts about Knowledge Bases and the ground rules. The agent opens one reference file per stage, so a resolve-only run never loads the planning guide.

```
skills/sanity-kb-setup/
  SKILL.md
  references/
    plan.md  create.md  check.md  resolve.md  fix-content.md
    connect-agents.md  blocked.md  cli.md
    type-roles-and-queries.md  turbo-start-sanity.md
  assets/kb-setup-template.md
  scripts/
    kb-issues.mjs  kb-resolve.mjs  kb-find.mjs  kb-patch.mjs  kb-mcp-check.mjs
```

The scripts are plain Node with no dependencies of their own. They borrow the Sanity CLI from the project they run in.

## Safety

- The agent asks before creating a Knowledge Base, before resolving, and before writing to the dataset.
- It never picks which claim is true. A person does.
- Content fixes default to drafts.
- It never deletes a Knowledge Base unless you name it.
- Tokens stay in environment variables.

## Things to know

- A build doesn't catch every conflict, and two builds of the same sources can differ. The skill reports the conflicts it expected and the build missed.
- The CLI's `context` commands and the issues API aren't in Sanity's public docs, so they may change. The skill falls back to the dashboard when they do.
- Before publishing this repo, replace `<owner>`, add a LICENSE, and run `claude plugin validate .` and `npx skills add ./ --list` from the repo root. Neither installer has been run against this exact layout yet.
