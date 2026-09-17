# Type roles and query rules

## Roles

Give every document type exactly one role, with a one-line reason. If a type doesn't fit, say so rather than forcing it.

| Role | What it holds | Default |
|---|---|---|
| Fact | Policies, product specs, FAQs, help articles, knowledge documents | Include, projected to the fields that state facts |
| Page content | Pages built from page-builder blocks, including the homepage | Include text fields only, and record the homepage decision |
| Editorial | Blog posts, news, case studies, author bios | Exclude from a support Knowledge Base. They date quickly and argue positions. A separate Knowledge Base if needed |
| Structural | Navigation, footer, settings, redirects | Exclude. Keep only settings fields that state a fact, such as a contact email |
| Live data | Prices, stock, availability | Exclude. A compiled index goes stale on anything that changes daily |
| System | `sanity.*`, `media.*`, `mux.*`, `assist.*` | Exclude |

## Projection rules

- **Keep every field that states a fact, whatever its type.** That means text, and also booleans and numbers such as `dishwasherSafe`, a capacity, a weight or a warranty length. In testing, a `dishwasherSafe: true` flag contradicted the care text, and the build could only see that because the query kept the flag. Drop slugs, images, video, buttons, links, icons, SEO and Open Graph fields, which add noise and no facts.
- **Convert Portable Text** with `pt::text(field)` so the build reads prose, not block JSON.
- **Page-builder arrays**: project each block's text fields and keep `_type`, so an entry can say which kind of block a claim came from. Fields a block doesn't have come back as null, which is harmless.
- **Don't follow references to documents the query already reads.** If FAQ blocks reference FAQ documents and the query reads FAQ documents directly, following the reference indexes each answer twice and muddies citations.
- **List every field left out of a fact type.** A dropped field can hide a contradiction. In testing, a product `description` said a skillet was dishwasher safe while the care guide said hand wash only. Dropping `description` would have hidden that conflict from the build.

## Query shape

One query, one projection branch per type:

```groq
*[_type in ['typeA', 'typeB']]{
  _type,
  _type == 'typeA' => { title, 'body': pt::text(body) },
  _type == 'typeB' => { name, spec, warranty }
}
```

Check before writing it into the sheet:

- It starts with `*[`. A bare filter is rejected.
- Every type in the filter exists in the schema and has published documents. A query matching nothing is rejected.
- The total match is at most 5,000. Split a large catalogue by narrowing the filter, and note it.
- Document ids contain no dots. Sanity reads the part before a dot as a version namespace, so `product.skillet` never appears in the published perspective and is never indexed. Flag any such ids.

## The homepage decision

Homepage and campaign copy (hero badges, promo banners, call-to-action blocks) is where unchecked claims usually live, and the build may give it little weight.

- **Include it** and the build may quietly ignore it without raising a conflict.
- **Exclude it** and only a check against the live page will ever catch it.

Either choice is fine. Write it down in the sheet's decisions section so the team knows where to look.

If you include it, don't list it under the purpose's "Leave out" line. The build reads the purpose at every stage and drops what it says to leave out, so the homepage's claims would never be checked.

## Files and instructions

- Each file is the authority for the facts it holds. Name those facts in the sheet.
- Instructions are corrections of one specific fact, tied to the documents that state it. They are added after the first build, not before, because an instruction overrides the sources and would stop the conflict from appearing as an issue.
- An instruction is archived when every source it is tied to is dropped. Re-uploading a file drops it. Tie any file-based instruction to a dataset document as well.

## Endpoints

An endpoint serving both a dataset and Knowledge Bases serves the dataset and silently ignores the Knowledge Bases. The Knowledge Base endpoint gets the Knowledge Base only.
