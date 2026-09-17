# Stage 4. Resolve

Resolve only what the user picked. Resolving creates a standing instruction, the same as the dashboard's Resolve button, and the instruction overrides the sources from then on.

There is no CLI command for this. `api.md` has the calls. Write a throwaway script from them, run it from the project folder, and delete it.

## Steps

1. Split the picks. Picks on raised conflicts get resolved here. Picks on silent settlements have no issue, so they go straight to stage 5.
2. Map each raised pick to a resolution. **A** is `keep_existing`, so the Knowledge Base's current claim wins. **B** is `accept_new`, so the other source's claim wins.
3. Before each call, read the issue back and print the claim that will win. It must match what the user chose. Issue ids and their order can change between builds, so never resolve by list position from an earlier run.
4. Resolve. Then read the issue again and confirm its `status` is `accepted`.
5. Dismiss the stale issues and obsolete suggestions the user agreed to close.
6. Show the user a table of fact, winner, and keep or accept.
7. Go to stage 5. Resolving without fixing the content leaves the wrong text on the website.

If the user would rather click, the dashboard does the same thing under **Issues**. They pick the claim and press **Resolve**. Continue at stage 5 afterwards.

## Special cases

- **Neither claim is right.** Don't resolve. Correct the source documents in stage 5 and rebuild. If the user wants an instruction in their own words, they write it in the dashboard under Instructions.
- **A wrong pick.** `issues.reopen` clears the resolution and deletes the instruction it created.
- **Not a conflict.** Only `conflict` issues can be resolved. `update_required` suggestions and `gap` issues get applied in the dashboard or dismissed.
- **Repeats after a rebuild.** If a rebuild raises a conflict the user already resolved, the source still holds the losing claim, or the rebuild ran without a refresh. Don't resolve it a second time, because that adds a duplicate instruction. Go to stage 5.
