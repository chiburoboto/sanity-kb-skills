# Stage 2. Create

This stage adds a Knowledge Base to a real Sanity organisation. Plans cap how many an organisation can hold, and the build starts processing content. The commands are in `cli.md`.

## Get a yes first

Show the user the organisation, the title and the sources, and wait for a clear yes before the first command.

## Steps

1. Run `npx sanity context list --organization <org-id>`. This proves the login works and shows how many Knowledge Bases exist. If the organisation is at its limit, stop and open `blocked.md`. Don't delete one to make room unless the user names it.
2. Create the Knowledge Base with the title, and the purpose as its description. Note the id it returns. It starts with `kb`. Write it into `kb-setup.md`.
3. Add the dataset source from `kb-query.groq`. Pass the query on one line. `cli.md` explains why and how.
4. Add each file source.
5. Add the website source, if there is one.
6. Run `npx sanity context imports list <kb-id>` and check that every import completed and the document count matches the plan.
7. Build with `npx sanity context build <kb-id> --watch`. A first build takes a few minutes.
8. Tell the user the one step the CLI can't do. They create the MCP endpoint in the Context dashboard, with this Knowledge Base as its only source. `connect-agents.md` has the steps. It can wait until stage 6.
9. Go straight on to stage 3.

## Don't add instructions by hand

An instruction overrides the sources. One added now would hide the conflicts the first build exists to find. Stage 4 creates instructions from the user's picks.
