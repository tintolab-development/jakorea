/**
 * admin-unused-components.md 생성
 * - admin-reachable-graph-output.json 의 unreachableTsxRelative
 * - auth-users-reachable.mjs 도달 집합 제외
 * - 경로에 drawer 포함 시 제외
 *
 * 실행: node scripts/build-admin-unused-components-doc.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS_ROOT = path.join(__dirname, '..')
const SRC = path.join(CMS_ROOT, 'src')
const DOCS = path.join(CMS_ROOT, 'docs')

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

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walkTsFiles(p, out)
    else if (name.endsWith('.ts') || name.endsWith('.tsx')) out.push(p)
  }
  return out
}

function readAuthReachableJson() {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'auth-users-reachable.mjs')], {
    encoding: 'utf8',
    cwd: CMS_ROOT,
  })
  if (r.status !== 0) {
    console.error(r.stderr)
    process.exit(r.status ?? 1)
  }
  return r.stdout.trim()
}

function collectFilteredUnused() {
  const graphPath = path.join(DOCS, 'admin-reachable-graph-output.json')
  const j = JSON.parse(fs.readFileSync(graphPath, 'utf8'))
  const unreachable = j.unreachableTsxRelative
  const authReachable = new Set(JSON.parse(readAuthReachableJson()))
  return unreachable
    .filter(p => !authReachable.has(p))
    .filter(p => !p.toLowerCase().includes('drawer'))
    .sort()
}

/**
 * @/경로 기준 문자열이 다른 파일 본문에 있으면 참조로 간주 (본인 제외).
 */
function staticReferenceCount(relFromSrc, allFiles, fileContentCache) {
  const abs = path.join(SRC, relFromSrc)
  const modNoExt = relFromSrc.replace(/\.tsx?$/, '')
  const needles = [`@/${modNoExt}`, `@/${modNoExt}.tsx`, `@/${modNoExt}.ts`]
  let count = 0
  for (const f of allFiles) {
    if (path.normalize(f) === path.normalize(abs)) continue
    const c = fileContentCache.get(f) ?? ''
    if (needles.some(n => c.includes(n))) count++
  }
  return count
}

function findOrphanCandidates(unusedRelPaths) {
  const allFiles = walkTsFiles(SRC)
  const cache = new Map()
  for (const f of allFiles) {
    cache.set(f, fs.readFileSync(f, 'utf8'))
  }
  return unusedRelPaths.filter(rel => staticReferenceCount(rel, allFiles, cache) === 0).sort()
}

function main() {
  const graphPath = path.join(DOCS, 'admin-reachable-graph-output.json')
  const j = JSON.parse(fs.readFileSync(graphPath, 'utf8'))
  const rawUnreachable = j.unreachableTsxRelative
  const authReachable = new Set(JSON.parse(readAuthReachableJson()))
  const afterAuth = rawUnreachable.filter(p => !authReachable.has(p))
  const authExcluded = rawUnreachable.length - afterAuth.length
  const afterDrawer = afterAuth.filter(p => !p.toLowerCase().includes('drawer'))
  const drawerExcluded = afterAuth.length - afterDrawer.length
  const unused = afterDrawer.sort()

  const orphans = findOrphanCandidates(unused)
  const generatedAt = new Date().toISOString()

  let sections = ''
  for (const [key, files] of groupBySecondLevel(unused)) {
    sections += `## \`${key}/\`\n\n`
    for (const f of files.sort()) {
      sections += `- \`${f}\`\n`
    }
    sections += '\n'
  }

  let orphanBlock = ''
  if (orphans.length > 0) {
    orphanBlock =
      `---

## 별칭 \`@/\` 미참조 후보 (위 미사용 목록 중)

다른 소스 파일 본문에 \`@/pages/…\`, \`@/features/…\`, \`@/shared/…\` 등 **별칭 경로 문자열**이 나타나지 않는 항목입니다.

- 라우터만 동적 \`import('@/pages/…')\`로 묶인 **페이지**는 전형적인 **오탐**입니다.
- **상대 경로**(\`./teacher-detail-modal\` 등)로만 묶인 컴포넌트도 **오탐**입니다.
- 그 외는 실제 미연결(고아) 가능성이 있어 정리 후보로 보면 됩니다.

총 **${orphans.length}**개.

`
    for (const o of orphans) {
      orphanBlock += `- \`${o}\`\n`
    }
    orphanBlock += '\n'
  }

  const md = `# ADMIN 실접근 기준 미사용 후보 컴포넌트 (.tsx) — 인증·회원 관리 경로 제외

**출처:** [admin-used-unused-components.md](./admin-used-unused-components.md)의 미사용 항목에서, 아래 **추가 제외**를 적용한 목록입니다.

**1차 판정:** \`canAccessPath(path, 'ADMIN') === true\` 시드에서 **정적 import**만 따라간 미도달 \`.tsx\` ([\`scripts/admin-reachable-modules.mjs\`](../scripts/admin-reachable-modules.mjs)).

**추가 제외 (본 문서):** 다음 페이지를 시드로 한 **정적 import** 도달 집합에 포함되는 \`.tsx\`는 “로그인·회원가입·회원 관리 화면에서 실제 사용”으로 보고 목록에서 뺐습니다. 시드는 [\`scripts/auth-users-reachable.mjs\`](../scripts/auth-users-reachable.mjs)의 \`SEED_FILES\`와 동일합니다.

인증: \`pages/auth/login-page.tsx\`, \`pages/auth/register-page.tsx\`, \`pages/auth/mfa-page.tsx\`. 회원 관리(\`/users\`): \`pages/users/user-list-page.tsx\`, \`pages/users/participant-list-page.tsx\`, \`pages/users/instructor-list-page.tsx\`.

**별도 제외:** 경로·파일명에 \`drawer\`가 포함된 \`.tsx\`는 목록에서 제외합니다.

**스캔 범위:** \`src/pages\`, \`src/features\`, \`src/widgets\`, \`src/entities\`, \`src/shared\` 하위 \`.tsx\`.

**총 ${unused.length}개 파일** (미도달 ${rawUnreachable.length}개 − 인증·\`/users\` 정적 도달 ${authExcluded}개 − drawer 경로 ${drawerExcluded}개). 동적 import·문자열 경로는 미반영이므로 [admin-component-inventory.md](./admin-component-inventory.md)의 한계도 적용됩니다.

*생성: ${generatedAt}*

---

${sections}${orphanBlock}---

## 갱신 방법

1. \`cd apps/cms && node scripts/admin-reachable-modules.mjs\`
2. \`node scripts/build-admin-unused-components-doc.mjs\` (본 문서)
3. 시드 변경 시 \`scripts/auth-users-reachable.mjs\`의 \`SEED_FILES\`만 수정하면 됩니다.
`

  const outPath = path.join(DOCS, 'admin-unused-components.md')
  fs.writeFileSync(outPath, md, 'utf8')
  console.error(
    'Wrote',
    outPath,
    '| unused:',
    unused.length,
    '| orphan @/ ref=0:',
    orphans.length
  )
}

main()
