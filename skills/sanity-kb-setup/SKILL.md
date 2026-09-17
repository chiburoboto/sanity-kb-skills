---
name: sanity-kb-setup
description: Set up a Sanity Context Knowledge Base end to end. Plans it from the repo (purpose, GROQ query, file sources), creates and builds it with the Sanity CLI, reads the entries the build wrote, prints the conflicts as A/B choices, resolves the ones the user picks, corrects the losing claims in the Sanity content, refreshes and rebuilds, then connects coding agents to it over MCP. Also unblocks the user when something is missing, such as a Sanity project, a login, an organisation token or a free Knowledge Base slot. Use whenever someone wants to set up, build, audit or fix a Sanity Knowledge Base, resolve its issues or conflicts, or connect Claude Code, Cursor, Codex or another agent to one, even if they only say "KB", "what did the build flag" or "pick the winners".
compatibility: Needs Node 18 or later, a Sanity project with the `sanity` package installed, and `npx sanity login`.
metadata:
  version: "1.1.0"
---

# Sanity Knowledge Base setup

Take a Sanity project to a Knowledge Base that agents can read and trust. This skill is mostly instructions. It tells you what to check and which mistakes to avoid. You do the work with the Sanity CLI, the project's own files, and the short API examples in `references/api.md`.

Read only the file for the stage you are in.

| Stage | When | Read |
|---|---|---|
| 1. Plan | No `kb-setup.md` in the project yet | `references/plan.md`, then `references/type-roles-and-queries.md`. For a `turbo-start-sanity` repo also read `references/turbo-start-sanity.md` |
| 2. Create | The user said yes to the plan | `references/create.md` and `references/cli.md` |
| 3. Check | A build or rebuild just finished | `references/check.md` and `references/api.md` |
| 4. Resolve | The user replied with picks such as `1A 2B` | `references/resolve.md` and `references/api.md` |
| 5. Fix content | Issues are resolved but the documents still hold the losing claims | `references/fix-content.md` |
| 6. Connect | The user wants an agent to read the Knowledge Base | `references/connect-agents.md` |
| Blocked | A command fails, a result looks wrong, or something is missing | `references/blocked.md` |

Stages 2 to 5 are one flow. When a build finishes, go straight to stage 3. "The build is done" is not a stopping point. The stops are the ones marked in the stage files, where a person has to say yes or pick.

## Find out where things stand first

Don't assume a fresh start. Before any stage, check what already exists.

- `kb-setup.md` in the project means a plan exists. Read it. It records the Knowledge Base id once one is created.
- `npx sanity context list --organization <org-id>` shows existing Knowledge Bases. If one matches this project, reuse it. Never create a second one for the same content.
- `npx sanity context imports list <kb-id>` shows which sources already imported. Don't add a source twice.

Then say which state the Knowledge Base is in, using these words.

| State | Means |
|---|---|
| Planned | `kb-setup.md` exists, nothing is created |
| Built | Sources imported and a build finished. Nobody has checked what it says |
| Reviewed | You read the entries and compared them with the source claims, and the user has seen every disagreement, raised or missed |
| Clean | Reviewed, the user's picks are resolved, the content is corrected, and a rebuild raised nothing new |
| Connected | An agent reads it, and you confirmed the endpoint serves this Knowledge Base |

A Knowledge Base can be Connected without being Clean. Some users keep conflicts on purpose, for a demo or to test a checking tool. Ask before stage 4 or 5 if the project looks like that, for example a README that lists planted conflicts. If they want the conflicts kept, stop after Reviewed and go to stage 6.

## How a Knowledge Base works

Sanity reads the sources, sorts the facts into topics, and writes one cited entry per topic. When sources disagree, it picks one claim and may file an issue for a person to settle. Agents read the entries over MCP with two tools, `initial_context` and `knowledge_base_read`.

Five facts drive every stage.

- **The purpose steers the build.** It decides which sources the build keeps, which subjects lead, and how deep each entry goes. A narrow purpose gives a sharp build.
- **A dataset source is one GROQ query over one dataset.** It starts with `*[`, reads published documents only, and must match between 1 and 5,000 documents.
- **File sources never re-sync.** To update one, delete the import and add the new file.
- **The issues list is not an audit.** A build settles some disagreements silently. In testing it wrote "we ship to the US" into an entry and listed a wrong £30 offer as a real promotion, and raised no issue for either. Only reading the entries showed it. Results also vary between builds of the same sources.
- **Resolving an issue changes the Knowledge Base, not the website.** The losing claim stays on the page until someone corrects the document.

## The one bundled script

`scripts/kb-issues.mjs <kb-id> [--status open|accepted|rejected] [--json]` lists issues, which the CLI can't. Run it from the user's Sanity project folder, because it borrows that project's CLI and login. It is optional. `references/api.md` shows the same call, along with reading entries, resolving issues and guarded content edits.

## Ground rules

- Never invent a type, field or file. A query that names a field the schema lacks fails silently and indexes nulls.
- An empty result is a claim to verify, not a fact. Before you act on `0` or `[]`, confirm the project id, the dataset, that the documents are published, and that the shell didn't mangle the query. `references/cli.md` covers the Windows quoting trap.
- Never seed, import or reset content in a real project. Seeding is for demo projects only, and only when the user says it is one.
- Never write a token, key or password into a file or a chat message. Tokens live in environment variables.
- Never delete a Knowledge Base or an import unless the user names that specific one.
- Never resolve an issue the user didn't pick. Which claim is true is a person's call.
- Never write to the dataset without a yes to the exact change list. Guard every edit with the revision you reviewed. Default to drafts.
- The CLI's `context` commands and the `client.context` API are not in Sanity's public docs. If one behaves differently from these files, say so and fall back to the dashboard.
- If your own permission settings block a command, give the user the exact command to run. Don't try another route to the same write.
