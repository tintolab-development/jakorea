/**
 * ADMIN canAccessPath 기준 시드 페이지 + 레이아웃 셸에서 도달 가능한
 * @/ 및 상대 경로 모듈을 BFS로 수집합니다. (정적 import / re-export만)
 *
 * 실행: node scripts/admin-reachable-modules.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS_ROOT = path.join(__dirname, '..')
const SRC = path.join(CMS_ROOT, 'src')

/** ADMIN 실제 콘텐츠 진입점(플랜·canAccessPath와 동일) + 레이아웃 셸 + 레이아웃이 참조하는 ACL */
const SEED_FILES = [
  'widgets/layout/layout.tsx',
  'widgets/layout/sidebar.tsx',
  'widgets/layout/main-header.tsx',
  'widgets/layout/header.tsx',
  'features/permission-request/lib/program-acl.ts',
  'pages/home/index-page.tsx',
  'pages/dashboard.tsx',
  'pages/programs/program-list-page.tsx',
  'pages/programs/education-program-layout.tsx',
  'pages/programs/education-enrollment-page.tsx',
  'pages/programs/program-detail-page.tsx',
  'pages/programs/program-form-page.tsx',
  'pages/programs/program-application-page.tsx',
  'pages/programs/program-application-complete-page.tsx',
  'pages/error/coming-soon-page.tsx',
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

function groupBySecondLevel(paths) {
  const m = new Map()
  for (const p of paths) {
    const parts = p.split('/')
    const key = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0]
    if (!m.has(key)) m.set(key, [])
    m.get(key).push(p)
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function mdUsedUnusedSection(title, paths) {
  let s = `## ${title}\n\n`
  s += `총 **${paths.length}**개 파일.\n\n`
  s += '> 판정 기준·한계는 [admin-component-inventory.md](./admin-component-inventory.md)를 참고하세요.\n\n'
  for (const [key, files] of groupBySecondLevel(paths)) {
    s += `### \`${key}/\`\n\n`
    for (const f of files.sort()) {
      s += `- \`${f}\`\n`
    }
    s += '\n'
  }
  return s
}

function writeUsedUnusedMarkdown(reachableRel, unreachableRel) {
  const used = reachableRel.filter(f => f.endsWith('.tsx')).sort()
  const unused = unreachableRel.slice().sort()
  const header = `# ADMIN 실접근 기준 사용 중 / 미사용 컴포넌트 목록

**기준:** \`canAccessPath(path, 'ADMIN') === true\` 인 화면에 대응하는 페이지·레이아웃 시드에서 **정적 import**만 따라간 도달 집합( [\`scripts/admin-reachable-modules.mjs\`](../scripts/admin-reachable-modules.mjs) ).

| 구분 | .tsx 개수 |
|------|-----------|
| 사용 중 (도달 가능) | ${used.length} |
| 미사용 후보 (스캔 범위 내 미도달) | ${unused.length} |

스캔 범위: \`src/pages\`, \`src/features\`, \`src/widgets\`, \`src/entities\`, \`src/shared\` 하위 \`.tsx\`.

---

`
  const footer = `---

## 갱신 방법

이 파일은 아래 명령으로 \`admin-reachable-graph-output.json\`과 함께 갱신됩니다.

\`\`\`bash
cd apps/cms && node scripts/admin-reachable-modules.mjs
\`\`\`
`
  const mdPath = path.join(CMS_ROOT, 'docs', 'admin-used-unused-components.md')
  const body =
    mdUsedUnusedSection('사용 중 컴포넌트 (.tsx)', used) +
    '---\n\n' +
    mdUsedUnusedSection('미사용 후보 컴포넌트 (.tsx)', unused) +
    footer
  fs.writeFileSync(mdPath, header + body, 'utf8')
  return mdPath
}

function collectTsxUnder(relDir) {
  const dir = path.join(SRC, relDir)
  const out = []
  function walk(d) {
    if (!fs.existsSync(d)) return
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name)
      const st = fs.statSync(p)
      if (st.isDirectory()) walk(p)
      else if (name.endsWith('.tsx')) out.push(p)
    }
  }
  walk(dir)
  return out
}

function main() {
  const reachable = bfs()
  const reachableRel = [...reachable].map(a => path.relative(SRC, a)).sort()

  const scanDirs = ['pages', 'features', 'widgets', 'entities', 'shared']
  const allTsx = []
  for (const d of scanDirs) allTsx.push(...collectTsxUnder(d))

  const unreachable = allTsx.filter(a => !reachable.has(a)).sort()
  const unreachableRel = unreachable.map(a => path.relative(SRC, a))

  console.log(JSON.stringify({
    seedCount: SEED_FILES.length,
    reachableModuleCount: reachable.size,
    reachableTsxCount: [...reachable].filter(f => f.endsWith('.tsx')).length,
    scannedTsxCount: allTsx.length,
    unreachableTsxCount: unreachable.length,
    unreachableTsxSample: unreachableRel.slice(0, 80),
  }, null, 2))

  const reportPath = path.join(CMS_ROOT, 'docs', 'admin-reachable-graph-output.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedNote:
          '정적 import만 추적. 동적 import(lazy), 문자열 경로, 런타임 조건 분기는 미포함.',
        seeds: SEED_FILES,
        reachableRelative: reachableRel,
        unreachableTsxRelative: unreachableRel,
      },
      null,
      2
    ),
    'utf8'
  )
  console.error('Wrote', reportPath)

  const mdPath = writeUsedUnusedMarkdown(reachableRel, unreachableRel)
  console.error('Wrote', mdPath)
}

main()
