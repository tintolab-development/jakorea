/**
 * P8 ratchet 규칙 — overlay 동기화 모듈(`*-overlay-sync`)과 `scoped-overlay-store` import 금지.
 * 정본은 RHF(폼 값)이고 저장은 serviceDetailJson.registration.overlay 직렬화기만 쓴다.
 * 기존 사용처는 overlay-sync-import-allowlist.json 에 고정하고, 목록은 줄이기만 한다.
 * (UJAT·Gemini·TT 는 동작 불변 제약으로 스토어를 계속 쓴다 → 해당 파일도 allowlist.)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')
const allowlist = new Set(
  JSON.parse(readFileSync(path.join(here, 'overlay-sync-import-allowlist.json'), 'utf8')).files
)

const FORBIDDEN = /(?:-overlay-sync|scoped-overlay-store)$/

function relativeFile(filename) {
  return path.relative(repoRoot, filename).split(path.sep).join('/')
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid new imports of overlay sync modules / scoped overlay store' },
    schema: [],
    messages: {
      forbidden:
        "'{{source}}' 는 overlay 동기화 모듈입니다. 새 사용처에서 import 금지 — RHF 폼 값과 registration.overlay 직렬화기를 쓰세요. (기존 사용처 목록: tools/eslint/overlay-sync-import-allowlist.json, 줄이기만 가능)",
    },
  },
  create(context) {
    const file = relativeFile(context.filename ?? context.getFilename())
    if (allowlist.has(file)) return {}
    const check = (node, source) => {
      if (typeof source !== 'string' || !FORBIDDEN.test(source)) return
      context.report({ node, messageId: 'forbidden', data: { source } })
    }
    return {
      ImportDeclaration(node) {
        check(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value)
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value)
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node, node.source.value)
      },
    }
  },
}

export default {
  meta: { name: 'jakorea-overlay' },
  rules: { 'no-overlay-sync-import': rule },
}
