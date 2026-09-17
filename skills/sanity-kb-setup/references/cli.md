# Sanity CLI for Knowledge Bases

Found in `@sanity/cli` 8.11.0 under `sanity context`. Not in Sanity's public docs, so check `npx sanity context --help` if a command fails.

## Commands

| Task | Command |
|---|---|
| List Knowledge Bases | `npx sanity context list --organization <org-id> --json` |
| Create | `npx sanity context create --organization <org-id> --title "<title>" --description "<purpose>"` |
| Read state | `npx sanity context get <kb-id> --json` |
| Add dataset source | `npx sanity context imports create <kb-id> --sanity-project <project-id> --sanity-dataset <dataset> --query "<groq>"` |
| Add file | `npx sanity context imports create <kb-id> --file <path>` |
| Add website | `npx sanity context imports create <kb-id> --url <url>` |
| Add inline text | `npx sanity context imports create <kb-id> --text "<text>" --title "<title>"` |
| List sources | `npx sanity context imports list <kb-id> --json` |
| Remove a source | `npx sanity context imports delete <kb-id> <import-id>` |
| Build | `npx sanity context build <kb-id> --watch` |
| Refresh | `npx sanity context refresh <kb-id>` |
| Refresh schedule | `npx sanity context update <kb-id> --refresh-enabled --refresh-frequency weekly` |
| Job status | `npx sanity context jobs get <kb-id> <job-id> --watch` |
| Delete | `npx sanity context delete <kb-id>` |

`context get --json` returns `state`, `openIssueCount`, `instructionCount`, `lastChangedAt` (the last build), `pendingChanges`, `sourceUsage` and the refresh schedule.

## Passing the query

Pass it as **one line**. On Windows, `pnpm exec` and `npx` run through `.cmd` shims that cut an argument at the first newline, and the API then reports `Invalid GROQ filter ... Unexpected end of query` at the position where the first line ends. Collapse the saved file:

- bash: `--query "$(tr '\n' ' ' < kb-query.groq | tr -s ' ')"`
- PowerShell: `--query ((Get-Content -Raw kb-query.groq) -replace '\s+', ' ')`

Confirmed in testing: the dataset import accepts `pt::text()` and conditional projections (`_type == "x" => { }`).

## Transient errors

`Failed to create import: fetch failed` is a network error, not a bad request. Retry once. Check with `imports list` first so a retry doesn't add the same source twice.

## What the CLI can't do

- **Create an MCP endpoint.** Endpoints are organisation documents the client can read but not create. Use the Context dashboard: New endpoint, pick the Knowledge Base only.
- **Resolve issues.** There is no CLI command. `scripts/kb-resolve.mjs` wraps `@sanity/client`'s `context.issues.resolve` (`resolution: 'keep_existing' | 'accept_new'`), `dismiss` and `reopen`. Resolving creates the standing instruction. Choosing which claim is true is a person's call.
- **Add instructions with custom wording.** The client lists them. Write them in the dashboard.

## Issue states

`kb-issues.mjs --status` takes `open`, `accepted` (resolved) or `rejected` (dismissed). Only `conflict` issues can be resolved. `update_required` suggestions and `gap` issues are applied in the dashboard or dismissed. `openIssueCount` in `context get` can be lower than the number of open issues, because it leaves out some suggestions.

## Bundled scripts

All five borrow the project's Sanity CLI and its login, except `kb-mcp-check.mjs`, which uses the two environment variables. Run them from the Sanity project folder.

| Script | Wraps |
|---|---|
| `kb-issues.mjs` | `client.context.issues.list` |
| `kb-resolve.mjs` | `client.context.issues.resolve`, `dismiss`, `reopen` |
| `kb-find.mjs` | A fetch of every non-system document, searched for a string |
| `kb-patch.mjs` | A transaction of `set` and `unset` patches, on drafts or published documents |
| `kb-mcp-check.mjs` | MCP over HTTP: `initialize`, `tools/list`, `initial_context` |

## Permissions

- The CLI uses the logged-in user, not a token.
- Creating a Knowledge Base needs Administrator or Developer on the organisation.
- A dataset source needs Administrator or Developer on the project, plus unrestricted read on the dataset.
- A 403 usually means one of these is missing. Say which, rather than retrying.
