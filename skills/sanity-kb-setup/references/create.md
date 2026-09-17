# Stage 2. Create

This stage adds a Knowledge Base to a real Sanity organisation. Plans cap how many an organisation can hold, and the build starts processing content. The commands are in `cli.md`.

## Get a yes first

Show the user the organisation, the title and the sources, and wait for a clear yes before the first command.

## Steps

1. Run `npx sanity context list --organization <org-id>`. This proves the login works and shows which Knowledge Bases exist. Reuse one only when its audience, purpose and sources match the intended plan. Follow the resume steps below before rebuilding it. Separate audiences or purposes can justify another Knowledge Base over the same content. If a new one is needed and the organisation is at its limit, open `blocked.md`. Don't delete one to make room unless the user names it.
2. Create the Knowledge Base with the title, and the purpose as its description. Note the id it returns. It starts with `kb`. Write it into `kb-setup.md`.
3. Add the dataset source from `kb-query.groq`. Pass the query on one line. `cli.md` explains why and how.
4. Add each file source.
5. Add the website source, if there is one.
6. Run `npx sanity context imports list <kb-id>` and check that every import completed and the document count matches the plan.
7. Build with `npx sanity context build <kb-id> --watch`. A first build takes a few minutes.
8. Tell the user the one step the CLI can't do. They create the MCP endpoint in the Context dashboard, with this Knowledge Base as its only source. `connect-agents.md` has the steps. It can wait until stage 6.
9. The state is now Built, which says nothing about whether the content is right. Go straight on to stage 3.

## Resuming an existing Knowledge Base

Read its current description and imports, then compare them with `kb-setup.md`: project, dataset, GROQ query, website URLs and file versions. An existing import proves that content was imported once, not that it is current.

- Add only missing sources. If the purpose or source configuration needs changing, show the exact changes first; don't silently repurpose an existing Knowledge Base.
- For a changed file, replace its import only after the user has authorized deletion of that specific import. File sources do not refresh.
- Refresh existing dataset and website sources with `npx sanity context refresh <kb-id>`, then wait for the returned job with `npx sanity context jobs get <kb-id> <job-id> --watch`.
- Confirm imports and refresh jobs completed successfully, and check `pendingChanges`. If content should have changed but nothing is detected, verify publication and the source query before proceeding.

Continue with the import checks and build in steps 6 and 7. Preserve existing instructions and record them when reviewing the result.

## Don't add instructions by hand

An instruction overrides the sources. One added now would hide the conflicts the first build exists to find. Stage 4 creates instructions from the user's picks.
