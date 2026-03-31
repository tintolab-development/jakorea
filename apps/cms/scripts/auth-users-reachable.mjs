/**
 * 로그인·회원가입·MFA·/users 회원 관리 페이지 시드 기준 정적 import 도달 .tsx
 * (admin-unused-components.md 필터용)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS_ROOT = path.join(__dirname, '..')
const SRC = path.join(CMS_ROOT, 'src')

const SEED_FILES = [
  'pages/auth/login-page.tsx',
  'pages/auth/register-page.tsx',
  'pages/auth/mfa-page.tsx',
  'pages/users/user-list-page.tsx',
  'pages/users/participant-list-page.tsx',
  'pages/users/instructor-list-page.tsx',
]

const importRe =
  /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,/$]+?\s+from\s+)?['"]([^'"]+)['"]/g

function resolveModule(fromFileAbs, spec) {
  if (spec.startsWith('@/')) {
    const rel = spec.slice(2)
    const base = path.join(SRC, rel)
    const candidates = [
      base,
      `${base}.tsx`,
      `${base}.ts`,
      path.join(base, 'index.tsx'),
      path.join(base, 'index.ts'),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
    }
    return null
  }
  if (spec.startsWith('.')) {
    const fromDir = path.dirname(fromFileAbs)
    const base = path.resolve(fromDir, spec)
    const candidates = [
      base,
      `${base}.tsx`,
      `${base}.ts`,
      path.join(base, 'index.tsx'),
      path.join(base, 'index.ts'),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
    }
  }
  return null
}

function extractSpecs(content) {
  const specs = new Set()
  let m
  importRe.lastIndex = 0
  while ((m = importRe.exec(content)) !== null) {
    const s = m[1]
    if (s.startsWith('@/') || s.startsWith('.')) specs.add(s)
  }
  return [...specs]
}

function bfs() {
  const visited = new Set()
  const queue = []
  for (const rel of SEED_FILES) {
    const abs = path.join(SRC, rel)
    if (fs.existsSync(abs)) {
      visited.add(abs)
      queue.push(abs)
    }
  }
  while (queue.length) {
    const file = queue.shift()
    const ext = path.extname(file)
    if (!['.ts', '.tsx'].includes(ext)) continue
    let content
    try {
      content = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const spec of extractSpecs(content)) {
      const next = resolveModule(file, spec)
      if (
        next &&
        next.startsWith(SRC) &&
        (next.endsWith('.ts') || next.endsWith('.tsx')) &&
        !visited.has(next)
      ) {
        visited.add(next)
        queue.push(next)
      }
    }
  }
  return visited
}

const reachableRel = [...bfs()]
  .filter(f => f.endsWith('.tsx'))
  .map(a => path.relative(SRC, a))
  .sort()

console.log(JSON.stringify(reachableRel, null, 2))
