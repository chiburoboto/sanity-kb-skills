# Stage 5. Fix content, refresh, rebuild

Resolving told the Knowledge Base which claim is true. The documents still hold the losing claims, so the website still shows them, and the next build will raise them again. This stage corrects the documents and brings the Knowledge Base up to date.

There is no generic patch tool here on purpose. You know this project's schema, so prepare small, specific edits for it.

## Steps

1. **Find where each losing claim lives.** Use the schema and GROQ, not a blind text search.
   - Start from the documents the issue cites, then ask which other types could state the same fact. A return window can sit in a policy, an FAQ answer, a homepage banner and a product field at once.
   - Query those fields with `npx sanity documents query`. Project Portable Text with `pt::text(body)`, because formatting can split "28 " and "days" into separate spans that a plain string match misses.
   - Check other wordings of the fact, such as "28-day", "twenty-eight" or "four weeks".
   - Check booleans and numbers that carry the same fact, such as `dishwasherSafe: true` next to "dishwasher safe" in a description.
   - Check the file sources, and search the site's code for hardcoded copies.
   - Finding nothing doesn't prove the claim is gone. Say where you looked.
2. **Read each document before you plan its edit.** Note its `_rev` and the field's current value. Check whether `drafts.<id>` exists. A draft means someone has unpublished edits.
3. **Show the change list and get a yes.** Use one row per field, with the document, the field, the old value and the new value. Keep each edit as small as the fact allows. Changing `28` to `14` is safe. Rewriting a paragraph needs the user to read it. Ask whether they want drafts to review in Studio, which is the default and the right choice for a live site, or a direct publish.
4. **Write the edits, guarded by the revision you reviewed.** In order of preference:
   - A Sanity MCP server or other write tool you already have, if it supports revision checks.
   - The guarded `@sanity/client` example in `api.md`. `ifRevisionId` makes the commit fail if anyone edited the document after you read it, so you can't overwrite a newer edit. Run it with `dryRun: true` first.
   - The user makes the edits in Studio from your change list.

   If a document has a draft, tell the user before touching it. Patching only the published document leaves the old claim in the draft, and publishing that draft later brings it back. Patch both, each with its own revision, or let the user handle it in Studio.
5. **Handle what isn't a dataset field.**
   - For a losing claim in a file source, correct the file, delete the old import and add the new file. Files never re-sync.
   - For a losing claim hardcoded in the site's code, report the file and line.
6. **Verify.** If you wrote drafts, wait until the user has published them. The Knowledge Base only reads published documents. Then query the changed fields and confirm the new values.
7. **Refresh, then rebuild.** The order matters. A build reuses the content from the last import, so a rebuild straight after an edit still sees the old text.
   ```
   npx sanity context refresh <kb-id>
   npx sanity context jobs get <kb-id> <job-id> --watch
   npx sanity context get <kb-id> --json
   npx sanity context build <kb-id> --watch
   ```
   After the refresh, `pendingChanges.changed` should count the documents you edited. If it shows 0, the edits aren't published or the query doesn't match those documents.
8. **Run stage 3 again**, entries included. Confirm each corrected fact now reads correctly in its entry. Dismiss stale issues that quote the old text. If a new conflict appears, print it as a choice like before.
9. **Record it.** Fill in "Resolutions" in `kb-setup.md` with the picks, the documents corrected and the final counts.

## What Clean looks like

`state` is `ready`, open conflicts are 0, `pendingChanges` is all zeros, and every row in the stage 3 table now shows the winning claim in its entry.
