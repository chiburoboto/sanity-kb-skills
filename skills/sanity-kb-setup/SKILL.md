---
name: sanity-kb-setup
description: Set up a Sanity Context Knowledge Base end to end. Plans it from the repo (purpose, GROQ query, file sources), creates and builds it with the Sanity CLI, prints the conflicts the build found as A/B choices, resolves the ones the user picks, corrects the losing claims in the Sanity content, refreshes and rebuilds, then connects coding agents to it over MCP. Also unblocks the user when something is missing, such as a Sanity project, a login, an organisation token or a free Knowledge Base slot. Use whenever someone wants to set up, build, audit or fix a Sanity Knowledge Base, resolve its issues or conflicts, or connect Claude Code, Cursor, Codex or another agent to one, even if they only say "KB", "what did the build flag" or "pick the winners".
compatibility: Needs Node 18 or later, a Sanity project with the `sanity` package installed, and `npx sanity login`.
metadata:
  version: "1.0.0"
---

# Sanity Knowledge Base setup

Take a Sanity project from nothing to a clean Knowledge Base that agents can read. The work runs in six stages. Read only the file for the stage you are in.

| Stage | When | Read |
|---|---|---|
| 1. Plan | No `kb-setup.md` in the project yet | `references/plan.md`, then `references/type-roles-and-queries.md`. For a `turbo-start-sanity` repo also read `references/turbo-start-sanity.md` |
| 2. Create | The user said yes to the plan | `references/create.md` and `references/cli.md` |
| 3. Check | A build or rebuild just finished | `references/check.md` |
| 4. Resolve | The user replied with picks such as `1A 2B` | `references/resolve.md` |
| 5. Fix content | Issues are resolved but the documents still hold the losing claims | `references/fix-content.md` |
| 6. Connect | The Knowledge Base is clean and an agent needs to read it | `references/connect-agents.md` |
| Blocked | Any command fails or something is missing | `references/blocked.md` |

Stages 2 to 5 are one flow. When a build finishes, go straight to stage 3 and print the conflicts as choices. "The build is done" is not a stopping point. The only stops are the ones marked in the stage files, where a person has to say yes or pick.

Someone may want a single stage, such as resolving the issues on a Knowledge Base that already exists. Start there.

## How a Knowledge Base works

Sanity reads the sources, sorts the facts into topics, and writes one cited entry per topic. When sources disagree, it picks one claim and files an issue for a person to settle. Agents read the entries over MCP with two tools, `initial_context` and `knowledge_base_read`.

Five facts drive every stage.

- **The purpose steers the build.** It decides which sources the build keeps, which subjects lead, and how deep each entry goes. A narrow purpose gives a sharp build.
- **A dataset source is one GROQ query over one dataset.** It starts with `*[`, reads published documents only, and must match between 1 and 5,000 documents.
- **File sources never re-sync.** To update one, delete the import and add the new file.
- **The build misses conflicts, and results vary between builds.** In testing it never raised a homepage banner that contradicted the delivery policy. In another case it wrote "we ship to the US" into an entry and raised nothing. An issues list is never a complete audit.
- **Resolving an issue changes the Knowledge Base, not the website.** The losing claim stays on the page until someone corrects the document. Stage 5 exists for that.

## Scripts

All scripts are plain Node with no dependencies of their own. Run them from the user's Sanity project folder, because they borrow that project's Sanity CLI and its login. They sit in `scripts/` next to this file.

| Script | Does |
|---|---|
| `kb-issues.mjs <kb-id> [--status open] [--json]` | Lists issues. Read-only |
| `kb-resolve.mjs <kb-id> <issue-id> keep\|accept\|dismiss\|reopen [--dry-run]` | Settles one issue |
| `kb-find.mjs <project-id> <dataset> "<text>"` | Finds every field that contains a losing claim. Read-only |
| `kb-patch.mjs <project-id> <dataset> <patches.json> [--publish] [--dry-run]` | Corrects fields, as drafts unless `--publish` |
| `kb-mcp-check.mjs` | Tests an MCP endpoint and prints the outline. Read-only |

## Ground rules

- Never invent a type, field or file. A query that names a field the schema lacks fails silently and indexes nulls.
- Never write a token, key or password into a file or a chat message. Tokens live in environment variables.
- Never delete a Knowledge Base or an import unless the user names that specific one.
- Never resolve an issue the user didn't pick. Which claim is true is a person's call.
- Never write to the dataset without a yes. Default to drafts.
- If the user keeps a Knowledge Base's conflicts on purpose, for a demo or a test, warn before resolving or fixing. `reopen` and re-seeding restore them.
- The CLI's `context` commands and the issues API are not in Sanity's public docs. If one behaves differently from these files, say so and fall back to the dashboard.
- If your own permission settings block a command, give the user the exact command to run. Don't try another route to the same write.
