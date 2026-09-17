# Stage 1. Plan

This stage reads the repo and writes two files. It changes nothing in Sanity.

## Before you start

Check these. If one fails, open `blocked.md` and fix it first.

1. The folder holds a Sanity project. Look for `sanity.config.ts` or `sanity.cli.ts`, in the root or under `apps/studio`.
2. `npx sanity context --help` prints the `context` commands.
3. `npx sanity projects list` works. If it asks for a login, the user runs `npx sanity login`.
4. `kb-setup.md` doesn't exist yet. If it does, a plan was made before. Read it and continue from where it stopped.

## Steps

1. **Gather inputs.** Read, don't guess.
   - Project id and dataset, from `sanity.cli.ts`, `sanity.config.ts` or the env example file.
   - The organisation id, from `npx sanity projects list`, or from the dashboard URL `sanity.io/@<org-id>/...`.
   - The schema. Prefer `schema.json` from `npx sanity schema extract`. Otherwise read the schema type files.
   - Published document counts per type, with `npx sanity documents query "{'n': count(*[_type == '<type>'])}"`. Use single quotes inside the query, and wrap the count in an object. `cli.md` explains both.
   - Front-end routes, to see which types render as pages.
   - Repo files that state facts, such as terms, policies, pricing, care guides and specs. These become file sources.
   - The public site URL, if the site is deployed and not behind a login.
2. **Don't trust a zero.** A count of `0` or a result of `[]` often means the command was wrong, not that the dataset is empty. Before you believe it, check that:
   - the project id and dataset match the Studio the user actually edits, and you passed `--dataset` if there is more than one,
   - the shell or command shim didn't strip quotes from the query; use the tested quoting form or direct Node fallback in `cli.md`,
   - `count(*)` returns more than 0, which separates "empty dataset" from "wrong type name",
   - the documents are published and not only drafts. The CLI query may hide drafts, so check with the raw-perspective client in `api.md`.

   If the dataset of a real project really is empty, stop and tell the user. The content has to come from them. Never offer to seed a real project. `blocked.md` covers demo projects.
3. **Give every document type one role** and decide what to include. `type-roles-and-queries.md` has the roles.
4. **Write one GROQ query** with a projection per included type. Keep every field that states a fact, including booleans and numbers. A `turbo-start-sanity` repo has `apps/studio`, `packages/sanity-blocks`, or a `pageBuilder` with `hero`, `cta` and `faqAccordion` blocks. For those, start from `turbo-start-sanity.md`.
5. **Write the purpose** in three lines that say who asks, what leads, and what is left out. Two audiences means two Knowledge Bases.

   "Leave out" makes the build drop that material. Only list things the Knowledge Base should not index at all. Content you include so its claims get checked, such as homepage promotions, must not appear there. In testing, "Leave out: homepage promotions" stopped the build from checking a wrong promo claim.
6. **Predict the outline**, with each topic marked core or peripheral. If the sources can only produce one or two topics, say so.
7. **List the disagreements you noticed** while reading the content, in section 10 of the sheet, with both claims and where each lives. Stage 3 checks every one against the entries. The ones the build settles without an issue are the most useful finding.
8. **Write `kb-setup.md`** from `assets/kb-setup-template.md`. Save the query by itself to `kb-query.groq`, with single-quoted strings, so the CLI can read it. Where you couldn't find something, write "not found" and where you looked.
9. **Show the plan** in a few lines. Give the title, purpose, included types, document count, files, and the decisions a person should make.

Stop here. The state is Planned. Go to stage 2 only when the user says to create the Knowledge Base.
