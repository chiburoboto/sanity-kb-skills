# Stage 3. Check

Run this after every build. It ends with the conflicts on screen as choices.

## Steps

1. Run `npx sanity context get <kb-id> --json` for `state`, `openIssueCount`, `instructionCount`, `lastChangedAt` and `pendingChanges`.
2. List the open issues from the project folder.
   ```
   node <skill-folder>/scripts/kb-issues.mjs <kb-id> --status open --json
   ```
   Drop `--json` for a readable list. `openIssueCount` can be lower than the number the script returns, because it leaves out some suggestions.
3. Compare the build with the plan.
   - Look for topics from the plan's outline that are missing. The CLI doesn't return the outline. The issues' entry paths show part of it. The full outline needs the dashboard's Entries tab, or `kb-mcp-check.mjs` once an endpoint exists.
   - Look for conflicts that section 10 of the sheet expected and the build didn't raise. Name each one and where it lives. A page-level check has to catch those, because the build won't.
4. Check every open issue against the current documents. A build doesn't close issues filed by an earlier build, so an issue can quote text that has since changed. Mark those as stale.
5. Append the results to `kb-setup.md` under "Build results".
6. Print the choices, then stop and wait.

## The choice format

Use plain text, never an interactive widget. Plain text works in every agent, and the user can answer in one line.

```
1. Free UK delivery threshold
   A. Over £50   ← the delivery policy says this
   B. Over £75   (from the FAQ)

2. Skillet in the dishwasher
   A. No, hand wash only   ← the care guide says this
   B. Yes                  (from the product description)

Reply with your picks, for example: 1A 2A. Skip any you're unsure of.
```

- **A** is the issue's `currentClaim`, which is what the Knowledge Base says now. **B** is its `alternativeClaim`.
- Mark the side the authoritative source supports, such as a policy, the legal terms or a spec sheet. Don't pick for the user.
- Shorten long claims to the fact that differs. Keep the numbers exact.
- Two issues can be the same fact with the sides swapped. Say so, so the answers agree.
- List suggestions and gaps after the conflicts, under their own heading. Those get applied or dismissed, not resolved.
- List stale issues last, with an offer to dismiss them.
- If a conflict's A and B are both wrong, the user can say so. Stage 4 covers that.

If there are no open conflicts, say so, report the missed conflicts from step 3, and go to stage 6.
