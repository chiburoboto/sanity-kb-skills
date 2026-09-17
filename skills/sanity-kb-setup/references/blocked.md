# When something blocks you

Find the symptom, tell the user what it means in one sentence, and give them the exact step. Many of these steps belong to the user, because they involve a browser login, a token or a plan. Don't work around them.

## Contents

- Setup: no Sanity project, not logged in, no `context` commands, Context not enabled, no organisation id
- Empty results: a query returns `0` or `[]`
- Creating: Knowledge Base limit reached, 403 errors, query errors, import errors
- Building and resolving: old conflicts come back, `pendingChanges` is 0, stale issues, API errors
- Fixing content: no write access, a 409, edits don't show up
- Connecting: 401, 403, 404, error -32005, four tools instead of two, the wrong Knowledge Base, the agent ignores the endpoint
- Your own permissions block a command

## Setup

**There is no Sanity project in the folder.** No `sanity.config.ts` or `sanity.cli.ts` exists, in the root or under `apps/studio`.
- If the user has a project elsewhere, ask for the folder and work there.
- If they have none, they create one with `npm create sanity@latest`. It asks them to log in, name the project and pick a dataset, usually `production`. For a Next.js site with an embedded Studio, they run `npx sanity@latest init` inside the Next.js app instead.
- A Knowledge Base needs published content. The user finishes the schema and adds their content before stage 1.

**"You must be logged in", or a command asks for a login.** The user runs `npx sanity login` and picks their provider in the browser. You can't do this for them. After it, `npx sanity projects list` should print their projects. The API examples use the same login, so stages 1 to 5 need no token.

**`npx sanity context` says the command doesn't exist.** The project's `sanity` package is too old. Update it with the project's package manager, for example `pnpm add sanity@latest`, and check `npx sanity context --help` again. If the commands still don't exist, do stage 2 in the dashboard at `sanity.io/@<org-id>/context`, using the values in `kb-setup.md`.

**The Context app isn't in the dashboard, or create returns "not enabled".** Knowledge Bases are an opt-in beta. An organisation admin turns on Context and Knowledge Bases from the **Apps** page of the organisation in `sanity.io/manage`. If the user isn't an admin, they ask the organisation's owner.

**You can't find the organisation id.** Run `npx sanity projects list`, or read it from the dashboard URL, which looks like `sanity.io/@<org-id>/...`. A project that belongs to no organisation can't have a Knowledge Base. The user moves it into one from the project's settings in Manage.

## Empty results

**A query returns `0` or `[]`.** Treat this as a suspect result until you have ruled out the command. In testing, the same query returned nothing through one shell and four products through another. Check in this order.

1. Quoting. PowerShell strips double quotes inside an argument, so `_type == "product"` arrives as `_type == product` and matches nothing. Use single quotes inside the query. `cli.md` has the tested form.
2. The target. Confirm the project id and dataset against `sanity.cli.ts` and the Studio the user edits. Pass `--dataset <name>` if the project has several.
3. The CLI's own wording. `npx sanity documents query` prints "Query returned no results" for a bare `0`, which looks like a failure. Wrap counts in an object, such as `"{'n': count(*)}"`.
4. The type name. If `count(*)` is above 0, the dataset has content and your filter is wrong. List the types with `"array::unique(*[]._type)"`.
5. Drafts. Content that exists only as drafts is invisible to a Knowledge Base until published. The CLI query may hide drafts, so look with the `perspective: 'raw'` client from `api.md`, using `*[_id in path('drafts.**')]._id`.

Only after all five can you say the dataset is empty.

**The dataset really is empty.**
- In a real project, stop. Tell the user the Knowledge Base needs published content, and that it has to come from them, through Studio or their own migration. Never seed, import or generate content in a real project, and don't offer to.
- In a demo project, a seed script is fine. A demo project is one the user calls a demo or a test, usually with fictional content and a seed script in the repo. Ask before running it, because seed scripts often replace documents by id and wipe Studio edits. It usually needs a write token in `.env.local`, which the user creates under the **project's** API settings in Manage with Editor permission, and pastes in themselves.

## Creating

**"Organization is at its limit", for example 2 of 2 Knowledge Bases used.** The cap counts every Knowledge Base in the organisation, across all its projects. List them with `npx sanity context list --organization <org-id>` and show the table. First check whether one of them already belongs to this project, because then you should reuse it and no slot is needed. Otherwise give the user the options.
- Delete one they name. Deleting is permanent and removes its entries, issues and instructions. Before they choose, check in the dashboard which Knowledge Base each MCP endpoint reads, so a working agent connection doesn't break.
- Upgrade the plan. Sanity doesn't publish the numbers, so they check billing in Manage.
- Use a different organisation, which has its own allowance. Client work usually belongs in the client's organisation anyway.

