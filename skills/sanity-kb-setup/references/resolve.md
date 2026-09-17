# Stage 4. Resolve

Resolve only what the user picked. Resolving creates a standing instruction, the same as the dashboard's Resolve button, and the instruction overrides the sources from then on.

## Steps

1. Map each pick to an action. **A** is `keep`, so the Knowledge Base's current claim wins. **B** is `accept`, so the other source's claim wins.
2. Run a dry run for each pick and read the "Winner" line. It must match what the user chose.
   ```
   node <skill-folder>/scripts/kb-resolve.mjs <kb-id> <issue-id> keep --dry-run
   ```
3. Run it again without `--dry-run`. The script prints `Status: accepted` when it worked.
4. Dismiss the stale issues and the obsolete suggestions the user agreed to close.
   ```
   node <skill-folder>/scripts/kb-resolve.mjs <kb-id> <issue-id> dismiss
   ```
5. Show the user a table of fact, winner, and keep or accept.
6. Go to stage 5. Resolving without fixing the content leaves the wrong text on the website.

## Special cases

- **Neither claim is right.** Don't resolve. Correct the source documents in stage 5 and rebuild. If the user wants an instruction with their own wording, they write it in the dashboard under Instructions.
- **A wrong pick.** `kb-resolve.mjs <kb-id> <issue-id> reopen` clears the resolution and deletes the instruction it created.
- **Not a conflict.** `keep` and `accept` only work on `conflict` issues. The script refuses anything else. `update_required` suggestions and `gap` issues get applied in the dashboard or dismissed.
- **Repeats after a rebuild.** If a rebuild raises a conflict the user already resolved, the source still holds the losing claim, or the rebuild ran without a refresh. Don't resolve it a second time, because that adds a duplicate instruction. Go to stage 5.
