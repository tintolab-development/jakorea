/**
 * BI 소개 관리 — localStorage mock (API 연동 전)
 */

import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'

const STORAGE_KEY = 'admin.jakorea.jaKoreaBi.v1'

export const JA_KOREA_BI_CHANGED_EVENT = 'jakorea:ja-korea-bi-changed' as const

type BiFile = {
  version: 1
  data: JaKoreaBi
}

function buildSeedBi(): JaKoreaBi {
  return {
    title: '브랜드 아이덴티티',
    mainText:
      'JA Korea의 심볼과 로고는 JA 교육을 통해 청소년들이 함께 성장하고 나아가는 모습을 담고 있습니다.',
    subText:
      "A 브랜드의 초기 모델인 ‘새’의 형상을 바탕으로, 청소년들이 교육을 통해 얻은 지식과 기술, 유연한 사고방식을 세상과 나누며 글로벌 사회에 긍정적인 영향력을 펼쳐가는 모습을 ‘날개’라는 시각적 상징으로 표현했습니다.",
    updatedAt: '2026-07-01T00:00:00.000Z',
    version: 0,
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeBi(raw: Partial<JaKoreaBi> | null | undefined): JaKoreaBi {
  const seed = buildSeedBi()
  if (!raw || typeof raw !== 'object') return seed
  return {
    title: asString(raw.title, seed.title),
    mainText: asString(raw.mainText, seed.mainText),
    subText: asString(raw.subText, seed.subText),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
    version: typeof raw.version === 'number' ? raw.version : 0,
  }
}

function readBiFile(): BiFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedBi() }
    const parsed = JSON.parse(raw) as BiFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedBi() }
    }
    return { version: 1, data: normalizeBi(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedBi() }
  }
}

function writeBiFile(file: BiFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(JA_KOREA_BI_CHANGED_EVENT))
}

export function readJaKoreaBi(): JaKoreaBi {
  const file = readBiFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeBiFile(file)
  }
  return file.data
}

export function saveJaKoreaBi(data: JaKoreaBi): JaKoreaBi {
  const next = normalizeBi({
    title: data.title.trimEnd(),
    mainText: data.mainText.trimEnd(),
    subText: data.subText.trimEnd(),
    updatedAt: new Date().toISOString(),
    version: data.version ?? 0,
  })
  writeBiFile({ version: 1, data: next })
  return next
}