Never delete one on your own judgement, even an obvious test.

**403 on create or on a dataset import.** The CLI uses the logged-in user, not a token. Creating a Knowledge Base needs Administrator or Developer on the organisation. A dataset source needs Administrator or Developer on the project, plus unrestricted read on the dataset. Say which one is missing. Don't retry.

**"Invalid GROQ filter ... Unexpected end of query".** A `.cmd` shim cut the query at a newline. Pass it on one line. `cli.md` has the bash and PowerShell forms.

**The import fails on the query, or matches 0 documents.** Check the quoting first, as above. Then check that the query starts with `*[`, and that every field it names exists in the schema. Then retry with the fallback query from the sheet, and say which one worked. A match above 5,000 needs a narrower filter.

**"Failed to create import: fetch failed".** That's a network error. Run `imports list` first, so a retry doesn't add the same source twice, then retry once.

## Building and resolving

**A rebuild raises conflicts the user already resolved.** Either the documents still hold the losing claims, or the rebuild ran without a refresh. Do stage 5 in its order, which is fix, publish, refresh, then build. Don't resolve the repeats.

**`pendingChanges` is all zeros after a refresh, though documents changed.** The edits are still drafts, or they sit in documents the query doesn't match. Query the documents to check.

**Issues quote text that no longer exists.** A build doesn't close issues from earlier builds. Confirm the current value, then dismiss them once the user agrees.

**"Could not find the Sanity CLI in this folder", or the API example can't resolve `@sanity/cli-core`.** Run it from the Sanity project folder, where `node_modules/sanity` exists. Run the project's install command first if `node_modules` is missing.

**`client.context` is undefined, or a method is missing.** The project's Sanity packages are too old for this API, or Sanity changed it. Update `sanity`. If that doesn't help, use the dashboard. It has Entries for reading, and Issues for picking a claim and pressing **Resolve**.

**The build sits in `review` state.** That's normal while issues are open. It reaches `ready` when none are left. Agents can read the entries in both states.

## Fixing content

**A 409 on commit.** Someone edited the document after you read it, and the revision guard stopped you overwriting their change. Nothing was written. Read the document again, show the user the new value, and redo the change list for that document.

**A 401 or 403 on commit.** The logged-in user can't write to that dataset. They need Editor or higher on the project. If they can't get it, give them the change list to apply in Studio.

**The edits don't show on the website.** They are drafts until published. After publishing, a cached site may need a redeploy or a revalidation. That's the site's cache, not the Knowledge Base.

**You can't find the losing claim in the dataset.** It may be worded differently, split across Portable Text spans, carried by a boolean or a number, or it may live in a file source or the site's code. `fix-content.md` step 1 lists where to look.

## Connecting

**401 from the endpoint.** The token is missing, expired or mistyped, or the environment variable isn't visible to the app. On Windows, `setx` only reaches apps started afterwards, so restart the app fully. In Cursor, see the `${env:...}` bug in `connect-agents.md`.

**403 with `contextGrantRequired`.** The token is a project token, or lacks Context Viewer. The user creates a new one at organisation level.

**404 from the endpoint.** The organisation id or the endpoint name in the URL is wrong. The name is the one chosen at creation, not the title.

**400 or 406.** A header is missing. The request needs `Content-Type: application/json` and `Accept: application/json, text/event-stream`.

**Error -32005, or a 200 response with `"isError": true`.** The endpoint is in Knowledge Base mode with no readable Knowledge Base. Either none is attached, or the first build hasn't finished. A 200 status doesn't mean the tool call worked, so always read the body.

**Four tools instead of two.** A dataset source is attached to the endpoint, so it runs in GROQ mode and ignores the Knowledge Base. The user removes the dataset source from the endpoint, or creates a new endpoint with the Knowledge Base only.

**The answers come from a different project.** The URL points at another endpoint. This usually comes from an old `SANITY_CONTEXT_MCP_URL` in the environment. Write the URL out in full, and check the Knowledge Base id in `initial_context` against `kb-setup.md`.

**The agent answers without calling the tools.** Name the server in the question, for example "use the `<kb-name>` tools". Check that the agent lists the server as connected. Some agents only load MCP settings at startup.

## Your own permissions block a command

Some agents run with settings that refuse writes to shared resources. If a command gets refused, don't look for another route to the same write. Tell the user what you tried and why, and give them the exact command in a code block so they can run it or allow it.
