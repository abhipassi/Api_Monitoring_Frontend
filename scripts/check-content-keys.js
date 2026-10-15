// Every `content.a.b.c` used in the code (directly, or through `const text = content.a.b` and then
// `text.c`) must exist in src/content, so a typo can't show "undefined" to a customer.
// Run by `npm run lint`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = new URL('../src', import.meta.url).pathname
const { content } = await import(pathToFileURL(join(SRC, 'content', 'index.js')).href)

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const resolves = (path) => {
  let node = content
  for (const key of path.split('.').filter(Boolean)) {
    if (node == null || typeof node === 'function') return true // past a function: not checkable
    if (!(key in Object(node))) return false
    node = node[key]
  }
  return true
}

const problems = []

for (const file of walk(SRC)) {
  if (!/\.(js|jsx)$/.test(file) || file.includes(`${join(SRC, 'content')}`) || /\.test\./.test(file)) continue
  const source = readFileSync(file, 'utf8')

  // alias name -> the content paths it was assigned in this file
  const aliases = new Map()
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*content((?:\.\w+)+)\s*$/gm)) {
    aliases.set(match[1], [...(aliases.get(match[1]) ?? []), match[2]])
  }

  const report = (reference) => problems.push(`${relative(process.cwd(), file)}: ${reference}`)

  for (const match of source.matchAll(/\bcontent((?:\.\w+)+)/g)) {
    if (!resolves(match[1])) report(`content${match[1]}`)
  }
  for (const [name, bases] of aliases) {
    for (const match of source.matchAll(new RegExp(`\\b${name}((?:\\.\\w+)+)`, 'g'))) {
      if (!bases.some((base) => resolves(base + match[1]))) report(`${name}${match[1]}  (from ${bases.map((b) => 'content' + b).join(' or ')})`)
    }
  }
}

if (problems.length) {
  console.error(`\nContent keys that do not exist (${problems.length}):\n`)
  console.error([...new Set(problems)].join('\n'))
  process.exit(1)
}
console.log('Content keys: OK')
