# When something blocks you

Find the symptom, tell the user what it means in one sentence, and give them the exact step. Many of these steps belong to the user, because they involve a browser login, a token or a plan. Don't work around them.

## Contents

- Setup: no Sanity project, not logged in, no `context` commands, Context not enabled, no organisation id, empty dataset
- Creating: Knowledge Base limit reached, 403 errors, query errors, import errors
- Building and resolving: old conflicts come back, `pendingChanges` is 0, stale issues, script errors
- Fixing content: no write access, edits don't show up
- Connecting: 401, 403, error -32005, four tools instead of two, the agent ignores the endpoint
- Your own permissions block a command

## Setup

**There is no Sanity project in the folder.** No `sanity.config.ts` or `sanity.cli.ts` exists, in the root or under `apps/studio`.
- If the user has a project elsewhere, ask for the folder and work there.
- If they have none, they create one with `npm create sanity@latest`. It asks them to log in, name the project and pick a dataset, usually `production`. For a Next.js site with an embedded Studio, they run `npx sanity@latest init` inside the Next.js app instead.
- A Knowledge Base needs published content. Finish the schema and add content before stage 1.

**"You must be logged in", or a command asks for a login.** The user runs `npx sanity login` and picks their provider in the browser. You can't do this for them. After it, `npx sanity projects list` should print their projects. The scripts in this skill use the same login, so no token is needed for stages 1 to 5.

**`npx sanity context` says the command doesn't exist.** The project's `sanity` package is too old. Update it with the project's package manager, for example `pnpm add sanity@latest`, and check `npx sanity context --help` again. If the commands still don't exist, do stage 2 in the dashboard at `sanity.io/@<org-id>/context`, using the values in `kb-setup.md`.

**The Context app isn't in the dashboard, or create returns "not enabled".** Knowledge Bases are an opt-in beta. An organisation admin turns on Context and Knowledge Bases from the **Apps** page of the organisation in `sanity.io/manage`. If the user isn't an admin, tell them who to ask, which is the organisation's owner.

**You can't find the organisation id.** Run `npx sanity projects list`, or read it from the dashboard URL, which looks like `sanity.io/@<org-id>/...`. A project that belongs to no organisation can't have a Knowledge Base. The user moves it into one from the project's settings in Manage.

**Document counts are 0.** The dataset is empty, or everything is a draft. A dataset source reads published documents only and must match at least 1.
- If the repo has a seed script, such as `pnpm seed`, offer to run it. It usually needs a write token in `.env.local`, which the user creates under the **project's** API settings in Manage, with Editor permission. They paste it into `.env.local` themselves.
- Otherwise the user publishes content in Studio first.
- Also confirm you queried the right dataset. Pass `--dataset <name>` if the project has more than one.

## Creating

**"Organization is at its limit", for example 2 of 2 Knowledge Bases used.** The cap counts every Knowledge Base in the organisation, across all its projects. List them with `npx sanity context list --organization <org-id>` and show the table. Then give the user the options.
- Delete one they name. Deleting is permanent and removes its entries, issues and instructions. Before they choose, check in the dashboard which Knowledge Base each MCP endpoint reads, so a working agent connection doesn't break.
- Upgrade the plan. Sanity doesn't publish the numbers, so they check billing in Manage.
- Use a different organisation, which has its own allowance. Client work usually belongs in the client's organisation anyway.
Never delete one on your own judgement, even an obvious test.

**403 on create or on a dataset import.** The CLI uses the logged-in user, not a token. Creating a Knowledge Base needs Administrator or Developer on the organisation. A dataset source needs Administrator or Developer on the project, plus unrestricted read on the dataset. Say which one is missing. Don't retry.

**"Invalid GROQ filter ... Unexpected end of query".** The query got cut at a newline. Windows command shims do this. Pass the query on one line. `cli.md` has the bash and PowerShell forms.

**The import fails on the query for another reason.** Check that it starts with `*[`, and that every field it names exists in the schema. Then retry with the fallback query from the sheet, and say which one worked.

**"Failed to create import: fetch failed".** That's a network error. Run `imports list` first, so a retry doesn't add the same source twice, then retry once.

**The import matched 0 documents, or more than 5,000.** Narrow or widen the filter. Counts come from published documents only.

## Building and resolving

**A rebuild raises conflicts the user already resolved.** Either the documents still hold the losing claims, or the rebuild ran without a refresh. Do stage 5, in its order: fix, publish, refresh, then build. Don't resolve the repeats.

**`pendingChanges` is all zeros after a refresh, though documents changed.** The edits are still drafts, or they sit in documents the query doesn't match. Check with `npx sanity documents query`.

**Issues quote text that no longer exists.** A build doesn't close issues from earlier builds. Confirm the current value, then dismiss them with `kb-resolve.mjs ... dismiss` once the user agrees.

**A script says "Could not find the Sanity CLI in this folder".** Run it from the Sanity project folder, where `node_modules/sanity` exists. Run the project's install command first if `node_modules` is missing.

**A script fails on `client.context`.** The project's Sanity packages are too old for the issues API. Update `sanity`, or the user resolves in the dashboard under **Issues**. There they pick the claim and press **Resolve**. Then continue at stage 5.

**The build sits in `review` state.** That's normal while issues are open. It reaches `ready` when none are left. Agents can read the entries in both states.

## Fixing content

**`kb-patch.mjs` returns 401 or 403.** The logged-in user can't write to that dataset. They need Editor or higher on the project. If they can't get it, print the change list and let them make the edits in Studio.

**The edits don't show on the website.** They are drafts until published. After publishing, a cached site may need a redeploy or a revalidation. That's the site's cache, not the Knowledge Base.

**The losing claim isn't in the dataset.** `kb-find.mjs` finds nothing. Then the claim lives in a file source or in the site's code. Search the repo for it, and handle it as `fix-content.md` step 5 says.

## Connecting

**401 from the endpoint.** The token is missing, expired or mistyped, or the environment variable isn't visible to the app. On Windows, `setx` only reaches apps started afterwards, so restart the app fully. In Cursor, see the `${env:...}` bug in `connect-agents.md`.

**403 with `contextGrantRequired`.** The token is a project token, or lacks Context Viewer. The user creates a new one at organisation level.

**404 from the endpoint.** The organisation id or the endpoint name in the URL is wrong. The name is the one chosen at creation, not the title.

**Error -32005.** The endpoint is in Knowledge Base mode with no readable Knowledge Base. The endpoint has no Knowledge Base attached, or the first build hasn't finished.

**Four tools instead of two.** A dataset source is attached to the endpoint, so it runs in GROQ mode and ignores the Knowledge Base. The user removes the dataset source from the endpoint, or creates a new endpoint with the Knowledge Base only.

**The agent answers without calling the tools.** Name the server in the question, for example "use the `<kb-name>` tools". Check that the agent lists the server as connected. Some agents only load MCP settings at startup.

## Your own permissions block a command

Some agents run with settings that refuse writes to shared resources. If a command gets refused, don't look for another route to the same write. Tell the user what you tried and why, and give them the exact command in a code block so they can run it or allow it.
