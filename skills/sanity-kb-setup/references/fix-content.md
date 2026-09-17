# Stage 5. Fix content, refresh, rebuild

Resolving told the Knowledge Base which claim is true. The documents still hold the losing claims, so the website still shows them, and the next build will raise them again. This stage corrects the documents and brings the Knowledge Base up to date.

## Get a yes first

This stage writes to the user's dataset. Show the list of changes from step 2 and wait for a yes. Ask whether they want drafts to review in Studio, which is the default and the right choice for a live site, or a direct publish, which suits a demo or test dataset.

## Steps

1. **Find every copy of each losing claim.** Issues cite the sources the build noticed, not every place the text appears.
   ```
   node <skill-folder>/scripts/kb-find.mjs <project-id> <dataset> "28 days"
   ```
   It prints the document id, type and field path of every match. Search for the distinctive part of the claim, such as `28 days`, `£75` or `dishwasher safe`. Also check boolean and number fields that carry the same fact, such as `dishwasherSafe: true`. The script only searches strings.
2. **Show the change list.** One row per field, with the document, the field, the old value and the new value. Keep each edit as small as the fact allows. Changing `28` to `14` is safe. Rewriting a paragraph needs the user to read it.
3. **Write the patches file**, for example `kb-patches.json` in the project folder.
   ```json
   [
     { "id": "faq-main", "set": { "items[_key==\"ret\"].answer": "You have 14 days from delivery to send anything back." } },
     { "id": "product-dripper", "set": { "dishwasherSafe": false }, "unset": ["legacyNote"] }
   ]
   ```
   Paths use Sanity's patch syntax. Address array items by `_key`, never by index.
4. **Dry run, then apply.**
   ```
   node <skill-folder>/scripts/kb-patch.mjs <project-id> <dataset> kb-patches.json --dry-run
   node <skill-folder>/scripts/kb-patch.mjs <project-id> <dataset> kb-patches.json
   ```
   Without `--publish` it writes drafts. Tell the user to review and publish them in Studio, and wait until they have. The Knowledge Base only reads published documents. With `--publish` it patches the published documents directly.
5. **Handle what the script can't reach.**
   - A losing claim in a file source. Correct the file, delete the old import and add the new file. Files never re-sync.
   - A losing claim hardcoded in the site's code, such as a banner in a layout component. Report the file and line. It isn't Sanity content.
6. **Verify.** Query the changed fields with `npx sanity documents query` and confirm the new values are published.
7. **Refresh, then rebuild.** The order matters. A build reuses the content from the last import, so a rebuild straight after an edit still sees the old text.
   ```
   npx sanity context refresh <kb-id>
   npx sanity context jobs get <kb-id> <job-id> --watch
   npx sanity context get <kb-id> --json
   npx sanity context build <kb-id> --watch
   ```
   After the refresh, `pendingChanges.changed` should count the documents you edited. If it shows 0, the edits aren't published or the query doesn't match those documents.
8. **Run stage 3 again.** Expect no open conflicts. Dismiss stale issues that quote the old text. If a new conflict appears, print it as a choice like before.
9. **Record it.** Fill in "Resolutions" in `kb-setup.md` with the picks, the documents corrected and the final issue count. Delete `kb-patches.json` or keep it out of version control.

## What a finished run looks like

`state` is `ready`, open conflicts are 0, `instructionCount` equals the number of picks, and `pendingChanges` is all zeros. Go to stage 6.
