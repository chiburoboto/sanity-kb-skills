# Stage 1. Plan

This stage reads the repo and writes two files. It changes nothing in Sanity.

## Before you start

Check these three things. If one fails, open `blocked.md` and fix it first.

1. The folder holds a Sanity project. Look for `sanity.config.ts` or `sanity.cli.ts`, in the root or under `apps/studio`.
2. `npx sanity context --help` prints the `context` commands.
3. `npx sanity projects list` works. If it asks for a login, the user runs `npx sanity login`.

## Steps

1. **Gather inputs.** Read, don't guess.
   - Project id and dataset, from `sanity.cli.ts`, `sanity.config.ts` or the env example file.
   - The organisation id, from `npx sanity projects list`, or from the dashboard URL `sanity.io/@<org-id>/...`.
   - The schema. Prefer `schema.json` from `npx sanity schema extract`. Otherwise read the schema type files.
   - Published document counts per type, with `npx sanity documents query 'count(*[_type == "<type>"])'`. A count of 0 across the board means an empty dataset. See `blocked.md`.
   - Front-end routes, to see which types render as pages.
   - Repo files that state facts, such as terms, policies, pricing, care guides and specs. These become file sources.
   - The public site URL, if the site is deployed and not behind a login.
2. **Give every document type one role** and decide what to include. `type-roles-and-queries.md` has the roles.
3. **Write one GROQ query** with a projection per included type. A `turbo-start-sanity` repo has `apps/studio`, `packages/sanity-blocks`, or a `pageBuilder` with `hero`, `cta` and `faqAccordion` blocks. For those, start from `turbo-start-sanity.md`.
4. **Write the purpose** in three lines that say who asks, what leads, and what is left out. Two audiences means two Knowledge Bases.

   "Leave out" makes the build drop that material. Only list things the Knowledge Base should not index at all. Content you include so its claims get checked, such as homepage promotions, must not appear there. In testing, "Leave out: homepage promotions" stopped the build from checking a wrong promo claim.
5. **Predict the outline**, with each topic marked core or peripheral. If the sources can only produce one or two topics, say so.
6. **List the conflicts you already noticed** while reading the content, in section 10 of the sheet. Stage 3 compares the build against this list, and the ones the build misses are the most useful finding.
7. **Write `kb-setup.md`** from `assets/kb-setup-template.md`. Save the query by itself to `kb-query.groq` so the CLI can read it. Where you couldn't find something, write "not found" and where you looked.
8. **Show the plan** in a few lines. Give the title, purpose, included types, document count, files, and the decisions a person should make.

Stop here. Go to stage 2 only when the user says to create the Knowledge Base.
