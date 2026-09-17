# Stage 3. Check

Run this after every build. The goal is to move the Knowledge Base from Built to Reviewed. That takes three kinds of evidence, because each one misleads when read alone.

| Evidence | Tells you | Misses |
|---|---|---|
| The source claims, from section 10 of the sheet and your own reading of the content | Disagreements found in the material you inspected | Uninspected claims, contextual exceptions, and evidence of which claim is correct |
| The entries the build wrote | Which claim the Knowledge Base actually kept | Whether anyone was told |
| The issues list | Which disagreements the build raised | Everything it settled silently |

In testing, a build kept "we ship to the US" from an FAQ against a delivery policy that said UK and Ireland only, and listed a wrong £30 offer as a live promotion. It raised no issue for either. The issues list looked fine. Only the entries showed it.

## Steps

1. Run `npx sanity context get <kb-id> --json` for `state`, `openIssueCount`, `instructionCount`, `lastChangedAt` and `pendingChanges`.
2. Read the entries. `api.md` shows `entries.list()` and `entries.get({ path })`. This works before any MCP endpoint exists. If an endpoint is already connected to you, `initial_context` and `knowledge_base_read` return the same text.
3. List the open issues with `node <skill-folder>/scripts/kb-issues.mjs <kb-id> --status open --json`, run from the project folder. `openIssueCount` can be lower than the list, because it leaves out some suggestions.
4. Build the comparison. Use one row per disagreement you know of, from section 10 plus any you spot while reading the entries.

   | Fact | Source claims | The entry says | Issue raised? |
   |---|---|---|---|
   | Countries delivered to | Policy: UK and Ireland. FAQ: also the US | "UK, Ireland and the US" | No |

   A row with "No" in the last column is a silent settlement. Those matter most. If the entry kept the wrong claim, agents are giving wrong answers now.
5. Check each open issue against the current documents. A build doesn't close issues from earlier builds, so an issue can quote text that has since changed. Mark those as stale.
6. Compare the outline with the plan's, and note missing topics. Also note any claim in an entry that no source makes. In testing a build added a Friday dispatch rule that appeared nowhere in the content.
7. Append the table and the counts to `kb-setup.md` under "Build results".
8. Print the choices, then stop and wait.

## The choice format

Use plain text, never an interactive widget. Plain text works in every agent, and the user can answer in one line.

```
Raised by the build

1. Free UK delivery threshold
   A. Over £50   ← the delivery policy says this
   B. Over £75   (from the FAQ)

Settled silently by the build, no issue raised

2. Countries delivered to. The entry currently says "UK, Ireland and the US".
   A. UK and Ireland only   ← the delivery policy says this
   B. Also the US           (from the FAQ)

Reply with your picks, for example: 1A 2A. Skip any you're unsure of.
```

- For a raised conflict, **A** is the issue's `currentClaim`, which is what the Knowledge Base says now, and **B** is its `alternativeClaim`.
- A silent settlement has no issue to resolve. The pick decides which documents stage 5 corrects. Say that, so the user knows nothing gets "resolved" for those.
- Mark the side the authoritative source supports, such as a policy, the legal terms or a spec sheet. Don't pick for the user.
- Shorten long claims to the fact that differs. Keep the numbers exact.
- Two issues can be the same fact with the sides swapped. Say so, so the answers agree.
- List suggestions, gaps and stale issues last, under their own headings. Those get applied or dismissed, not resolved.

## After the choices

- If the user picks winners, go to stage 4.
- If the user wants the conflicts kept, for a demo or a test, record that in `kb-setup.md`. The state is Reviewed. Go to stage 6 if they want an agent connected, and don't resolve or fix anything.
- If there is nothing to pick, because the build raised nothing and your comparison found nothing, say that both checks came back empty. A build can still hide something neither check caught.

Never move on with a known disagreement unreported, even when the issues list is empty.
