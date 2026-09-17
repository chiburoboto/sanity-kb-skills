#!/usr/bin/env node
/**
 * Find every field in a dataset that contains a piece of text.
 *
 *   node kb-find.mjs <project-id> <dataset> "<text>" [--drafts] [--json]
 *
 * Use it to find every copy of a losing claim before correcting it, since
 * Knowledge Base issues only cite the sources the build noticed. The search is
 * case-insensitive and covers published documents. Add --drafts to include
 * drafts. Read-only.
 *
 * Run it from a Sanity project folder. It borrows the project's Sanity CLI and
 * its login, so run `npx sanity login` first.
 */
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_VERSION = 'v2025-08-15'

const args = process.argv.slice(2)
const withDrafts = args.includes('--drafts')
const asJson = args.includes('--json')
const [projectId, dataset, text] = args.filter((arg) => !arg.startsWith('--'))

if (!projectId || !dataset || !text) {
  console.error('Usage: node kb-find.mjs <project-id> <dataset> "<text>" [--drafts] [--json]')
  process.exit(1)
}

async function loadCliCore() {
  const fromProject = createRequire(join(process.cwd(), 'package.json'))
  for (const entry of ['@sanity/cli/package.json', 'sanity/package.json']) {
    try {
      const fromCli = createRequire(fromProject.resolve(entry))
      return await import(pathToFileURL(fromCli.resolve('@sanity/cli-core')).href)
    } catch {
      // try the next entry
    }
  }
  console.error('Could not find the Sanity CLI in this folder. Run this from a project with `sanity` installed.')
  process.exit(1)
}

const { getProjectCliClient } = await loadCliCore()
const client = await getProjectCliClient({
  apiVersion: API_VERSION,
  projectId,
  dataset,
  requireUser: true,
  useCdn: false,
  perspective: 'raw',
})

const filter = withDrafts
  ? '*[!(_id in path("_.**")) && !(_type match "system.*") && !(_type match "sanity.*")]'
  : '*[!(_id in path("_.**")) && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && !(_type match "system.*") && !(_type match "sanity.*")]'

let documents
try {
  documents = await client.fetch(filter)
} catch (error) {
  console.error(`Could not read ${projectId}/${dataset}: ${error.message}`)
  process.exit(1)
}

const needle = text.toLowerCase()
const matches = []

function walk(value, path, doc) {
  if (typeof value === 'string') {
    if (value.toLowerCase().includes(needle)) matches.push({ id: doc._id, type: doc._type, path, value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const key = item && typeof item === 'object' && item._key ? `[_key=="${item._key}"]` : `[${index}]`
      walk(item, `${path}${key}`, doc)
    })
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith('_')) continue
      walk(child, path ? `${path}.${key}` : key, doc)
    }
  }
}

for (const doc of documents) walk(doc, '', doc)

if (asJson) {
  console.log(JSON.stringify(matches, null, 2))
  process.exit(0)
}

console.log(`"${text}" in ${projectId}/${dataset}: ${matches.length} match(es) across ${documents.length} documents.\n`)
for (const match of matches) {
  console.log(`${match.id} (${match.type})`)
  console.log(`   Path:  ${match.path}`)
  console.log(`   Value: ${match.value.length > 200 ? `${match.value.slice(0, 200)}...` : match.value}\n`)
}
if (!matches.length) console.log('Nothing found. The claim may live in a file source or in the site code.')
