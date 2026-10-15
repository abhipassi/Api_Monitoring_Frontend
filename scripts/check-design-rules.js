// Enforces the project's UI rules on everything under src/. Run by `npm run lint`.
//
//   1. no inline CSS (style={...})
//   2. no raw colours outside src/index.css (use the tokens: bg-surface, text-fg-muted, ...)
//   3. no Tailwind arbitrary values (w-[137px], bg-[#fff]): use the scale / add a token
//   4. no literal user-facing text in attributes (placeholder, title, aria-label, alt, label):
//      text lives in src/content/
//   5. no hard-coded URLs (they come from .env via src/config/env.js)
//
// A line can opt out with a trailing "// design-ok: reason", used sparingly.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SRC = new URL('../src', import.meta.url).pathname
const TOKENS_FILE = join(SRC, 'index.css')
const ENV_FILE = join(SRC, 'config', 'env.js')
const CONTENT_DIR = join(SRC, 'content')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const isTest = (file) => /\.test\.(js|jsx)$/.test(file) || file.includes(`${sep}test${sep}`)
const isCode = (file) => /\.(js|jsx)$/.test(file)

const RULES = [
  {
    name: 'inline style',
    applies: (file) => isCode(file),
    test: (line) => /\bstyle\s*=\s*\{/.test(line),
  },
  {
    name: 'raw colour (use a token from index.css)',
    applies: (file) => (isCode(file) || file.endsWith('.css')) && file !== TOKENS_FILE,
    test: (line) => /(["'`(\s:,])#[0-9a-fA-F]{3,8}\b/.test(line) || /\b(rgb|rgba|hsl|hsla|oklch|oklab)\(/.test(line),
  },
  {
    name: 'Tailwind arbitrary value (use the scale or add a token)',
    applies: (file) => isCode(file),
    test: (line) => /(?:^|[\s"'`:])(?:[a-z0-9-]+:)*-?[a-z]+(?:-[a-z0-9]+)*-\[[^\]\s]+\]/.test(line),
  },
  {
    name: 'literal text in an attribute (move it to src/content)',
    applies: (file) => file.endsWith('.jsx'),
    test: (line) => /\b(placeholder|title|aria-label|aria-description|alt|label|description|emptyText)=["'][^"'{]+["']/.test(line),
  },
  {
    name: 'hard-coded URL (use src/config/env.js)',
    // Example addresses inside placeholder text (src/content) are copy, not configuration
    applies: (file) => isCode(file) && file !== ENV_FILE && !file.startsWith(CONTENT_DIR),
    test: (line) => /["'`]https?:\/\//.test(line),
  },
]

const failures = []

for (const file of walk(SRC)) {
  if (isTest(file)) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
    if (/\/\/\s*design-ok/.test(line)) return
    for (const rule of RULES) {
      if (rule.applies(file) && rule.test(line)) {
        failures.push(`${relative(process.cwd(), file)}:${i + 1}  ${rule.name}\n    ${trimmed.slice(0, 140)}`)
      }
    }
  })
}

if (failures.length) {
  console.error(`\nDesign rule violations (${failures.length}):\n`)
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Design rules: OK')
