# sanity-kb-skills

One agent skill, `sanity-kb-setup`. It takes a Sanity project to a Sanity Context Knowledge Base that coding agents can read over MCP, and it checks that what the Knowledge Base says is actually true.

It follows the open [Agent Skills](https://agentskills.io/specification) format, so it works in Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and other agents that read `SKILL.md` folders.

## What a run looks like

You say "set up a Knowledge Base for this project". The agent works through six stages and stops where a person has to decide.

1. **Plan.** It reads the repo and writes `kb-setup.md` and `kb-query.groq`. They cover the purpose, one GROQ query, the file sources, the expected outline and the disagreements it already spotted in the content. You approve the plan.
2. **Create.** It creates the Knowledge Base with the Sanity CLI, adds the sources and builds. If one already matches the intended audience, purpose and sources, it reuses it and refreshes its imports before rebuilding.
3. **Check.** It reads the entries the build wrote and compares three things, which are what the sources claim, what each entry says, and which issues the build raised. Then it prints every disagreement as a choice, including the ones the build settled without telling anyone.
   ```
   1. Return window
      A. 14 days   ← the returns policy says this
      B. 28 days   (from the FAQ)
   ```
   You reply `1A 2A 3B`.
4. **Resolve.** It resolves your picks, which creates the standing instructions.
5. **Fix content.** It finds where each losing claim lives, shows you the exact edits, and writes them guarded by the revision it reviewed, as drafts unless you ask for a direct publish. Then it refreshes, rebuilds and checks again.
6. **Connect.** It walks you through the MCP endpoint and the token, confirms the endpoint serves this Knowledge Base and not another one, and writes the config for your agent.

You can stop after stage 3. If you keep conflicts on purpose, for a demo or to test a checking tool, the skill records that and skips stages 4 and 5.

When something is missing or a result looks wrong, `references/blocked.md` tells the agent how to get you past it. It covers a missing Sanity project, a login, an empty query result that isn't really empty, an organisation at its Knowledge Base limit, an organisation token, and 401, 403 and 409 errors.

## Install

Any agent, with Vercel's [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add chiburoboto/sanity-kb-skills
```

Add `-a codex cursor` to pick agents, or `-g` to install for every project.

Claude Code, as a plugin:

```
/plugin marketplace add chiburoboto/sanity-kb-skills
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

- A Node version supported by the installed Sanity packages. The tested Sanity 6.14.0 requires Node >=22.12; check `engines.node` when using a different version.
- A Sanity project with the `sanity` package installed, recent enough that `npx sanity context --help` works.
- `npx sanity login`. Stages 1 to 5 use that login and need no token.
- Context and Knowledge Bases turned on for the organisation. It is an opt-in beta.
- For stage 6, an organisation API token with Context Viewer permission. You create it and keep it in an environment variable. The agent never sees it.

## How the skill is laid out

This is an instructions-first skill. Most of its value is in what to check and which mistakes to avoid, so the agent does the work with the Sanity CLI and the project's own files. `SKILL.md` is a short router, and the agent opens one reference file per stage.

```
skills/sanity-kb-setup/
  SKILL.md
  references/
    plan.md  create.md  check.md  resolve.md  fix-content.md
    connect-agents.md  blocked.md  cli.md  api.md
    type-roles-and-queries.md  turbo-start-sanity.md
  assets/kb-setup-template.md
  scripts/kb-issues.mjs
```

- `api.md` has short `@sanity/client` examples for what the CLI can't do, which is reading entries, listing and resolving issues, and editing content with a revision guard. Each example was run against a real Knowledge Base.
- `scripts/kb-issues.mjs` is the one bundled script, and it is optional. It lists issues. Earlier versions shipped five scripts. The rest were removed because a generic patcher and a generic text search add risk and duplicate what an agent does better with the real schema in front of it.

## Safety

- The agent asks before creating a Knowledge Base, before resolving, and before writing to the dataset.
- It never picks which claim is true. A person does.
- Every content edit carries the revision the agent reviewed, so it can't overwrite a newer edit. Edits default to drafts.
- It never seeds or imports content into a real project. Seeding is for demo projects only.
- It never deletes a Knowledge Base unless you name it.
- Tokens stay in environment variables.

## Things to know

- A build doesn't catch every conflict, and two builds of the same sources can differ. In testing, a build wrote "we ship to the US" into an entry and raised no issue. That is why stage 3 reads the entries.
- The CLI's `context` commands and the `client.context` API aren't in Sanity's public docs, so they may change. The skill falls back to the dashboard when they do.
- On Windows, shell and command-shim argument handling can strip quotes from GROQ and produce a misleading empty result. `references/cli.md` has a tested quoting form and a direct Node fallback.
- `SKILL.md` uses the `compatibility` and `metadata` fields from the Agent Skills specification. Some older validators reject `compatibility`. The specification allows it.
- There is no LICENSE file yet, so others have no stated right to reuse the code.
