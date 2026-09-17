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

## Quoting on Windows

Two things break GROQ arguments on Windows. Both fail quietly, so check for them before trusting an empty result.

- **PowerShell strips double quotes inside an argument.** `'count(*[_type == "product"])'` reaches the CLI as `_type == product`, and the query returns nothing, `0` or `[]`. It does this through `npx`, `pnpm exec` and direct Node alike. Write GROQ strings with single quotes and wrap the argument in double quotes. This form was tested in PowerShell and bash:
  ```
  npx sanity documents query "count(*[_type == 'product'])"
  ```
- **The `.cmd` shims behind `npx` and `pnpm exec` cut an argument at the first newline.** The API then reports `Invalid GROQ filter ... Unexpected end of query`. Pass the query on one line:
  - bash: `--query "$(tr '\n' ' ' < kb-query.groq | tr -s ' ')"`
  - PowerShell: `--query ((Get-Content -Raw kb-query.groq) -replace '\s+', ' ')`

- **The CLI prints "Query returned no results" for a bare `0`.** A count that is truly zero looks like an error. Wrap counts in an object, such as `"{'n': count(*[_type == 'product'])}"`, so you get `{"n": 0}` back.

So save `kb-query.groq` with single-quoted strings, and collapse it to one line when you pass it. If a command still misbehaves through a shim, call the CLI directly with `node node_modules/sanity/bin/sanity <command>`.

Confirmed in testing: the dataset import accepts `pt::text()` and conditional projections (`_type == 'x' => { }`).

## Transient errors

`Failed to create import: fetch failed` is a network error, not a bad request. Retry once. Check with `imports list` first so a retry doesn't add the same source twice.

## What the CLI can't do

- **Create an MCP endpoint.** Endpoints are organisation documents the client can read but not create. Use the Context dashboard: New endpoint, pick the Knowledge Base only.
- **Read entries, list issues, resolve issues.** No CLI command exists for these. `api.md` has short `@sanity/client` examples. `scripts/kb-issues.mjs` lists issues.
- **Add instructions with custom wording.** The client lists them. Write them in the dashboard.

## Issue states

`scripts/kb-issues.mjs --status` takes `open`, `accepted` (resolved) or `rejected` (dismissed). Only `conflict` issues can be resolved. `update_required` suggestions and `gap` issues are applied in the dashboard or dismissed. `openIssueCount` in `context get` can be lower than the number of open issues, because it leaves out some suggestions.

## Permissions

- The CLI uses the logged-in user, not a token.
- Creating a Knowledge Base needs Administrator or Developer on the organisation.
- A dataset source needs Administrator or Developer on the project, plus unrestricted read on the dataset.
- A 403 usually means one of these is missing. Say which, rather than retrying.
